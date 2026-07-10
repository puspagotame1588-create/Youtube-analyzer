import { getTranslations, setRequestLocale } from 'next-intl/server';
import { GatewayHero } from '@/components/home/GatewayHero';
import { pick, type Bi } from '@/lib/i18n/bi';
import { Link } from '@/i18n/routing';

const copy: Record<string, Bi> = {
  howTitle: { en: 'How CareerVerse works', ja: 'CareerVerseの使い方' },
  s1t: { en: '1 · Tell us your future', ja: '1 · なりたい未来を教えてください' },
  s1b: {
    en: 'Five quick questions — goal, education, Japanese level, budget, location. No account needed for your first simulation.',
    ja: '目標・学歴・日本語レベル・予算・希望地の5つの質問だけ。最初のシミュレーションにアカウントは不要です。',
  },
  s2t: { en: '2 · Explore parallel futures', ja: '2 · 並行する未来を探索する' },
  s2b: {
    en: 'University, vocational school, and direct employment appear as explorable 3D routes with real milestones: deadlines, costs, JLPT targets, visa transitions.',
    ja: '大学・専門学校・就職のルートが、出願締切・費用・JLPT目標・在留資格の変更などの現実のマイルストーンつきで3Dルートとして現れます。',
  },
  s3t: { en: '3 · Understand why', ja: '3 · 理由まで理解する' },
  s3b: {
    en: 'Every recommendation opens "Why this result?" — factor scores, evidence strength, sources, dates, and what would change the outcome.',
    ja: 'すべての推薦には「なぜこの結果？」があります。要素ごとのスコア、根拠の強さ、情報源、日付、結果を変える条件まで表示します。',
  },
  trustTitle: { en: 'Built for trust', ja: '信頼のための設計' },
  scopeTitle: { en: 'Private beta scope', ja: 'プライベートベータの範囲' },
  scope: {
    en: 'This beta covers the Kanto region with a demonstration dataset that is clearly labeled. It is general educational information, not legal advice, and coverage is not complete.',
    ja: 'このベータ版は関東地域を対象とし、明示的にラベル付けされたデモデータを使用しています。一般的な教育情報であり法的助言ではなく、網羅的なデータではありません。',
  },
};

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<React.JSX.Element> {
  setRequestLocale(locale);
  const t = await getTranslations('home');

  const steps = [
    { t: copy.s1t, b: copy.s1b, color: 'border-cyan2/40' },
    { t: copy.s2t, b: copy.s2b, color: 'border-violet2/40' },
    { t: copy.s3t, b: copy.s3b, color: 'border-emerald2/40' },
  ];

  return (
    <>
      <GatewayHero />

      <section className="mx-auto max-w-7xl px-4 py-16" aria-labelledby="how-title">
        <h2 id="how-title" className="text-center text-2xl font-bold text-ink sm:text-3xl">
          {pick(copy.howTitle!, locale)}
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} className={`cv-glass cv-depth-card rounded-panel border-t-4 p-6 ${s.color}`}>
              <h3 className="text-lg font-semibold text-ink">{pick(s.t!, locale)}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{pick(s.b!, locale)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white/60 py-16" aria-labelledby="trust-title">
        <div className="mx-auto max-w-7xl px-4">
          <h2 id="trust-title" className="text-center text-2xl font-bold text-ink sm:text-3xl">
            {pick(copy.trustTitle!, locale)}
          </h2>
          <ul className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[t('trust1'), t('trust2'), t('trust3')].map((line, i) => (
              <li key={i} className="flex items-start gap-3 rounded-panel bg-base p-5 text-sm text-ink">
                <span aria-hidden="true" className="mt-0.5 text-emerald2">✓</span>
                {line}
              </li>
            ))}
          </ul>
          <div className="mx-auto mt-10 max-w-3xl rounded-panel border border-amber2/30 bg-amber2/5 p-5 text-sm text-ink">
            <h3 className="font-semibold text-amber2">{pick(copy.scopeTitle!, locale)}</h3>
            <p className="mt-2 text-ink-soft">{pick(copy.scope!, locale)}</p>
          </div>
        </div>
      </section>

      <section className="py-16 text-center">
        <Link
          href="/create"
          className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-gradient-to-r from-cyan2 to-violet2 px-10 py-3 text-base font-semibold text-white shadow-glow transition-all hover:brightness-110"
        >
          {t('cta')}
        </Link>
      </section>
    </>
  );
}
