import { setRequestLocale } from 'next-intl/server';
import { UniverseApp } from '@/components/universe/UniverseApp';
import { simulate } from '@/lib/simulation/engine';
import { dataset } from '@/lib/data/seed';
import { months, yen } from '@/lib/i18n/bi';

/**
 * Simulation Universe — server shell. Without JavaScript, a complete 2D
 * summary of a demonstration simulation is server-rendered (deterministic
 * engine runs on the server) so the page is never an empty loading shell.
 * With JavaScript, the interactive universe uses the visitor's own answers.
 */
export default function UniversePage({ params: { locale } }: { params: { locale: string } }): React.JSX.Element {
  setRequestLocale(locale);
  const ja = locale === 'ja';

  // Deterministic sample run (server-side) for the no-JS summary.
  const sample = simulate(
    {
      goalText: ja ? '東京でITの仕事に就きたい（デモ）' : 'Work in IT in Tokyo (demo)',
      field: 'it',
      education: 'highschool',
      jlptCurrent: 'n3',
      budgetJpy: { min: 1_000_000, expected: 1_500_000, max: 2_000_000 },
      location: 'tokyo',
      interests: ['it'],
    },
    dataset,
    { now: '2026-07-11T00:00:00.000Z' },
  );

  return (
    <>
      <noscript>
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-bold text-ink">{ja ? 'シミュレーション宇宙（2D要約）' : 'Simulation Universe (2D summary)'}</h1>
          <p className="mt-2 rounded-panel border border-amber2/40 bg-amber2/10 p-3 text-sm text-ink">
            {ja
              ? 'JavaScriptが無効のため、対話型の宇宙の代わりに、デモ用プロフィール（IT・東京・N3・予算100〜200万円）による決定論的シミュレーションの完全な2D要約を表示しています。ご自身の条件での結果にはJavaScriptが必要です。'
              : 'JavaScript is disabled, so instead of the interactive universe this is a complete 2D summary of a deterministic simulation for a demonstration profile (IT, Tokyo, N3, ¥1–2M budget). Your own personalized results require JavaScript.'}
          </p>
          {sample.closeCall && (
            <p className="mt-3 text-sm text-ink">
              {ja ? '上位ルートの差はわずかで、どちらかが明確に優れているわけではありません。' : 'The top routes are close — neither is clearly superior.'}
            </p>
          )}
          {sample.routes.map((r) => (
            <section key={r.id} className="mt-6 rounded-panel border border-ink/10 bg-white p-5">
              <h2 className="text-lg font-bold text-ink">
                {ja ? r.nameJa : r.nameEn} — {r.scores.expected}/100
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                {ja ? '就職まで' : 'To first job'}: {months(r.monthsToJob, locale)} · {ja ? '教育費（期待）' : 'education cost (expected)'}: {yen(r.totalCostJpy.expected)} ·{' '}
                {ja ? '実現性' : 'feasibility'}: {r.feasibility} · {ja ? '根拠' : 'evidence'}: {r.evidence}
              </p>
              <ol className="mt-3 list-inside list-decimal space-y-1 text-sm text-ink">
                {r.milestones.map((m) => (
                  <li key={m.id}>
                    {ja ? m.titleJa : m.titleEn}（{ja ? `+${m.monthOffset}か月` : `+${m.monthOffset} mo`}）
                    {m.riskFlag && <strong className="text-coral"> ⚠</strong>}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </noscript>
      <UniverseApp />
    </>
  );
}
