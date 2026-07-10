'use client';

/**
 * Route Detail — full milestone timeline, recommended schools, career ladder
 * summary, visa note, and the complete "Why this result?" layer.
 */

import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { useAppStore } from '@/lib/store/app';
import { useHydrated } from '@/components/ui/useHydrated';
import { WhyPanel } from '@/components/universe/WhyPanel';
import { Badge } from '@/components/ui/Badge';
import { dataset } from '@/lib/data/seed';
import { yen, months } from '@/lib/i18n/bi';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

export default function RouteDetailPage(): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';
  const hydrated = useHydrated();
  const params = useParams<{ id: string }>();
  const result = useAppStore((s) => s.currentResult);
  const routeNames = useAppStore((s) => s.currentRouteNames);

  if (!hydrated) return <PageSkeleton />;

  const route = result?.routes.find((r) => r.id === params.id);
  if (!route || !result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-ink">{ja ? 'ルートが見つかりません' : 'Route not found'}</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {ja ? 'まずシミュレーションを実行してください。' : 'Run a simulation first.'}
        </p>
        <Link href="/create" className="mt-6 inline-flex min-h-[44px] items-center rounded-full bg-gradient-to-r from-cyan2 to-violet2 px-8 py-2.5 text-sm font-semibold text-white shadow-glow">
          {ja ? '未来をつくる' : 'Create your future'}
        </Link>
      </div>
    );
  }

  const school = dataset.schools.find((s) => route.schoolIds.includes(s.id));
  const career = dataset.careers.find((c) => c.id === route.careerId);
  const name = routeNames[route.id] ?? (ja ? route.nameJa : route.nameEn);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/universe" className="text-sm text-indigo2 hover:underline">
        ← {ja ? 'シミュレーション宇宙へ戻る' : 'Back to Simulation Universe'}
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">{name}</h1>
      <div className="mt-2 flex flex-wrap gap-2 text-sm text-ink-soft">
        <span>{ja ? '就職まで' : 'To first job'}: <strong className="text-ink">{months(route.monthsToJob, locale)}</strong></span>
        <span>· {ja ? '教育費' : 'Education cost'}: <strong className="text-ink">{yen(route.totalCostJpy.expected)}</strong></span>
        <span>· {ja ? 'スコア' : 'Score'}: <strong className="text-ink">{route.scores.expected}/100</strong></span>
      </div>

      {/* Timeline */}
      <section className="mt-8" aria-labelledby="timeline-title">
        <h2 id="timeline-title" className="text-lg font-bold text-ink">{ja ? 'タイムライン' : 'Timeline'}</h2>
        <ol className="mt-4 space-y-0">
          {route.milestones.map((m, i) => (
            <li key={m.id} className="relative flex gap-4 pb-6">
              {i < route.milestones.length - 1 && (
                <span aria-hidden="true" className="absolute left-[11px] top-7 h-full w-0.5 bg-gradient-to-b from-cyan2/50 to-violet2/30" />
              )}
              <span
                aria-hidden="true"
                className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${m.riskFlag ? 'bg-coral' : 'bg-gradient-to-br from-cyan2 to-violet2'}`}
              >
                {i + 1}
              </span>
              <div className="cv-glass min-w-0 flex-1 rounded-xl p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-ink">{ja ? m.titleJa : m.titleEn}</h3>
                  <span className="text-xs tabular-nums text-ink-soft">
                    {ja ? `+${m.monthOffset}か月` : `+${m.monthOffset} mo`}
                    {m.costJpy ? ` · ${yen(m.costJpy)}` : ''}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-soft">{ja ? m.detailJa : m.detailEn}</p>
                {m.riskFlag && (
                  <p className="mt-2 rounded-lg bg-coral/5 px-3 py-2 text-xs text-coral">
                    ⚠ {ja ? m.riskFlag.ja : m.riskFlag.en}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {school && (
        <section className="cv-glass mt-6 rounded-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-ink">{ja ? '推奨校' : 'Recommended school'}</h2>
            {school.provenance.isDemo && <Badge tone="demo">{ja ? 'デモデータ' : 'Demonstration data'}</Badge>}
          </div>
          <p className="mt-2 font-semibold text-ink">{ja ? school.nameJa : school.nameEn}</p>
          <p className="mt-1 text-sm text-ink-soft">{ja ? school.descriptionJa : school.descriptionEn}</p>
          <Link href={`/schools/${school.id}`} className="mt-3 inline-block text-sm font-semibold text-cyan2 hover:underline">
            {ja ? '学校の詳細 →' : 'School details →'}
          </Link>
        </section>
      )}

      {career && (
        <section className="cv-glass mt-6 rounded-panel p-5">
          <h2 className="text-lg font-bold text-ink">{ja ? 'キャリアの階段' : 'Career ladder'}</h2>
          <div className="mt-3 flex flex-col-reverse gap-2">
            {career.levels.map((l, i) => (
              <div
                key={l.id}
                className="rounded-xl border border-violet2/20 bg-white/70 p-3"
                style={{ marginLeft: `${i * 12}px` }}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <strong className="text-ink">{ja ? l.titleJa : l.titleEn}</strong>
                  <span className="text-xs text-ink-soft">
                    {yen(l.salaryJpy.min)}–{yen(l.salaryJpy.max)}
                    {l.salaryJpy.isDemo && <span className="text-amber2"> {ja ? '（デモ）' : '(demo)'}</span>}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link href={`/careers/${career.id}`} className="mt-3 inline-block text-sm font-semibold text-violet2 hover:underline">
            {ja ? 'キャリアタワーを見る →' : 'View the full Career Tower →'}
          </Link>
        </section>
      )}

      <section className="cv-glass mt-6 rounded-panel p-5">
        <h2 className="mb-4 text-lg font-bold text-ink">{ja ? 'なぜこの結果？' : 'Why this result?'}</h2>
        <WhyPanel route={route} closeCall={result.closeCall} />
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/plan" className="inline-flex min-h-[44px] items-center rounded-full bg-gradient-to-r from-cyan2 to-violet2 px-6 text-sm font-semibold text-white shadow-glow">
          {ja ? 'この未来のアクションプラン →' : 'Action plan for this future →'}
        </Link>
        <Link href="/compare" className="inline-flex min-h-[44px] items-center rounded-full border border-ink/10 bg-white/70 px-6 text-sm font-semibold text-ink">
          {ja ? '他の未来と比較' : 'Compare with other futures'}
        </Link>
      </div>
    </div>
  );
}
