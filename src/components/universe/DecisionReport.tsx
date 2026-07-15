'use client';

/**
 * Evidence-backed decision report (Phases 1–5). Renders the deterministic
 * decision contract above the 3D scene. It never computes or alters scores —
 * it only presents the pure output of buildDecisionReport(). Missing data is
 * shown as "Not verified"; demonstration data is always labeled.
 */

import { useState } from 'react';
import { useLocale } from 'next-intl';
import type {
  Bi,
  DecisionReport as Report,
  RouteDecisionResult,
  RouteEligibility,
  Confidence,
  RequirementStatus,
  EvidenceBasis,
} from '@/lib/simulation/decision';

function useT(): (b: Bi | null | undefined) => string {
  const locale = useLocale();
  return (b) => (b ? (locale === 'ja' ? b.ja : b.en) : locale === 'ja' ? '未確認' : 'Not verified');
}

const ELIG: Record<RouteEligibility, { en: string; ja: string; icon: string; cls: string }> = {
  eligible: { en: 'Eligible', ja: '適格', icon: '✓', cls: 'border-emerald2/50 bg-emerald2/10 text-emerald2' },
  likely_eligible: { en: 'Likely eligible', ja: '適格の可能性が高い', icon: '◕', cls: 'border-emerald2/40 bg-emerald2/5 text-emerald2' },
  possibly_eligible: { en: 'Possibly eligible', ja: '適格の可能性あり', icon: '◑', cls: 'border-amber2/50 bg-amber2/10 text-amber2' },
  not_currently_eligible: { en: 'Not currently eligible', ja: '現時点では不適格', icon: '✕', cls: 'border-coral/50 bg-coral/10 text-coral' },
  unknown: { en: 'Unknown', ja: '不明', icon: '?', cls: 'border-ink/20 bg-ink/5 text-ink-soft' },
};

const CONF: Record<Confidence, { en: string; ja: string; icon: string }> = {
  high: { en: 'High confidence', ja: '信頼度：高', icon: '▲▲▲' },
  medium: { en: 'Medium confidence', ja: '信頼度：中', icon: '▲▲△' },
  low: { en: 'Low confidence', ja: '信頼度：低', icon: '▲△△' },
};

const REQ: Record<RequirementStatus, { en: string; ja: string; icon: string; cls: string }> = {
  met: { en: 'Met', ja: '充足', icon: '✓', cls: 'text-emerald2' },
  not_met: { en: 'Not met', ja: '未達', icon: '✕', cls: 'text-coral' },
  unverified: { en: 'Not verified', ja: '未確認', icon: '?', cls: 'text-amber2' },
};

