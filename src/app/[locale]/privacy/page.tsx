import { setRequestLocale } from 'next-intl/server';

export default function PrivacyPage({ params: { locale } }: { params: { locale: string } }): React.JSX.Element {
  setRequestLocale(locale);
  const ja = locale === 'ja';

  const sections: Array<{ h: string; body: string[] }> = ja
    ? [
        { h: '収集する情報', body: ['プロフィール情報（学歴・日本語レベル・予算・希望地など）はシミュレーションのために利用されます。', 'プライベートベータ（ローカルモード）では、これらのデータはあなたの端末のブラウザにのみ保存され、サーバーに送信されません。', 'AI機能を使うとき、必要最小限の構造化データのみがサーバーに送信されます。APIキーがない環境ではルールベースの応答が返され、その旨が表示されます。'] },
        { h: '書類', body: ['パスポート・在留カードは受け付けません。', 'アップロードされたファイルは検証後に破棄され、あなたが確認したフィールドのみが保存されます。', '書類が広告目的で使われることはありません。'] },
        { h: 'あなたの権利', body: ['設定ページからいつでもデータをエクスポート（JSON）できます。', 'アカウント削除ですべてのデータが削除されます。', '18歳未満の方はご利用いただけません。'] },
        { h: '第三者', body: ['ベータ版に広告・トラッキングピクセルはありません。', 'AI処理にAnthropic APIを使用する場合があります（サーバー側のみ、キーはブラウザに送られません）。'] },
      ]
    : [
        { h: 'What we collect', body: ['Profile information (education, Japanese level, budget, preferred location, etc.) is used to run your simulations.', 'In the private beta (local mode) this data is stored only in your device’s browser and is not sent to a server.', 'When you use AI features, only the minimum structured data needed is sent server-side. Without an API key, a rule-based response is returned and labeled as such.'] },
        { h: 'Documents', body: ['Passport and residence-card uploads are not accepted.', 'Uploaded files are discarded after validation; only fields you explicitly confirm are kept.', 'Your documents are never used for advertising.'] },
        { h: 'Your rights', body: ['Export your data (JSON) anytime from Settings.', 'Deleting your account removes all data.', 'CareerVerse is an 18+ service.'] },
        { h: 'Third parties', body: ['The beta contains no ads or tracking pixels.', 'AI processing may use the Anthropic API (server-side only; keys never reach your browser).'] },
      ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-sm leading-relaxed text-ink">
      <h1 className="text-2xl font-bold sm:text-3xl">{ja ? 'プライバシーポリシー' : 'Privacy Policy'}</h1>
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
