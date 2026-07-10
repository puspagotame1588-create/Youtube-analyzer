import { setRequestLocale } from 'next-intl/server';

export default function TermsPage({ params: { locale } }: { params: { locale: string } }): React.JSX.Element {
  setRequestLocale(locale);
  const ja = locale === 'ja';

  const sections: Array<{ h: string; body: string[] }> = ja
    ? [
        { h: 'サービスの性質', body: ['CareerVerseは一般的な教育情報を提供する進路シミュレーションサービスです。', '法律・入管業務・職業紹介の資格に基づくサービスではありません。', '在留資格・永住に関する出力は一般情報であり、結果を保証するものではありません。最終判断は常に公的審査によります。'] },
        { h: '利用条件', body: ['18歳以上であること。', 'プライベートベータは招待制です。', 'デモデータであることが明示された情報を、検証済みの事実として第三者に提示しないでください。'] },
        { h: '免責', body: ['シミュレーション結果は意思決定の参考情報であり、進学・就職・在留資格の結果を保証しません。', '重要な決定の前には、学校・雇用主・出入国在留管理庁の公式情報、または資格を持つ専門家に必ず確認してください。'] },
        { h: '料金', body: ['プライベートベータ期間中、料金は発生しません。', '将来の有料プランは事前の明確な通知とともに導入されます。'] },
      ]
    : [
        { h: 'Nature of the service', body: ['CareerVerse is a career-simulation service providing general educational information.', 'It is not a licensed legal, immigration, or employment-placement service.', 'Outputs about residence status or permanent residence are general information and never a guarantee. Final decisions always rest with official review.'] },
        { h: 'Conditions of use', body: ['You must be 18 or older.', 'The private beta is invitation-only.', 'Do not present information labeled as demonstration data to others as verified fact.'] },
        { h: 'Disclaimer', body: ['Simulation results are decision support, not guarantees of admission, employment, or residence-status outcomes.', 'Before important decisions, always confirm with schools, employers, the Immigration Services Agency, or a qualified professional.'] },
        { h: 'Fees', body: ['No fees are charged during the private beta.', 'Future paid plans will be introduced with clear advance notice.'] },
      ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-sm leading-relaxed text-ink">
      <h1 className="text-2xl font-bold sm:text-3xl">{ja ? '利用規約' : 'Terms of Service'}</h1>
      <p className="mt-2 text-xs text-ink-soft">{ja ? '最終更新: 2026年6月 · プライベートベータ版' : 'Last updated: June 2026 · private beta'}</p>
      {sections.map((s) => (
        <section key={s.h}>
          <h2 className="mt-8 text-lg font-bold">{s.h}</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-ink-soft">
            {s.body.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
