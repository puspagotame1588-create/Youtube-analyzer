'use client';

/**
 * "Why this result?" — factor contributions, evidence, assumptions, sources,
 * limitations, and what would change the outcome. Trust is visible here.
 */

import { useLocale } from 'next-intl';
import type { SimRoute } from '@/lib/simulation/types';
import { sources as sourceRegistry } from '@/lib/data/seed';
import { pick } from '@/lib/i18n/bi';
import { Badge } from '@/components/ui/Badge';
import { FACTOR_LABELS, LEVEL_TEXT } from './labels';

export function WhyPanel({ route, closeCall }: { route: SimRoute; closeCall: boolean }): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';

  return (
    <div className="space-y-5 text-sm">
      {closeCall && (
        <div className="rounded-xl border border-amber2/40 bg-amber2/10 p-3 text-ink">
          <strong className="text-amber2">{ja ? '接戦です。' : 'This is a close call.'}</strong>{' '}
          {ja
            ? '上位ルートのスコア差が小さいため、どちらかが明確に優れているとは言えません。あなたの優先順位で判断してください。'
            : 'The top routes score within a few points of each other — neither is clearly superior. Your own priorities should decide.'}
        </div>
      )}

      <section aria-label={ja ? '要素別スコア' : 'Factor scores'}>
        <h4 className="mb-2 font-semibold text-ink">{ja ? '要素別スコア（期待ケース）' : 'Factor scores (expected case)'}</h4>
        <ul className="space-y-2">
          {route.breakdown.map((f) => (
            <li key={f.factor}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-ink">{pick(FACTOR_LABELS[f.factor], locale)}</span>
                <span className="tabular-nums text-ink-soft">
                  {f.score}/100 · {ja ? '重み' : 'wt'} {Math.round(f.weight)}%
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink/5" role="presentation">
                <div
                  className={`h-full rounded-full ${f.score >= 70 ? 'bg-emerald2' : f.score >= 45 ? 'bg-amber2' : 'bg-coral'}`}
                  style={{ width: `${f.score}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-ink-soft">{ja ? f.reasonJa : f.reasonEn}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-wrap gap-2" aria-label={ja ? '信頼性' : 'Confidence'}>
        <Badge tone={route.feasibility === 'high' ? 'verified' : route.feasibility === 'medium' ? 'uncertain' : 'risk'}>
          {ja ? 'ルート実現性' : 'Feasibility'}: {pick(LEVEL_TEXT[route.feasibility]!, locale)}
        </Badge>
        <Badge tone={route.evidence === 'strong' ? 'verified' : 'demo'}>
          {ja ? '根拠の強さ' : 'Evidence'}: {pick(LEVEL_TEXT[route.evidence]!, locale)}
        </Badge>
        <Badge tone="info">
          {ja ? 'データ確認日' : 'Data checked'}: {route.dataFreshness}
        </Badge>
      </section>

      <section>
        <h4 className="mb-2 font-semibold text-ink">{ja ? '前提条件' : 'Assumptions'}</h4>
        <ul className="space-y-1">
          {route.assumptions.map((a) => (
            <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span className="text-ink-soft">{ja ? a.labelJa : a.labelEn}</span>
              <span className="text-ink">
                {a.value}
                <span className="ml-2 text-[10px] uppercase tracking-wide text-ink-soft/70">
                  {a.origin === 'user' ? (ja ? 'あなたの入力' : 'your input') : a.origin === 'default' ? (ja ? '既定ルール' : 'default rule') : ja ? 'AI提案（確認済み）' : 'AI (confirmed)'}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {route.missingInfoEn.length > 0 && (
        <section>
          <h4 className="mb-2 font-semibold text-ink">{ja ? '不足している情報' : 'Missing information'}</h4>
          <ul className="list-inside list-disc space-y-1 text-ink-soft">
            {(ja ? route.missingInfoJa : route.missingInfoEn).map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h4 className="mb-2 font-semibold text-ink">{ja ? '結果を変える可能性がある要因' : 'What could change this result'}</h4>
        <ul className="list-inside list-disc space-y-1 text-ink-soft">
          {(ja ? route.whatWouldChangeJa : route.whatWouldChangeEn).map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-indigo2/20 bg-indigo2/5 p-3">
        <h4 className="font-semibold text-indigo2">
          {ja ? '在留資格（Residence status）について' : 'Residence status（在留資格） note'}
        </h4>
        <p className="mt-1 text-xs leading-relaxed text-ink">{ja ? route.visaNote.ja : route.visaNote.en}</p>
      </section>

      <section>
        <h4 className="mb-2 font-semibold text-ink">{ja ? '情報源' : 'Sources'}</h4>
        <ul className="space-y-1 text-xs">
          {route.sourceIds.map((id) => {
            const s = sourceRegistry.find((x) => x.id === id);
            if (!s) return null;
            return (
              <li key={id} className="text-ink-soft">
                <span className="font-medium text-ink">{ja ? s.nameJa : s.nameEn}</span>{' '}
                · {s.type} · {ja ? '取得日' : 'retrieved'} {s.retrievedAt}
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-ink-soft/80">
          {ja
            ? 'スコアは検証済みデータと明示的なルールから決定論的に計算されます。AIが数値を生成することはありません。'
            : 'Scores are computed deterministically from verified data and explicit rules. AI never generates the numbers.'}
        </p>
      </section>
    </div>
  );
}
