'use client';

/** Compare Futures — side-by-side comparison of two routes (free tier). */

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useAppStore } from '@/lib/store/app';
import { useHydrated } from '@/components/ui/useHydrated';
import { FACTOR_LABELS, ROUTE_LABEL_TEXT, LEVEL_TEXT } from '@/components/universe/labels';
import { Badge } from '@/components/ui/Badge';
import { pick, yen, months } from '@/lib/i18n/bi';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

export default function ComparePage(): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';
  const hydrated = useHydrated();
  const result = useAppStore((s) => s.currentResult);
  const routeNames = useAppStore((s) => s.currentRouteNames);
  const [picked, setPicked] = useState<string[]>([]);

  if (!hydrated) return <PageSkeleton />;

  if (!result || result.routes.length < 2) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-ink">{ja ? '比較する未来がありません' : 'Nothing to compare yet'}</h1>
        <Link href="/create" className="mt-6 inline-flex min-h-[44px] items-center rounded-full bg-gradient-to-r from-cyan2 to-violet2 px-8 py-2.5 text-sm font-semibold text-white shadow-glow">
          {ja ? '未来をつくる' : 'Create your future'}
        </Link>
      </div>
    );
  }

  const routes = result.routes;
  const name = (id: string): string => {
    const r = routes.find((x) => x.id === id);
    return r ? routeNames[r.id] ?? (ja ? r.nameJa : r.nameEn) : '';
  };
  const selected = picked.length === 2 ? picked : routes.slice(0, 2).map((r) => r.id);
  const [a, b] = selected.map((id) => routes.find((r) => r.id === id)!);

  if (!a || !b) return <div />;

  const rows: Array<{ label: string; va: string; vb: string; better?: 'a' | 'b' | null }> = [
    {
      label: ja ? '総合スコア（期待）' : 'Overall score (expected)',
      va: `${a.scores.expected}`, vb: `${b.scores.expected}`,
      better: a.scores.expected === b.scores.expected ? null : a.scores.expected > b.scores.expected ? 'a' : 'b',
    },
    {
      label: ja ? '保守的ケース' : 'Conservative case',
      va: `${a.scores.conservative}`, vb: `${b.scores.conservative}`,
      better: a.scores.conservative === b.scores.conservative ? null : a.scores.conservative > b.scores.conservative ? 'a' : 'b',
    },
    {
      label: ja ? '就職までの期間' : 'Time to first job',
      va: months(a.monthsToJob, locale), vb: months(b.monthsToJob, locale),
      better: a.monthsToJob === b.monthsToJob ? null : a.monthsToJob < b.monthsToJob ? 'a' : 'b',
    },
    {
      label: ja ? '教育費（期待）' : 'Education cost (expected)',
      va: yen(a.totalCostJpy.expected), vb: yen(b.totalCostJpy.expected),
      better: a.totalCostJpy.expected === b.totalCostJpy.expected ? null : a.totalCostJpy.expected < b.totalCostJpy.expected ? 'a' : 'b',
    },
    {
      label: ja ? '実現性' : 'Feasibility',
      va: pick(LEVEL_TEXT[a.feasibility]!, locale), vb: pick(LEVEL_TEXT[b.feasibility]!, locale), better: null,
    },
    {
      label: ja ? '根拠の強さ' : 'Evidence strength',
      va: pick(LEVEL_TEXT[a.evidence]!, locale), vb: pick(LEVEL_TEXT[b.evidence]!, locale), better: null,
    },
  ];

  const gap = Math.abs(a.scores.expected - b.scores.expected);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">{ja ? '未来を比較する' : 'Compare Futures'}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {ja ? '無料プランでは2つの未来を同時に比較できます。' : 'The free Explorer plan compares two futures at once.'}
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={ja ? '比較するルートを選択' : 'Choose routes to compare'}>
        {routes.map((r) => {
          const active = selected.includes(r.id);
          return (
            <button
              key={r.id}
              onClick={() => {
                if (active) return;
                setPicked([selected[1]!, r.id]);
              }}
              aria-pressed={active}
              className={`min-h-[40px] rounded-full border px-4 text-xs font-semibold ${
                active ? 'border-cyan2 bg-cyan2/10 text-cyan2' : 'border-ink/10 bg-white/60 text-ink-soft hover:text-ink'
              }`}
            >
              {name(r.id)}
            </button>
          );
        })}
      </div>

      {gap <= result.closeCallMargin && (
        <div className="mt-4 rounded-panel border border-amber2/40 bg-amber2/10 px-4 py-3 text-sm text-ink" role="status">
          <strong className="text-amber2">{ja ? '判定：' : 'Verdict:'}</strong>{' '}
          {ja
            ? `スコア差は${gap}点のみ。どちらかが明確に優れているわけではありません。優先順位（費用・速さ・安全性）で選んでください。`
            : `Only ${gap} points apart — neither route is clearly superior. Choose by your own priorities (cost, speed, safety).`}
        </div>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] border-separate border-spacing-0 text-sm">
          <caption className="sr-only">{ja ? '2つの未来の比較表' : 'Comparison of two futures'}</caption>
          <thead>
            <tr>
              <th scope="col" className="rounded-tl-panel bg-white/70 p-4 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
                {ja ? '項目' : 'Dimension'}
              </th>
              {[a, b].map((r, i) => (
                <th key={r.id} scope="col" className={`bg-white/70 p-4 text-left ${i === 1 ? 'rounded-tr-panel' : ''}`}>
                  <span className="block font-bold text-ink">{name(r.id)}</span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {r.labels.map((l) => (
                      <Badge key={l} tone={l === 'safest' ? 'verified' : 'future'}>{pick(ROUTE_LABEL_TEXT[l], locale)}</Badge>
                    ))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <th scope="row" className="border-t border-ink/5 bg-white/40 p-4 text-left font-medium text-ink">
                  {row.label}
                </th>
                <td className={`border-t border-ink/5 p-4 tabular-nums ${row.better === 'a' ? 'bg-emerald2/10 font-semibold text-emerald2' : 'bg-white/40 text-ink'}`}>
                  {row.va} {row.better === 'a' && <span aria-label={ja ? 'こちらが有利' : 'better'}>✓</span>}
                </td>
                <td className={`border-t border-ink/5 p-4 tabular-nums ${row.better === 'b' ? 'bg-emerald2/10 font-semibold text-emerald2' : 'bg-white/40 text-ink'}`}>
                  {row.vb} {row.better === 'b' && <span aria-label={ja ? 'こちらが有利' : 'better'}>✓</span>}
                </td>
              </tr>
            ))}
            {(['affordability', 'visa', 'employment', 'salary'] as const).map((f) => {
              const fa = a.breakdown.find((x) => x.factor === f);
              const fb = b.breakdown.find((x) => x.factor === f);
              return (
                <tr key={f}>
                  <th scope="row" className="border-t border-ink/5 bg-white/40 p-4 text-left font-medium text-ink">
                    {pick(FACTOR_LABELS[f], locale)}
                  </th>
                  {[fa, fb].map((x, i) => (
                    <td key={i} className="border-t border-ink/5 bg-white/40 p-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-ink/5">
                          <div
                            className={`h-full ${(x?.score ?? 0) >= 70 ? 'bg-emerald2' : (x?.score ?? 0) >= 45 ? 'bg-amber2' : 'bg-coral'}`}
                            style={{ width: `${x?.score ?? 0}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-ink">{x?.score ?? 0}</span>
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/universe" className="inline-flex min-h-[44px] items-center rounded-full border border-ink/10 bg-white/70 px-6 text-sm font-semibold text-ink">
          ← {ja ? '宇宙へ戻る' : 'Back to universe'}
        </Link>
        <Link href="/plan" className="inline-flex min-h-[44px] items-center rounded-full bg-gradient-to-r from-cyan2 to-violet2 px-6 text-sm font-semibold text-white shadow-glow">
          {ja ? 'アクションプランを見る →' : 'See your action plan →'}
        </Link>
      </div>
    </div>
  );
}
