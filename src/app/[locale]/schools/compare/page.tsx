'use client';

/** School Comparison — accessible table comparing two shortlisted schools. */

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { dataset } from '@/lib/data/seed';
import { useAppStore } from '@/lib/store/app';
import { useHydrated } from '@/components/ui/useHydrated';
import { Badge } from '@/components/ui/Badge';
import { yen } from '@/lib/i18n/bi';

export default function SchoolComparePage(): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';
  const hydrated = useHydrated();
  const shortlist = useAppStore((s) => s.shortlist);
  const [pickA, setPickA] = useState<string | null>(null);
  const [pickB, setPickB] = useState<string | null>(null);

  if (!hydrated) return <div className="p-20 text-center text-ink-soft">…</div>;

  const pool = dataset.schools.filter((s) =>
    shortlist.length >= 2 ? shortlist.includes(s.id) : true,
  );
  const a = dataset.schools.find((s) => s.id === (pickA ?? pool[0]?.id));
  const b = dataset.schools.find((s) => s.id === (pickB ?? pool[1]?.id));

  const total = (s: NonNullable<typeof a>): number =>
    s.firstYearCostJpy + s.annualTuitionJpy * (s.programYears - 1);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">{ja ? '学校を比較' : 'Compare Schools'}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {shortlist.length >= 2
          ? ja ? '候補リストから2校を選んで比較します。' : 'Pick two schools from your shortlist.'
          : ja ? '候補が2校未満のため、全デモ校から選べます。' : 'Fewer than two shortlisted — choose from all demo schools.'}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[{ v: a?.id, set: setPickA, label: ja ? '学校A' : 'School A' }, { v: b?.id, set: setPickB, label: ja ? '学校B' : 'School B' }].map((sel, i) => (
          <label key={i} className="text-sm">
            <span className="mb-1 block text-xs font-semibold text-ink-soft">{sel.label}</span>
            <select
              value={sel.v ?? ''}
              onChange={(e) => sel.set(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-ink/10 bg-white px-3 text-ink"
            >
              {pool.map((s) => (
                <option key={s.id} value={s.id}>{ja ? s.nameJa : s.nameEn}</option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {a && b && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-0 text-sm">
            <caption className="sr-only">{ja ? '学校比較表' : 'School comparison table'}</caption>
            <thead>
              <tr>
                <th scope="col" className="bg-white/70 p-4 text-left text-xs font-semibold uppercase text-ink-soft">{ja ? '項目' : 'Item'}</th>
                {[a, b].map((s) => (
                  <th key={s.id} scope="col" className="bg-white/70 p-4 text-left">
                    <span className="block font-bold text-ink">{ja ? s.nameJa : s.nameEn}</span>
                    <span className="mt-1 inline-flex gap-1">
                      {s.provenance.isDemo && <Badge tone="demo">{ja ? 'デモ' : 'Demo'}</Badge>}
                      {s.sponsored && <Badge tone="sponsored">{ja ? 'スポンサー' : 'Sponsored'}</Badge>}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { l: ja ? '種別' : 'Type', f: (s: typeof a) => (s.institutionType === 'university' ? (ja ? '大学' : 'University') : ja ? '専門学校' : 'Vocational') },
                { l: ja ? '所在地' : 'City', f: (s: typeof a) => s.city },
                { l: ja ? '課程年数' : 'Program length', f: (s: typeof a) => `${s.programYears}${ja ? '年' : ' years'}` },
                { l: ja ? '初年度納入金' : 'First-year cost', f: (s: typeof a) => yen(s.firstYearCostJpy) },
                { l: ja ? '総学費（目安）' : 'Total cost (est.)', f: (s: typeof a) => yen(total(s)) },
                { l: 'JLPT', f: (s: typeof a) => s.jlptRequired.toUpperCase() },
                { l: 'EJU', f: (s: typeof a) => (s.ejuRequired ? (ja ? '必要' : 'Required') : ja ? '不要' : 'Not required') },
                { l: ja ? '出願月' : 'Application months', f: (s: typeof a) => s.applicationMonths.join(', ') },
                { l: ja ? '奨学金' : 'Scholarships', f: (s: typeof a) => `${s.scholarshipIds.length}${ja ? '件' : ''}` },
                { l: ja ? '留学生サポート' : 'Intl support', f: (s: typeof a) => s.intlSupport },
                {
                  l: ja ? '就職・進学実績' : 'Outcomes',
                  f: (s: typeof a) =>
                    s.employmentOutcome
                      ? `${Math.round(s.employmentOutcome.value * 100)}%${s.employmentOutcome.isDemo ? (ja ? '（デモ）' : ' (demo)') : ''}`
                      : '—',
                },
                { l: ja ? '生活費（月・目安）' : 'Living cost / mo', f: (s: typeof a) => yen(s.livingCostMonthlyJpy) },
                { l: ja ? '最終確認日' : 'Last verified', f: (s: typeof a) => s.provenance.lastVerified },
              ].map((row, i) => (
                <tr key={i}>
                  <th scope="row" className="border-t border-ink/5 bg-white/40 p-3 text-left font-medium text-ink">{row.l}</th>
                  <td className="border-t border-ink/5 bg-white/40 p-3 text-ink">{row.f(a)}</td>
                  <td className="border-t border-ink/5 bg-white/40 p-3 text-ink">{row.f(b)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {a && (
          <Link href={`/schools/${a.id}`} className="inline-flex min-h-[44px] items-center rounded-full border border-ink/10 bg-white/70 px-5 text-sm font-semibold text-ink">
            {ja ? `${a.nameJa}の詳細` : `${a.nameEn} details`}
          </Link>
        )}
        {b && (
          <Link href={`/schools/${b.id}`} className="inline-flex min-h-[44px] items-center rounded-full border border-ink/10 bg-white/70 px-5 text-sm font-semibold text-ink">
            {ja ? `${b.nameJa}の詳細` : `${b.nameEn} details`}
          </Link>
        )}
        <Link href="/tracker" className="inline-flex min-h-[44px] items-center rounded-full bg-ink px-5 text-sm font-semibold text-white">
          {ja ? '出願トラッカーへ →' : 'Go to application tracker →'}
        </Link>
      </div>
    </div>
  );
}
