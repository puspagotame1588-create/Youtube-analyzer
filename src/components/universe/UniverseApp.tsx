'use client';

/**
 * Parallel Futures Universe — the signature experience.
 * 3D route ribbons (Tier A/B) or an accessible SVG diagram (Tier C), with
 * milestone layers, "Why this result?", assumption editing with explained
 * branch changes, future rewind, renaming, and saving.
 */

import { useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { useAppStore, FREE_SCENARIO_LIMIT } from '@/lib/store/app';
import { useHydrated } from '@/components/ui/useHydrated';
import { SceneCanvas } from '@/components/three/SceneCanvas';
import { Universe2D } from '@/components/universe/Universe2D';
import { WhyPanel } from '@/components/universe/WhyPanel';
import { DecisionReport } from '@/components/universe/DecisionReport';
import { buildDecisionReport } from '@/lib/simulation/decision';
import { dataset } from '@/lib/data/seed';
import { ROUTE_LABEL_TEXT, LEVEL_TEXT } from '@/components/universe/labels';
import { Badge } from '@/components/ui/Badge';
import { pick, yen, months } from '@/lib/i18n/bi';
import type { JlptLevel, SimRoute } from '@/lib/simulation/types';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

const UniverseScene = dynamic(
  () => import('@/components/three/UniverseScene').then((m) => m.UniverseScene),
  { ssr: false, loading: () => null },
);

const BUDGETS = [
  { label: { en: 'Under ¥500k', ja: '〜50万円' }, value: { min: 200_000, expected: 400_000, max: 500_000 } },
  { label: { en: '¥500k–1M', ja: '50万〜100万円' }, value: { min: 500_000, expected: 750_000, max: 1_000_000 } },
  { label: { en: '¥1M–2M', ja: '100万〜200万円' }, value: { min: 1_000_000, expected: 1_500_000, max: 2_000_000 } },
  { label: { en: '¥2M–4M', ja: '200万〜400万円' }, value: { min: 2_000_000, expected: 3_000_000, max: 4_000_000 } },
  { label: { en: 'Over ¥4M', ja: '400万円〜' }, value: { min: 4_000_000, expected: 5_000_000, max: 6_500_000 } },
];

export function UniverseApp(): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';
  const hydrated = useHydrated();
  const router = useRouter();

  const result = useAppStore((s) => s.currentResult);
  const rerunWith = useAppStore((s) => s.rerunWith);
  const lastChange = useAppStore((s) => s.lastChange);
  const account = useAppStore((s) => s.account);
  const scenarios = useAppStore((s) => s.scenarios);
  const saveScenario = useAppStore((s) => s.saveScenario);
  const renameRoute = useAppStore((s) => s.renameRoute);
  const routeNames = useAppStore((s) => s.currentRouteNames);

  const [visibleIds, setVisibleIds] = useState<string[] | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<{ routeId: string; milestoneId: string } | null>(null);
  const [whyRouteId, setWhyRouteId] = useState<string | null>(null);
  const [rewind, setRewind] = useState(1);
  const [saveName, setSaveName] = useState('');
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [scoreDeltas, setScoreDeltas] = useState<Record<string, number>>({});
  const prevScores = useRef<Record<string, number>>({});

  const routes = useMemo(() => result?.routes ?? [], [result]);
  const shown: SimRoute[] = useMemo(() => {
    if (visibleIds) {
      const list = routes.filter((r) => visibleIds.includes(r.id));
      return list.length > 0 ? list.slice(0, 2) : routes.slice(0, 2);
    }
    return routes.slice(0, 2); // free tier: two futures at once
  }, [routes, visibleIds]);

  // Evidence-backed decision report (pure, deterministic — never alters scores).
  const report = useMemo(() => (result ? buildDecisionReport(result, dataset) : null), [result]);

  const displayName = (r: SimRoute): string => routeNames[r.id] ?? (ja ? r.nameJa : r.nameEn);

  if (!hydrated) {
    return <PageSkeleton />;
  }

  if (!result) {
    return (
      <div className="cv-hero-gradient flex min-h-[70svh] items-center justify-center px-4">
        <div className="cv-glass-strong max-w-md rounded-panel p-10 text-center shadow-panel">
          <div aria-hidden="true" className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-cyan2 via-violet2 to-emerald2 opacity-70 shadow-glow" />
          <h1 className="text-xl font-bold text-ink">{ja ? 'まだ未来がありません' : 'No futures yet'}</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {ja ? '5つの質問に答えると、並行する未来がここに現れます。' : 'Answer five questions and your parallel futures will appear here.'}
          </p>
          <Link href="/create" className="mt-6 inline-flex min-h-[44px] items-center rounded-full bg-gradient-to-r from-cyan2 to-violet2 px-8 py-2.5 text-sm font-semibold text-white shadow-glow">
            {ja ? '未来をつくる' : 'Create your future'}
          </Link>
        </div>
      </div>
    );
  }

  const applyPatch = (patch: Parameters<typeof rerunWith>[0]): void => {
    prevScores.current = Object.fromEntries(routes.map((r) => [r.id, r.scores.expected]));
    const out = rerunWith(patch);
    if (out) {
      const deltas: Record<string, number> = {};
      out.result.routes.forEach((r) => {
        const before = prevScores.current[r.id];
        if (before !== undefined) deltas[r.id] = r.scores.expected - before;
      });
      setScoreDeltas(deltas);
    }
  };

  const milestone = selectedMilestone
    ? routes.find((r) => r.id === selectedMilestone.routeId)?.milestones.find((m) => m.id === selectedMilestone.milestoneId)
    : null;
  const whyRoute = whyRouteId ? routes.find((r) => r.id === whyRouteId) : null;
  const profile = result.profile;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{ja ? 'シミュレーション宇宙' : 'Simulation Universe'}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {ja
              ? `目標:「${profile.goalText || '未入力'}」 · エンジン v${result.engineVersion} · ${new Date(result.generatedAt).toLocaleDateString(ja ? 'ja-JP' : 'en-US')}`
              : `Goal: “${profile.goalText || 'not set'}” · engine v${result.engineVersion} · ${new Date(result.generatedAt).toLocaleDateString('en-US')}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {routes.map((r) => {
            const active = shown.some((s) => s.id === r.id);
            return (
              <button
                key={r.id}
                onClick={() => {
                  const cur = shown.map((s) => s.id);
                  if (active && cur.length > 1) setVisibleIds(cur.filter((id) => id !== r.id));
                  else if (!active) setVisibleIds([...cur.slice(-1), r.id]);
                }}
                aria-pressed={active}
                className={`min-h-[40px] rounded-full border px-4 text-xs font-semibold transition-colors ${
                  active ? 'border-cyan2 bg-cyan2/10 text-cyan2' : 'border-ink/10 bg-white/60 text-ink-soft hover:text-ink'
                }`}
              >
                {displayName(r)}
              </button>
            );
          })}
          <Link
            href="/compare"
            className="inline-flex min-h-[40px] items-center rounded-full border border-violet2/40 bg-violet2/5 px-4 text-xs font-semibold text-violet2 hover:bg-violet2/10"
          >
            {ja ? '未来を比較 →' : 'Compare futures →'}
          </Link>
        </div>
      </div>

      {/* Evidence-backed decision report (main result) */}
      {report && <DecisionReport report={report} />}

      {/* What changed and why */}
      <div aria-live="polite">
        <AnimatePresence>
          {lastChange && (
            <motion.div
              key={result.generatedAt}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 rounded-panel border border-violet2/40 bg-violet2/5 px-4 py-3 text-sm text-ink"
            >
              <strong className="text-violet2">{ja ? '変更の理由：' : 'What changed and why:'}</strong>{' '}
              {ja
                ? `「${lastChange.fieldChanged}」を ${lastChange.from} から ${lastChange.to} に変更したため、ルートを再計算しました。`
                : `You changed ${lastChange.fieldChanged} from ${lastChange.from} to ${lastChange.to}, so every route was recalculated.`}{' '}
              {Object.entries(scoreDeltas)
                .filter(([, d]) => d !== 0)
                .map(([id, d]) => {
                  const r = routes.find((x) => x.id === id);
                  return r ? `${displayName(r)}: ${d > 0 ? '+' : ''}${d}` : '';
                })
                .filter(Boolean)
                .join(' · ') || (ja ? 'スコアへの影響はありませんでした。' : 'Scores were unaffected.')}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Visual route map — supporting visualization (secondary to the report above) */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-ink">{ja ? 'ビジュアル・ルートマップ' : 'Visual route map'}</h2>
        <p className="mt-0.5 text-xs text-ink-soft">
          {ja
            ? '上の決定レポートを補足する図です。各ノードは節目（マイルストーン）で、タップすると内容と根拠が表示されます。各ノードの充足状況と次の行動を要件と連動させる機能は開発中です。'
            : 'A supporting view of the decision report above. Each node is a milestone — tap for its detail and evidence. Linking per-node status and next action to the requirement checks is still under development.'}
        </p>
      </div>
      <div className="relative mt-3 h-[52svh] min-h-[360px] overflow-hidden rounded-panel border border-white/70 shadow-panel">
        <SceneCanvas
          label={ja ? '並行する未来の3Dルート表示' : '3D view of your parallel future routes'}
          className="h-full w-full"
          camera={{ position: [0, 5.2, 11], fov: 50 }}
          fallback={
            <div className="h-full overflow-y-auto p-3">
              <Universe2D
                routes={shown}
                selectedRouteId={selectedRouteId}
                selectedMilestoneId={selectedMilestone?.milestoneId ?? null}
                onSelectMilestone={(routeId, milestoneId) => setSelectedMilestone({ routeId, milestoneId })}
                onSelectRoute={(id) => setSelectedRouteId(id === selectedRouteId ? null : id)}
                routeNames={Object.fromEntries(routes.map((r) => [r.id, displayName(r)]))}
              />
            </div>
          }
        >
          <UniverseScene
            routes={shown}
            selectedRouteId={selectedRouteId}
            selectedMilestoneId={selectedMilestone?.milestoneId ?? null}
            onSelectMilestone={(routeId, milestoneId) => setSelectedMilestone({ routeId, milestoneId })}
            rewind={rewind}
            routeNames={Object.fromEntries(routes.map((r) => [r.id, displayName(r)]))}
            animKey={result.generatedAt}
          />
        </SceneCanvas>

        {/* Future Rewind */}
        <div className="absolute bottom-3 left-1/2 w-[min(480px,90%)] -translate-x-1/2 rounded-full bg-white/85 px-4 py-2 shadow-panel backdrop-blur">
          <label htmlFor="rewind" className="flex items-center gap-3 text-xs font-medium text-ink">
            <span className="shrink-0">⏪ {ja ? '未来を巻き戻す' : 'Future rewind'}</span>
            <input
              id="rewind"
              type="range"
              min={0.02}
              max={1}
              step={0.01}
              value={rewind}
              onChange={(e) => {
                setRewind(Number(e.target.value));
                if (!selectedRouteId && shown[0]) setSelectedRouteId(shown[0].id);
              }}
              className="w-full accent-[#8B5CF6]"
            />
            <span className="shrink-0 tabular-nums text-ink-soft">{Math.round(rewind * 100)}%</span>
          </label>
        </div>
      </div>

      {/* Route cards */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {shown.map((r) => (
          <article
            key={r.id}
            className={`cv-glass cv-depth-card rounded-panel border-2 p-5 transition-colors ${
              selectedRouteId === r.id ? 'border-cyan2/60' : 'border-transparent'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                {renaming === r.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = (e.target as HTMLFormElement).elements.namedItem('routeName') as HTMLInputElement;
                      if (input.value.trim()) renameRoute(null, r.id, input.value.trim());
                      setRenaming(null);
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      name="routeName"
                      defaultValue={displayName(r)}
                      autoFocus
                      className="rounded-lg border border-cyan2/50 bg-white px-2 py-1 text-sm font-bold text-ink"
                      aria-label={ja ? 'ルート名を変更' : 'Rename route'}
                    />
                    <button type="submit" className="text-xs font-semibold text-cyan2">✓</button>
                  </form>
                ) : (
                  <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
                    {displayName(r)}
                    <button
                      onClick={() => setRenaming(r.id)}
                      aria-label={ja ? 'ルート名を変更' : 'Rename route'}
                      className="text-xs text-ink-soft hover:text-ink"
                    >
                      ✎
                    </button>
                  </h2>
                )}
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {r.labels.map((l) => (
                    <Badge key={l} tone={l === 'safest' ? 'verified' : l === 'best-overall' ? 'info' : 'future'}>
                      {pick(ROUTE_LABEL_TEXT[l], locale)}
                    </Badge>
                  ))}
                  {r.evidence === 'weak' && <Badge tone="demo">{ja ? 'デモデータ' : 'Demonstration data'}</Badge>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold tabular-nums text-ink">
                  {r.scores.expected}
                  {scoreDeltas[r.id] ? (
                    <span className={`ml-1 text-sm ${(scoreDeltas[r.id] ?? 0) > 0 ? 'text-emerald2' : 'text-coral'}`}>
                      {(scoreDeltas[r.id] ?? 0) > 0 ? '▲' : '▼'}{Math.abs(scoreDeltas[r.id] ?? 0)}
                    </span>
                  ) : null}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-ink-soft">
                  {ja ? 'スコア/100' : 'score / 100'}
                </div>
                <div className="mt-1 text-[10px] tabular-nums text-ink-soft">
                  {ja ? '保守' : 'cons.'} {r.scores.conservative} · {ja ? '楽観' : 'opt.'} {r.scores.optimistic}
                </div>
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-ink-soft">{ja ? '就職まで' : 'To first job'}</dt>
                <dd className="font-semibold text-ink">{months(r.monthsToJob, locale)}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-soft">{ja ? '教育費（期待）' : 'Education cost (exp.)'}</dt>
                <dd className="font-semibold text-ink">{yen(r.totalCostJpy.expected)}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-soft">{ja ? '初任給レンジ' : 'Entry salary'}</dt>
                <dd className="font-semibold text-ink">
                  {yen(r.salaryRangeJpy.min)}–{yen(r.salaryRangeJpy.max)}
                  {r.salaryRangeJpy.isDemo && <span className="ml-1 text-[10px] text-amber2">{ja ? '（デモ）' : '(demo)'}</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-soft">{ja ? '実現性' : 'Feasibility'}</dt>
                <dd className="font-semibold text-ink">{pick(LEVEL_TEXT[r.feasibility]!, locale)}</dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setWhyRouteId(whyRouteId === r.id ? null : r.id)}
                aria-expanded={whyRouteId === r.id}
                className="min-h-[44px] rounded-full border border-indigo2/30 bg-indigo2/5 px-5 text-sm font-semibold text-indigo2 hover:bg-indigo2/10"
              >
                {ja ? 'なぜこの結果？' : 'Why this result?'}
              </button>
              <button
                onClick={() => setSelectedRouteId(selectedRouteId === r.id ? null : r.id)}
                className="min-h-[44px] rounded-full border border-ink/10 bg-white/70 px-5 text-sm font-semibold text-ink hover:border-cyan2/50"
              >
                {selectedRouteId === r.id ? (ja ? 'フォーカス解除' : 'Unfocus') : ja ? '3Dでフォーカス' : 'Focus in 3D'}
              </button>
              <Link
                href={`/route/${r.id}`}
                className="inline-flex min-h-[44px] items-center rounded-full border border-ink/10 bg-white/70 px-5 text-sm font-semibold text-ink hover:border-violet2/50"
              >
                {ja ? '詳細 →' : 'Details →'}
              </Link>
            </div>

            <AnimatePresence>
              {whyRouteId === r.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-5 border-t border-ink/10 pt-5">
                    <WhyPanel route={r} closeCall={result.closeCall} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </article>
        ))}
      </div>

      {/* Assumption editor */}
      <section className="cv-glass mt-8 rounded-panel p-5 shadow-panel" aria-labelledby="assumptions-title">
        <h2 id="assumptions-title" className="text-lg font-bold text-ink">
          {ja ? '前提を変えて、未来の分岐を見る' : 'Change an assumption — watch the futures branch'}
        </h2>
        <p className="mt-1 text-xs text-ink-soft">
          {ja
            ? '変更するたびにルートが再計算され、上に理由が表示されます。'
            : 'Each change recalculates every route and explains the cause above.'}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold text-ink-soft">{ja ? '教育予算' : 'Education budget'}</span>
            <select
              value={BUDGETS.findIndex((b) => b.value.expected === profile.budgetJpy.expected)}
              onChange={(e) => {
                const b = BUDGETS[Number(e.target.value)];
                if (b) applyPatch({ budgetJpy: b.value });
              }}
              className="min-h-[44px] w-full rounded-xl border border-ink/10 bg-white px-3 text-ink"
            >
              {BUDGETS.map((b, i) => (
                <option key={i} value={i}>{pick(b.label, locale)}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold text-ink-soft">{ja ? '日本語レベル' : 'Japanese level'}</span>
            <select
              value={profile.jlptCurrent}
              onChange={(e) => applyPatch({ jlptCurrent: e.target.value as JlptLevel })}
              className="min-h-[44px] w-full rounded-xl border border-ink/10 bg-white px-3 text-ink"
            >
              {(['none', 'n5', 'n4', 'n3', 'n2', 'n1'] as const).map((l) => (
                <option key={l} value={l}>{l === 'none' ? (ja ? 'なし' : 'None') : l.toUpperCase()}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold text-ink-soft">{ja ? '希望地' : 'Location'}</span>
            <select
              value={profile.location}
              onChange={(e) => applyPatch({ location: e.target.value as typeof profile.location })}
              className="min-h-[44px] w-full rounded-xl border border-ink/10 bg-white px-3 text-ink"
            >
              {(['tokyo', 'yokohama', 'chiba', 'saitama', 'kanto-any'] as const).map((l) => (
                <option key={l} value={l}>
                  {l === 'kanto-any' ? (ja ? '関東どこでも' : 'Anywhere in Kanto') : l.charAt(0).toUpperCase() + l.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Save */}
      <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-panel border border-ink/5 bg-white/60 p-5">
        <div>
          <h2 className="font-bold text-ink">{ja ? 'このシミュレーションを保存' : 'Save this simulation'}</h2>
          <p className="text-xs text-ink-soft">
            {account
              ? ja
                ? `無料プラン：${scenarios.length}/${FREE_SCENARIO_LIMIT} 件保存済み`
                : `Explorer (free): ${scenarios.length}/${FREE_SCENARIO_LIMIT} saved`
              : ja
                ? '保存にはアカウントが必要です（ベータコードで登録）。'
                : 'An account is required to save (register with your beta code).'}
          </p>
        </div>
        {account ? (
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const out = saveScenario(saveName || (ja ? 'わたしの未来' : 'My future'));
              setSaveMsg(
                out.ok
                  ? ja ? '保存しました ✓' : 'Saved ✓'
                  : out.error === 'limit'
                    ? ja ? '無料プランの保存上限に達しています。' : 'Free plan save limit reached.'
                    : ja ? '保存できませんでした。' : 'Could not save.',
              );
            }}
          >
            <label htmlFor="save-name" className="sr-only">{ja ? 'シミュレーション名' : 'Simulation name'}</label>
            <input
              id="save-name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder={ja ? 'わたしの未来' : 'My future'}
              className="min-h-[44px] rounded-full border border-ink/10 bg-white px-4 text-sm text-ink"
            />
            <button type="submit" className="min-h-[44px] rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-indigo2">
              {ja ? '保存' : 'Save'}
            </button>
            {saveMsg && <span role="status" className="text-xs font-medium text-ink-soft">{saveMsg}</span>}
          </form>
        ) : (
          <button
            onClick={() => router.push('/auth')}
            className="min-h-[44px] rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-indigo2"
          >
            {ja ? 'アカウント作成 →' : 'Create account →'}
          </button>
        )}
      </section>

      {/* Milestone layer */}
      <AnimatePresence>
        {milestone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/30 p-4 backdrop-blur-sm sm:items-center"
            onClick={() => setSelectedMilestone(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={ja ? milestone.titleJa : milestone.titleEn}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className="cv-glass-strong max-h-[80svh] w-full max-w-lg overflow-y-auto rounded-panel p-6 shadow-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-ink">{ja ? milestone.titleJa : milestone.titleEn}</h3>
                <button
                  onClick={() => setSelectedMilestone(null)}
                  aria-label={ja ? '閉じる' : 'Close'}
                  className="rounded-full p-2 text-ink-soft hover:bg-ink/5"
                >
                  ✕
                </button>
              </div>
              <p className="mt-1 text-xs text-ink-soft">
                {ja ? `現在から約${milestone.monthOffset}か月後` : `About month ${milestone.monthOffset} from now`}
                {milestone.costJpy ? ` · ${yen(milestone.costJpy)}` : ''}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink">{ja ? milestone.detailJa : milestone.detailEn}</p>
              {(() => {
                const srcNames = milestone.sourceIds
                  .map((id) => dataset.sources.find((s) => s.id === id))
                  .filter((s): s is NonNullable<typeof s> => Boolean(s));
                return srcNames.length > 0 ? (
                  <p className="mt-2 text-xs text-ink-soft">
                    {ja ? '根拠：' : 'Evidence: '}
                    {srcNames.map((s, i) => (
                      <span key={s.id}>
                        {i > 0 ? ' · ' : ''}
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-indigo2 underline">{ja ? s.nameJa : s.nameEn}</a>
                      </span>
                    ))}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-ink-soft">{ja ? '根拠：未確認' : 'Evidence: Not verified'}</p>
                );
              })()}
              {milestone.riskFlag && (
                <div className="mt-3 rounded-xl border border-coral/40 bg-coral/5 p-3 text-sm text-ink">
                  <strong className="text-coral">{ja ? 'リスク：' : 'Risk:'}</strong> {ja ? milestone.riskFlag.ja : milestone.riskFlag.en}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
