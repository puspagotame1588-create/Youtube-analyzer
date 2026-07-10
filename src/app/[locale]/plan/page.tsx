'use client';

/**
 * Action Plan — a bilingual, deterministic plan generated from the chosen
 * route's milestones and data. Optional AI explanation via /api/ai (clearly
 * labeled when the rule-based development provider answers).
 */

import { useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useAppStore } from '@/lib/store/app';
import { useHydrated } from '@/components/ui/useHydrated';
import { dataset } from '@/lib/data/seed';
import { yen, months } from '@/lib/i18n/bi';
import { FACTOR_LABELS } from '@/components/universe/labels';
import { pick } from '@/lib/i18n/bi';

type PlanLang = 'both' | 'en' | 'ja';

export default function PlanPage(): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';
  const hydrated = useHydrated();
  const result = useAppStore((s) => s.currentResult);
  const routeNames = useAppStore((s) => s.currentRouteNames);
  const [routeId, setRouteId] = useState<string | null>(null);
  const [planLang, setPlanLang] = useState<PlanLang>('both');
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const route = useMemo(() => {
    if (!result) return null;
    return result.routes.find((r) => r.id === routeId) ?? result.routes[0] ?? null;
  }, [result, routeId]);

  if (!hydrated) return <div className="p-20 text-center text-ink-soft">…</div>;

  if (!result || !route) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-ink">{ja ? 'アクションプランがまだありません' : 'No action plan yet'}</h1>
        <p className="mt-2 text-sm text-ink-soft">{ja ? 'まずシミュレーションを実行してください。' : 'Run a simulation first.'}</p>
        <Link href="/create" className="mt-6 inline-flex min-h-[44px] items-center rounded-full bg-gradient-to-r from-cyan2 to-violet2 px-8 py-2.5 text-sm font-semibold text-white shadow-glow">
          {ja ? '未来をつくる' : 'Create your future'}
        </Link>
      </div>
    );
  }

  const school = dataset.schools.find((s) => route.schoolIds.includes(s.id));
  const near = route.milestones.filter((m) => m.monthOffset <= 12 && m.kind !== 'now');
  const name = routeNames[route.id] ?? (ja ? route.nameJa : route.nameEn);

  const askAi = async (): Promise<void> => {
    setAiLoading(true);
    setAiText(null);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'explain-route',
          locale,
          routeName: name,
          factors: route.breakdown.map((f) => ({
            factor: pick(FACTOR_LABELS[f.factor], locale),
            score: f.score,
            weight: f.weight,
            reason: ja ? f.reasonJa : f.reasonEn,
          })),
          feasibility: route.feasibility,
          evidence: route.evidence,
          closeCall: result.closeCall,
        }),
      });
      if (!res.ok) throw new Error('failed');
      const json = (await res.json()) as { provider: string; data: { explanation: string } };
      setAiText(json.data.explanation);
      setAiProvider(json.provider);
    } catch {
      setAiText(ja ? '説明の取得に失敗しました。時間をおいて再度お試しください。' : 'Could not fetch the explanation. Please try again later.');
      setAiProvider(null);
    } finally {
      setAiLoading(false);
    }
  };

  const Section = ({ en, jaText }: { en: React.ReactNode; jaText: React.ReactNode }): React.JSX.Element => (
    <div className={`grid gap-4 ${planLang === 'both' ? 'lg:grid-cols-2' : ''}`}>
      {(planLang === 'both' || planLang === 'en') && <div lang="en">{en}</div>}
      {(planLang === 'both' || planLang === 'ja') && <div lang="ja">{jaText}</div>}
    </div>
  );

  const box = 'cv-glass rounded-panel p-5 text-sm leading-relaxed';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">{ja ? 'アクションプラン' : 'Action Plan'}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {ja ? 'マイルストーンから自動生成された、二言語の実行計画です。' : 'A bilingual, deterministic plan generated from your route milestones.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={route.id}
            onChange={(e) => setRouteId(e.target.value)}
            aria-label={ja ? 'ルートを選択' : 'Choose route'}
            className="min-h-[44px] rounded-full border border-ink/10 bg-white px-4 text-sm text-ink"
          >
            {result.routes.map((r) => (
              <option key={r.id} value={r.id}>{routeNames[r.id] ?? (ja ? r.nameJa : r.nameEn)}</option>
            ))}
          </select>
          <div role="group" aria-label={ja ? 'プランの言語' : 'Plan language'} className="flex overflow-hidden rounded-full border border-ink/10">
            {(['both', 'en', 'ja'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setPlanLang(l)}
                aria-pressed={planLang === l}
                className={`min-h-[44px] px-4 text-xs font-semibold ${planLang === l ? 'bg-ink text-white' : 'bg-white/60 text-ink-soft'}`}
              >
                {l === 'both' ? (ja ? '両方' : 'Both') : l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <Section
          en={
            <section className={box}>
              <h2 className="font-bold text-ink">Your goal</h2>
              <p className="mt-2 text-ink">
                Route: <strong>{name}</strong> — first full-time job in about {months(route.monthsToJob, 'en')}, education cost around {yen(route.totalCostJpy.expected)} (expected case).
              </p>
            </section>
          }
          jaText={
            <section className={box}>
              <h2 className="font-bold text-ink">あなたの目標</h2>
              <p className="mt-2 text-ink">
                ルート：<strong>{routeNames[route.id] ?? route.nameJa}</strong> — 初めてのフルタイム就職まで約{months(route.monthsToJob, 'ja')}、教育費の目安は{yen(route.totalCostJpy.expected)}（期待ケース）。
              </p>
            </section>
          }
        />

        <Section
          en={
            <section className={box}>
              <h2 className="font-bold text-ink">Next 12 months</h2>
              <ol className="mt-2 list-inside list-decimal space-y-2 text-ink">
                {near.map((m) => (
                  <li key={m.id}>
                    <strong>{m.titleEn}</strong> (month {m.monthOffset}){m.costJpy ? ` — ${yen(m.costJpy)}` : ''}
                    <span className="block text-xs text-ink-soft">{m.detailEn}</span>
                  </li>
                ))}
              </ol>
            </section>
          }
          jaText={
            <section className={box}>
              <h2 className="font-bold text-ink">これからの12か月</h2>
              <ol className="mt-2 list-inside list-decimal space-y-2 text-ink">
                {near.map((m) => (
                  <li key={m.id}>
                    <strong>{m.titleJa}</strong>（{m.monthOffset}か月後）{m.costJpy ? ` — ${yen(m.costJpy)}` : ''}
                    <span className="block text-xs text-ink-soft">{m.detailJa}</span>
                  </li>
                ))}
              </ol>
            </section>
          }
        />

        {school && (
          <Section
            en={
              <section className={box}>
                <h2 className="font-bold text-ink">School steps</h2>
                <ul className="mt-2 list-inside list-disc space-y-1 text-ink">
                  <li>Request documents from {school.nameEn} and confirm application months ({school.applicationMonths.join(', ')}).</li>
                  <li>Confirm the JLPT {school.jlptRequired.toUpperCase()} requirement{school.ejuRequired ? ' and register for the EJU' : ''}.</li>
                  <li>Prepare first-year funds: {yen(school.firstYearCostJpy)} (ask about installments).</li>
                  <li>Check matching scholarships on the school page and note their deadlines.</li>
                </ul>
              </section>
            }
            jaText={
              <section className={box}>
                <h2 className="font-bold text-ink">学校のステップ</h2>
                <ul className="mt-2 list-inside list-disc space-y-1 text-ink">
                  <li>{school.nameJa}に資料請求し、出願月（{school.applicationMonths.join('、')}月）を確認する。</li>
                  <li>JLPT {school.jlptRequired.toUpperCase()}要件を確認する{school.ejuRequired ? '。EJUの受験登録も行う' : ''}。</li>
                  <li>初年度納入金 {yen(school.firstYearCostJpy)} を準備する（分納の可否を確認）。</li>
                  <li>学校ページの奨学金と締切を確認してメモする。</li>
                </ul>
              </section>
            }
          />
        )}

        <Section
          en={
            <section className={`${box} border border-indigo2/20`}>
              <h2 className="font-bold text-indigo2">Residence status（在留資格）</h2>
              <p className="mt-2 text-ink">{route.visaNote.en}</p>
              <p className="mt-2 text-xs text-ink-soft">Data checked: {route.dataFreshness}. For individual questions, consult a qualified professional (see Support).</p>
            </section>
          }
          jaText={
            <section className={`${box} border border-indigo2/20`}>
              <h2 className="font-bold text-indigo2">在留資格</h2>
              <p className="mt-2 text-ink">{route.visaNote.ja}</p>
              <p className="mt-2 text-xs text-ink-soft">データ確認日：{route.dataFreshness}。個別のご質問は資格を持つ専門家へ（サポート参照）。</p>
            </section>
          }
        />
      </div>

      <section className="mt-6 rounded-panel border border-violet2/25 bg-violet2/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-ink">{ja ? 'AIによる補足説明' : 'AI explanation (optional)'}</h2>
            <p className="text-xs text-ink-soft">
              {ja ? 'スコアはAIではなくルールで計算されています。AIは説明のみを行います。' : 'Scores are rule-based, never AI-generated. The AI only explains.'}
            </p>
          </div>
          <button
            onClick={() => void askAi()}
            disabled={aiLoading}
            className="min-h-[44px] rounded-full bg-violet2 px-6 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
          >
            {aiLoading ? (ja ? '生成中…' : 'Generating…') : ja ? '説明を生成' : 'Generate explanation'}
          </button>
        </div>
        {aiText && (
          <div className="mt-4 rounded-xl bg-white/80 p-4 text-sm leading-relaxed text-ink" role="status">
            {aiProvider === 'mock' && (
              <p className="mb-2 inline-block rounded-full bg-amber2/10 px-3 py-1 text-xs font-semibold text-amber2">
                {ja ? '開発モード — ルールベースの応答（AIモデルの応答ではありません）' : 'Development mode — rule-based response, not a live AI model'}
              </p>
            )}
            <p>{aiText}</p>
          </div>
        )}
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/tracker" className="inline-flex min-h-[44px] items-center rounded-full bg-gradient-to-r from-cyan2 to-violet2 px-6 text-sm font-semibold text-white shadow-glow">
          {ja ? '出願トラッカーへ →' : 'Go to application tracker →'}
        </Link>
        <button
          onClick={() => window.print()}
          className="min-h-[44px] rounded-full border border-ink/10 bg-white/70 px-6 text-sm font-semibold text-ink"
        >
          {ja ? '印刷・PDF保存' : 'Print / save as PDF'}
        </button>
      </div>
    </div>
  );
}
