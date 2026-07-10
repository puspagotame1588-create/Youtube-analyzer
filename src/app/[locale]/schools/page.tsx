'use client';

/** School Galaxy — spatial constellation + first-class list view. */

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { dataset } from '@/lib/data/seed';
import { useAppStore } from '@/lib/store/app';
import { useHydrated } from '@/components/ui/useHydrated';
import { SceneCanvas } from '@/components/three/SceneCanvas';
import { Badge } from '@/components/ui/Badge';
import { yen } from '@/lib/i18n/bi';
import type { InstitutionType } from '@/lib/data/types';

const GalaxyScene = dynamic(() => import('@/components/three/GalaxyScene').then((m) => m.GalaxyScene), {
  ssr: false,
  loading: () => null,
});

export default function SchoolsPage(): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';
  const hydrated = useHydrated();
  const [view, setView] = useState<'galaxy' | 'list'>('galaxy');
  const [typeFilter, setTypeFilter] = useState<InstitutionType | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const shortlist = useAppStore((s) => s.shortlist);
  const toggleShortlist = useAppStore((s) => s.toggleShortlist);

  const schools = useMemo(
    () =>
      dataset.schools.filter(
        (s) => s.provenance.verification === 'published' && (typeFilter === 'all' || s.institutionType === typeFilter),
      ),
    [typeFilter],
  );

  const selected = schools.find((s) => s.id === selectedId) ?? null;

  const SchoolCard = ({ s }: { s: (typeof schools)[number] }): React.JSX.Element => {
    const total = s.firstYearCostJpy + s.annualTuitionJpy * (s.programYears - 1);
    return (
      <article className="cv-glass cv-depth-card rounded-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-bold text-ink">{ja ? s.nameJa : s.nameEn}</h3>
          <div className="flex gap-1">
            {s.provenance.isDemo && <Badge tone="demo">{ja ? 'デモ' : 'Demo'}</Badge>}
            {s.sponsored && <Badge tone="sponsored">{ja ? 'スポンサー' : 'Sponsored'}</Badge>}
          </div>
        </div>
        <p className="mt-1 text-xs text-ink-soft">
          {s.institutionType === 'university' ? (ja ? '大学' : 'University') : ja ? '専門学校' : 'Vocational school'} ·{' '}
          {s.city.charAt(0).toUpperCase() + s.city.slice(1)} · {s.programYears}{ja ? '年' : ' yrs'} · JLPT {s.jlptRequired.toUpperCase()}
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-xs text-ink-soft">{ja ? '総学費（目安）' : 'Total tuition (est.)'}</dt>
            <dd className="font-semibold text-ink">{yen(total)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-soft">{ja ? '就職・進学率' : 'Outcomes'}</dt>
            <dd className="font-semibold text-ink">
              {s.employmentOutcome ? `${Math.round(s.employmentOutcome.value * 100)}%` : '—'}
              {s.employmentOutcome?.isDemo && <span className="ml-1 text-[10px] text-amber2">{ja ? '（デモ）' : '(demo)'}</span>}
            </dd>
          </div>
        </dl>
        {s.scholarshipIds.length > 0 && (
          <p className="mt-2 text-xs text-amber2">◎ {ja ? `奨学金 ${s.scholarshipIds.length}件` : `${s.scholarshipIds.length} scholarship(s)`}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/schools/${s.id}`} className="inline-flex min-h-[40px] items-center rounded-full bg-ink px-4 text-xs font-semibold text-white hover:bg-indigo2">
            {ja ? '詳細' : 'Details'}
          </Link>
          <button
            onClick={() => toggleShortlist(s.id)}
            aria-pressed={shortlist.includes(s.id)}
            className={`min-h-[40px] rounded-full border px-4 text-xs font-semibold ${
              shortlist.includes(s.id) ? 'border-emerald2 bg-emerald2/10 text-emerald2' : 'border-ink/10 bg-white/70 text-ink-soft hover:text-ink'
            }`}
          >
            {shortlist.includes(s.id) ? (ja ? '候補に追加済み ✓' : 'Shortlisted ✓') : ja ? '候補に追加' : 'Shortlist'}
          </button>
        </div>
      </article>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">{ja ? 'スクールギャラクシー' : 'School Galaxy'}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {ja
              ? '関東のデモ校を星座として表示。位置＝学費と実績、形＝大学/専門、金の輪＝奨学金あり。'
              : 'Kanto demo schools as a constellation. Position = cost & outcomes, shape = type, gold ring = scholarships.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'university', 'vocational'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              aria-pressed={typeFilter === f}
              className={`min-h-[40px] rounded-full border px-4 text-xs font-semibold ${
                typeFilter === f ? 'border-cyan2 bg-cyan2/10 text-cyan2' : 'border-ink/10 bg-white/60 text-ink-soft'
              }`}
            >
              {f === 'all' ? (ja ? 'すべて' : 'All') : f === 'university' ? (ja ? '大学' : 'Universities') : ja ? '専門学校' : 'Vocational'}
            </button>
          ))}
          <div role="group" aria-label={ja ? '表示切替' : 'View toggle'} className="flex overflow-hidden rounded-full border border-ink/10">
            {(['galaxy', 'list'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`min-h-[40px] px-4 text-xs font-semibold ${view === v ? 'bg-ink text-white' : 'bg-white/60 text-ink-soft'}`}
              >
                {v === 'galaxy' ? (ja ? '3D表示' : '3D view') : ja ? 'リスト表示' : 'List view'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {hydrated && view === 'galaxy' && (
        <div className="relative mt-6 h-[46svh] min-h-[340px] overflow-hidden rounded-panel border border-white/70 shadow-panel">
          <SceneCanvas
            label={ja ? '学校の星座ビュー' : 'School constellation view'}
            className="h-full w-full"
            camera={{ position: [0, 2.5, 8], fov: 50 }}
            fallback={
              <div className="flex h-full items-center justify-center bg-cv-hero p-6 text-center text-sm text-ink-soft cv-hero-gradient">
                {ja ? 'この端末では3D表示の代わりにリスト表示をご利用ください。' : 'On this device, please use the list view below.'}
              </div>
            }
          >
            <GalaxyScene schools={schools} selectedId={selectedId} onSelect={setSelectedId} locale={locale} />
          </SceneCanvas>
          {selected && (
            <div className="absolute bottom-3 left-1/2 w-[min(440px,92%)] -translate-x-1/2 rounded-panel bg-white/90 p-4 shadow-panel backdrop-blur">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-ink">{ja ? selected.nameJa : selected.nameEn}</p>
                  <p className="text-xs text-ink-soft">
                    {yen(selected.firstYearCostJpy)} {ja ? '初年度' : 'first year'} · JLPT {selected.jlptRequired.toUpperCase()}
                  </p>
                </div>
                <Link href={`/schools/${selected.id}`} className="shrink-0 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white">
                  {ja ? '開く' : 'Open'}
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      <div className={`mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${view === 'galaxy' ? '' : ''}`}>
        {schools.map((s) => (
          <SchoolCard key={s.id} s={s} />
        ))}
      </div>

      {hydrated && shortlist.length >= 2 && (
        <div className="mt-8 rounded-panel border border-emerald2/30 bg-emerald2/5 p-5 text-center">
          <p className="text-sm text-ink">
            {ja ? `${shortlist.length}校が候補に入っています。` : `${shortlist.length} schools shortlisted.`}
          </p>
          <Link href="/schools/compare" className="mt-3 inline-flex min-h-[44px] items-center rounded-full bg-emerald2 px-6 text-sm font-semibold text-white">
            {ja ? '候補校を比較する →' : 'Compare shortlisted schools →'}
          </Link>
        </div>
      )}

      <p className="mt-8 text-xs text-ink-soft">
        {ja
          ? '※ ベータ版のデータは明示的にラベル付けされたデモデータです。網羅的な学校リストではありません。'
          : '※ Beta data is clearly labeled demonstration data — not a complete list of schools.'}
      </p>
    </div>
  );
}