function EligBadge({ e }: { e: RouteEligibility }): React.JSX.Element {
  const locale = useLocale();
  const m = ELIG[e];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${m.cls}`}>
      <span aria-hidden="true">{m.icon}</span>
      {locale === 'ja' ? m.ja : m.en}
    </span>
  );
}

function yenShort(n: number): string {
  if (n <= 0) return '¥0';
  if (n >= 10000) return `¥${(n / 10000).toLocaleString(undefined, { maximumFractionDigits: 0 })}万`;
  return `¥${n.toLocaleString()}`;
}

function RouteCard({ r, recommended }: { r: RouteDecisionResult; recommended: boolean }): React.JSX.Element {
  const t = useT();
  const locale = useLocale();
  const ja = locale === 'ja';
  const [showEvidence, setShowEvidence] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <article className={`cv-glass rounded-panel border-2 p-4 ${recommended ? 'border-cyan2/60' : 'border-transparent'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex flex-wrap items-center gap-2 text-base font-bold text-ink">
            <span className="truncate">{t(r.routeName)}</span>
            {r.isDemo && (
              <span className="rounded-full bg-amber2/15 px-2 py-0.5 text-[10px] font-semibold text-amber2">
                {ja ? 'デモデータ' : 'Demo data'}
              </span>
            )}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <EligBadge e={r.eligibility} />
            <span className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-white/60 px-2 py-0.5 text-[11px] font-medium text-ink-soft">
              <span aria-hidden="true" className="tracking-tighter">{CONF[r.confidence].icon}</span>
              {ja ? CONF[r.confidence].ja : CONF[r.confidence].en}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-bold tabular-nums text-ink">{r.score}</div>
          <div className="text-[10px] uppercase tracking-wide text-ink-soft">{ja ? 'スコア/100' : 'score/100'}</div>
        </div>
      </div>

      {/* key facts */}
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm sm:grid-cols-4">
        <div><dt className="text-[11px] text-ink-soft">{ja ? '就職まで' : 'Time to job'}</dt><dd className="font-semibold text-ink">{ja ? `${r.timeMonths}か月` : `${r.timeMonths} mo`}</dd></div>
        <div><dt className="text-[11px] text-ink-soft">{ja ? '教育費（推定）' : 'Est. cost'}</dt><dd className="font-semibold text-ink">{yenShort(r.totalCostJpy.expected)}</dd></div>
        <div><dt className="text-[11px] text-ink-soft">{ja ? '日本語要件' : 'JLPT req.'}</dt><dd className="font-semibold text-ink">{t(r.jlptRequirement)}</dd></div>
        <div><dt className="text-[11px] text-ink-soft">{ja ? '想定初職' : 'First role'}</dt><dd className="font-semibold text-ink">{t(r.firstCareer)}</dd></div>
      </dl>

      {/* positives / risks */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald2">{ja ? '強み' : 'Why it ranks'}</p>
          <ul className="mt-1 space-y-0.5 text-xs text-ink">
            {r.positiveFactors.map((f, i) => (<li key={i} className="flex gap-1"><span aria-hidden="true" className="text-emerald2">+</span>{t(f.label)}</li>))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-coral">{ja ? 'リスク' : 'Main risks'}</p>
          <ul className="mt-1 space-y-0.5 text-xs text-ink">
            {r.risks.map((f, i) => (<li key={i} className="flex gap-1"><span aria-hidden="true" className="text-coral">!</span>{t(f.label)}</li>))}
          </ul>
        </div>
      </div>

      {/* evidence coverage */}
      <p className="mt-3 text-[11px] text-ink-soft">
        {ja
          ? `要件の確認状況：${r.evidenceCoverage.verified}/${r.evidenceCoverage.total} 充足`
          : `Requirements verified: ${r.evidenceCoverage.verified}/${r.evidenceCoverage.total}`}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => setShowBreakdown((v) => !v)} aria-expanded={showBreakdown} className="min-h-[40px] rounded-full border border-indigo2/30 bg-indigo2/5 px-4 text-xs font-semibold text-indigo2">
          {ja ? 'スコアの内訳' : 'How this score was calculated'}
        </button>
        <button onClick={() => setShowEvidence((v) => !v)} aria-expanded={showEvidence} className="min-h-[40px] rounded-full border border-ink/10 bg-white/70 px-4 text-xs font-semibold text-ink">
          {ja ? '要件と根拠を見る' : 'View full evidence'}
        </button>
      </div>

      {/* Phase 3 — score breakdown */}
      {showBreakdown && (
        <div className="mt-3 rounded-xl border border-ink/10 bg-white/60 p-3">
          <p className="text-[11px] text-ink-soft">{ja ? '各カテゴリの点数の合計がスコアです。AIは点数を変更しません。' : 'Category points sum to the score. AI never changes these values.'}</p>
          <ul className="mt-2 space-y-2">
            {r.scoreBreakdown.map((c) => (
              <li key={c.id} className="text-xs">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-ink">{t(c.label)}</span>
                  <span className="tabular-nums text-ink-soft">{c.points}/{c.max} · {ja ? BASIS[c.basis].ja : BASIS[c.basis].en}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                  <div className="h-full rounded-full bg-indigo2/60" style={{ width: `${c.max > 0 ? Math.min(100, (c.points / c.max) * 100) : 0}%` }} />
                </div>
                <p className="mt-0.5 text-ink-soft">{t(c.reason)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Phase 4 — eligibility / blocker panel */}
      {showEvidence && (
        <div className="mt-3 rounded-xl border border-ink/10 bg-white/60 p-3">
          <p className="text-xs font-bold text-ink">{ja ? 'このルートに進めますか？' : 'Can you take this route?'}</p>
          <ul className="mt-2 space-y-3">
            {r.blockers.map((b) => (
              <li key={b.id} className="border-b border-ink/5 pb-2 last:border-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-ink">{t(b.label)}</span>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${REQ[b.status].cls}`}>
                    <span aria-hidden="true">{REQ[b.status].icon}</span>{ja ? REQ[b.status].ja : REQ[b.status].en}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-ink">{t(b.requirement)} · {t(b.userStatus)}</p>
                <p className="mt-0.5 text-[11px] text-ink-soft">
                  {ja ? '根拠：' : 'Source: '}
                  {b.evidence.source ? (b.evidence.url ? <a href={b.evidence.url} target="_blank" rel="noopener noreferrer" className="text-indigo2 underline">{t(b.evidence.source)}</a> : t(b.evidence.source)) : (ja ? '未確認' : 'Not verified')}
                  {b.evidence.checkedAt ? ` · ${ja ? '確認' : 'checked'} ${b.evidence.checkedAt}` : ''}
                </p>
                <p className="mt-0.5 text-[11px] italic text-ink-soft">{t(b.evidence.scopeNote)}</p>
                <p className="mt-0.5 text-[11px] text-ink"><span className="font-semibold">{ja ? '次の行動：' : 'Next action: '}</span>{t(b.nextAction)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

const BASIS: Record<EvidenceBasis, Bi> = {
  verified: { en: 'verified', ja: '検証済み' },
  user_input: { en: 'your input', ja: '入力値' },
  estimate: { en: 'estimate', ja: '推定' },
  assumption: { en: 'assumption', ja: '前提' },
  unknown: { en: 'unknown', ja: '不明' },
};

export function DecisionReport({ report }: { report: Report }): React.JSX.Element {
  const t = useT();
  const locale = useLocale();
  const ja = locale === 'ja';
  const rec = report.routes.find((r) => r.routeId === report.recommendedRouteId) ?? null;

  return (
    <section aria-labelledby="decision-title" className="mt-4">
      <h2 id="decision-title" className="sr-only">{ja ? '意思決定レポート' : 'Decision report'}</h2>

      {/* Phase 1 — decision summary */}
      <div className="rounded-panel border border-cyan2/30 bg-gradient-to-br from-cyan2/5 to-transparent p-4 shadow-panel">
        {rec ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan2">{ja ? '現在のおすすめ' : 'Current recommendation'}</p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-ink">{t(rec.routeName)}</h3>
              <div className="text-right"><span className="text-2xl font-bold tabular-nums text-ink">{rec.score}</span><span className="text-xs text-ink-soft">/100</span></div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <EligBadge e={rec.eligibility} />
              <span className="text-xs font-medium text-ink-soft">{ja ? CONF[rec.confidence].ja : CONF[rec.confidence].en}</span>
              {rec.isDemo && <span className="rounded-full bg-amber2/15 px-2 py-0.5 text-[10px] font-semibold text-amber2">{ja ? 'デモデータ' : 'Demo data'}</span>}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink">{t(rec.summary)}</p>
            <p className="mt-2 text-xs text-ink-soft">
              {ja
                ? `要件：${rec.evidenceCoverage.verified}件充足 / ${rec.evidenceCoverage.total - rec.evidenceCoverage.verified}件未確認`
                : `Verification: ${rec.evidenceCoverage.verified} met, ${rec.evidenceCoverage.total - rec.evidenceCoverage.verified} still unverified`}
            </p>
          </>
        ) : (
          <p className="text-sm text-ink">
            {ja
              ? '現在、確実に適格と判定できるルートがありません。下の各ルートの要件を確認してください。'
              : 'No route is currently confirmed eligible. Review each route’s requirements below.'}
          </p>
        )}
        {report.closeCall && (
          <p className="mt-2 rounded-lg border border-amber2/40 bg-amber2/10 px-3 py-1.5 text-xs text-ink" role="status">
            <strong className="text-amber2">{ja ? '接戦：' : 'Close call: '}</strong>
            {ja ? '上位ルートの差はわずかです。' : 'The top routes are within a few points — neither is clearly superior.'}
          </p>
        )}
      </div>

      {/* Phase 2 — route decision cards */}
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {report.routes.map((r) => (
          <RouteCard key={r.routeId} r={r} recommended={r.routeId === report.recommendedRouteId} />
        ))}
      </div>

      {/* Phase 5 — side-by-side comparison (scrollable on mobile, no horizontal page overflow) */}
      <div className="mt-4 rounded-panel border border-ink/10 bg-white/60 p-4">
        <h3 className="text-sm font-bold text-ink">{ja ? '横並び比較' : 'Side-by-side comparison'}</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-xs">
            <thead>
              <tr className="text-ink-soft">
                <th scope="col" className="py-1.5 pr-3 font-medium">{ja ? '項目' : 'Metric'}</th>
                {report.routes.map((r) => (<th key={r.routeId} scope="col" className="py-1.5 pr-3 font-semibold text-ink">{t(r.routeName)}</th>))}
              </tr>
            </thead>
            <tbody className="align-top">
              {([
                ['eligibility', ja ? '現在の適格性' : 'Eligibility today', (r: RouteDecisionResult) => (ja ? ELIG[r.eligibility].ja : ELIG[r.eligibility].en)],
                ['score', ja ? 'スコア' : 'Score', (r: RouteDecisionResult) => `${r.score}/100`],
                ['confidence', ja ? '信頼度' : 'Confidence', (r: RouteDecisionResult) => (ja ? CONF[r.confidence].ja : CONF[r.confidence].en)],
                ['time', ja ? '就職まで' : 'Time to job', (r: RouteDecisionResult) => (ja ? `${r.timeMonths}か月` : `${r.timeMonths} mo`)],
                ['cost', ja ? '教育費（推定）' : 'Total cost (est.)', (r: RouteDecisionResult) => yenShort(r.totalCostJpy.expected)],
                ['jlpt', ja ? '日本語要件' : 'JLPT requirement', (r: RouteDecisionResult) => t(r.jlptRequirement)],
                ['career', ja ? '想定初職' : 'First role', (r: RouteDecisionResult) => t(r.firstCareer)],
                ['risk', ja ? '主なリスク' : 'Main risk', (r: RouteDecisionResult) => (r.risks[0] ? t(r.risks[0].label) : ja ? '未確認' : 'Not verified')],
                ['evidence', ja ? '要件の確認' : 'Evidence completeness', (r: RouteDecisionResult) => `${r.evidenceCoverage.verified}/${r.evidenceCoverage.total}`],
              ] as const).map(([key, label, fn]) => (
                <tr key={key} className="border-t border-ink/5">
                  <th scope="row" className="py-1.5 pr-3 font-medium text-ink-soft">{label}</th>
                  {report.routes.map((r) => (<td key={r.routeId} className="py-1.5 pr-3 text-ink">{fn(r)}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phase 6 — facts / assumptions / estimates / unknowns (recommended route) */}
      {rec && (
        <div className="mt-4 rounded-panel border border-ink/10 bg-white/60 p-4">
          <h3 className="text-sm font-bold text-ink">
            {ja ? '事実・前提・推定・不明点' : 'Facts, assumptions, estimates & unknowns'}
            <span className="ml-1 font-normal text-ink-soft">— {t(rec.routeName)}</span>
          </h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {([
              ['facts', ja ? '検証済みの事実' : 'Verified facts', 'text-emerald2', rec.facts],
              ['assumptions', ja ? '前提' : 'Assumptions', 'text-indigo2', rec.assumptions],
              ['estimates', ja ? '推定' : 'Estimates', 'text-amber2', rec.estimates],
              ['unknowns', ja ? '不明点' : 'Unknowns', 'text-coral', rec.unknowns],
            ] as const).map(([key, label, cls, items]) => (
              <div key={key} className="rounded-xl border border-ink/10 bg-white/70 p-3">
                <p className={`text-[11px] font-semibold uppercase tracking-wide ${cls}`}>{label} ({items.length})</p>
                {items.length === 0 ? (
                  <p className="mt-1 text-[11px] text-ink-soft">{ja ? '該当なし（未確認）' : 'None yet (not verified)'}</p>
                ) : (
                  <ul className="mt-1 space-y-1.5">
                    {items.map((it, i) => (
                      <li key={i} className="text-[11px] text-ink">
                        <span className="font-medium">{t(it.statement)}</span>
                        <span className="block text-ink-soft">
                          {ja ? '根拠：' : 'Basis: '}{t(it.basis)}
                          {it.checkedAt ? ` · ${ja ? '確認' : 'checked'} ${it.checkedAt}` : ''}
                          {` · ${ja ? '信頼度' : 'confidence'} ${it.confidence}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] italic text-ink-soft">
            {ja ? '前提や推定は事実として扱いません。デモデータは「デモ」と明記します。' : 'Assumptions and estimates are never presented as facts. Demonstration data is labeled "Demo".'}
          </p>
        </div>
      )}

      {/* Phase 7 — what would change the result */}
      <div className="mt-4 rounded-panel border border-ink/10 bg-white/60 p-4">
        <h3 className="text-sm font-bold text-ink">{ja ? '何が結果を変えるか' : 'What would change the result?'}</h3>
        {report.sensitivity.length === 0 ? (
          <p className="mt-1 text-xs text-ink-soft">
            {ja ? '現在の入力では、上位ルートを動かす主要因は見つかりませんでした。' : 'No single input change moves the top route with the current answers.'}
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {report.sensitivity.map((s) => (
              <li key={s.id} className="flex items-start justify-between gap-3 text-xs">
                <span className="text-ink"><span className="font-semibold">{t(s.label)}</span> — {t(s.change)}</span>
                <span className="shrink-0 tabular-nums font-semibold">
                  {s.scoreDelta !== 0 && (
                    <span className={s.scoreDelta > 0 ? 'text-emerald2' : 'text-coral'}>
                      {s.scoreDelta > 0 ? '▲' : '▼'}{Math.abs(s.scoreDelta)}
                    </span>
                  )}
                  {s.changesRanking && <span className="ml-1 rounded-full bg-violet2/10 px-1.5 py-0.5 text-[10px] text-violet2">{ja ? '順位変動' : 'reranks'}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[11px] italic text-ink-soft">{ja ? '実際にランキングに影響する要因のみを表示しています。' : 'Only factors that actually influence the deterministic ranking are shown.'}</p>
      </div>

      {/* Phase 8 — action plan (recommended route) */}
      {rec && rec.nextActions.length > 0 && (
        <div className="mt-4 rounded-panel border border-ink/10 bg-white/60 p-4">
          <h3 className="text-sm font-bold text-ink">{ja ? '次にやること' : 'Your next actions'} <span className="font-normal text-ink-soft">— {t(rec.routeName)}</span></h3>
          <ol className="mt-2 space-y-2">
            {rec.nextActions.map((a, i) => (
              <li key={i} className="flex gap-2 text-xs">
                <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink/20 text-[10px] font-bold text-ink-soft">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-ink">
                    <span className={`mr-1 rounded px-1 py-0.5 text-[10px] font-semibold ${a.priority === 'high' ? 'bg-coral/10 text-coral' : a.priority === 'medium' ? 'bg-amber2/10 text-amber2' : 'bg-ink/5 text-ink-soft'}`}>
                      {a.priority === 'high' ? (ja ? '優先度：高' : 'High') : a.priority === 'medium' ? (ja ? '中' : 'Med') : (ja ? '低' : 'Low')}
                    </span>
                    <span className="font-semibold">{t(a.title)}</span>
                  </p>
                  <p className="text-ink-soft">{t(a.why)}</p>
                  <p className="text-ink-soft">{ja ? '必要な根拠：' : 'Evidence needed: '}{t(a.evidenceNeeded)}{a.deadline ? ` · ${ja ? '期限' : 'deadline'} ${a.deadline}` : ''}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[11px] italic text-ink-soft">{ja ? '架空の期限は表示しません。期限は確認できた場合のみ表示します。' : 'No deadlines are fabricated — a deadline appears only when it is known.'}</p>
        </div>
      )}
    </section>
  );
}
