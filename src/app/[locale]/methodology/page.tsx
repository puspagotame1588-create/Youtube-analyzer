import { setRequestLocale } from 'next-intl/server';
import { DEFAULT_WEIGHTS } from '@/lib/simulation/types';

export default function MethodologyPage({ params: { locale } }: { params: { locale: string } }): React.JSX.Element {
  setRequestLocale(locale);
  const ja = locale === 'ja';

  const weights: Array<[string, string, number]> = [
    ['Affordability', '費用適合度', DEFAULT_WEIGHTS.affordability],
    ['Visa feasibility', '在留資格の実現性', DEFAULT_WEIGHTS.visa],
    ['Employment feasibility', '就職実現性', DEFAULT_WEIGHTS.employment],
    ['Salary potential', '給与ポテンシャル', DEFAULT_WEIGHTS.salary],
    ['Location preference', '希望地との一致', DEFAULT_WEIGHTS.location],
    ['Long-term settlement alignment', '長期定住との整合性', DEFAULT_WEIGHTS.settlement],
    ['Interests & skills', '興味・スキル適合', DEFAULT_WEIGHTS.interest],
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-sm leading-relaxed text-ink">
      <h1 className="text-2xl font-bold sm:text-3xl">{ja ? '評価方法（Methodology）' : 'Methodology'}</h1>

      <h2 className="mt-8 text-lg font-bold">{ja ? 'スコアの仕組み' : 'How scores work'}</h2>
      <p className="mt-2 text-ink-soft">
        {ja
          ? 'CareerVerseのスコアは、検証済みの構造化データと明示的なルールから決定論的に計算されます。同じ入力からは常に同じ結果が出ます。AI（大規模言語モデル）は結果の説明・翻訳・整理のみを行い、スコアや数値を生成することはありません。'
          : 'CareerVerse scores are computed deterministically from verified structured data and explicit rules — the same inputs always produce the same result. AI (a large language model) only explains, translates, and organizes results; it never generates scores or numbers.'}
      </p>

      <h2 className="mt-8 text-lg font-bold">{ja ? '既定の重み' : 'Default weights'}</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[420px] text-left">
          <caption className="sr-only">{ja ? '評価要素と重み' : 'Factors and weights'}</caption>
          <thead>
            <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink-soft">
              <th scope="col" className="py-2 pr-4">{ja ? '要素' : 'Factor'}</th>
              <th scope="col" className="py-2">{ja ? '重み' : 'Weight'}</th>
            </tr>
          </thead>
          <tbody>
            {weights.map(([en, jaLabel, w]) => (
              <tr key={en} className="border-b border-ink/5">
                <td className="py-2 pr-4">{ja ? jaLabel : en}</td>
                <td className="py-2 tabular-nums">{w}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-ink-soft">
        {ja ? '重みはユーザーが調整でき、その場合は自動的に再正規化されます。' : 'Weights are user-adjustable and renormalize automatically.'}
      </p>

      <h2 className="mt-8 text-lg font-bold">{ja ? '3つのケース' : 'Three cases'}</h2>
      <p className="mt-2 text-ink-soft">
        {ja
          ? '不確実な入力（予算の幅、JLPTの見込みなど）は、保守的・期待・楽観の3ケースに展開して計算します。数値の確率は、十分に信頼できるデータセットが存在しない限り表示しません。その代わりに実現性（低・中・高）と根拠の強さ（弱・中・強）を表示します。'
          : 'Uncertain inputs (budget ranges, expected JLPT results) expand into conservative / expected / optimistic cases. Numeric probabilities are not shown unless a sufficiently credible dataset exists — instead we show feasibility (low/medium/high) and evidence strength (weak/moderate/strong).'}
      </p>

      <h2 className="mt-8 text-lg font-bold">{ja ? '接戦の扱い' : 'Close calls'}</h2>
      <p className="mt-2 text-ink-soft">
        {ja
          ? '上位ルートのスコア差が5点以内の場合、「どちらかが明確に優れているわけではない」と明示します。人工的な1位は作りません。'
          : 'When top routes are within 5 points, we explicitly say neither is clearly superior. We never force an artificial winner.'}
      </p>

      <h2 className="mt-8 text-lg font-bold">{ja ? '限界' : 'Known limitations'}</h2>
      <ul className="mt-2 list-inside list-disc space-y-1 text-ink-soft">
        <li>{ja ? 'ベータ版のデータは関東のデモデータであり、網羅的ではありません。' : 'Beta data is a Kanto demonstration set — not complete coverage.'}</li>
        <li>{ja ? '在留資格に関する出力は一般情報であり、個別審査を予測するものではありません。' : 'Residence-status outputs are general information, not predictions of individual review outcomes.'}</li>
        <li>{ja ? '給与レンジの多くは参考値（デモ）としてラベル付けされています。' : 'Most salary ranges are labeled as reference (demo) values.'}</li>
        <li>{ja ? '言語成長の仮定（在学中のJLPT向上）は既定ルールであり、個人差があります。' : 'Language-growth assumptions during study are default rules; individuals vary.'}</li>
      </ul>

      <h2 className="mt-8 text-lg font-bold">{ja ? 'スポンサー表示' : 'Sponsored content'}</h2>
      <p className="mt-2 text-ink-soft">
        {ja
          ? 'スポンサー校は必ず「スポンサー」ラベルが付き、推薦スコアに一切の優遇はありません。'
          : 'Sponsored schools are always labeled and never receive any recommendation-score advantage.'}
      </p>
    </div>
  );
}
