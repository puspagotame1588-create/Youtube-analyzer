import { setRequestLocale } from 'next-intl/server';
import { InviteForm } from '@/components/invite/InviteForm';

/**
 * Private-beta invite gate — server-rendered shell so the title, instructions,
 * input label, and error region exist in the HTML without JavaScript. The
 * client island only adds submission behavior.
 */
export default function InvitePage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { next?: string };
}): React.JSX.Element {
  setRequestLocale(locale);
  const ja = locale === 'ja';
  const next = typeof searchParams.next === 'string' && searchParams.next.startsWith('/') ? searchParams.next : undefined;

  return (
    <div className="cv-hero-gradient flex min-h-[80svh] items-center justify-center px-4 py-16">
      <div className="cv-glass-strong w-full max-w-md rounded-panel p-8 text-center shadow-panel">
        <div aria-hidden="true" className="mx-auto mb-4 h-14 w-14 rounded-full bg-gradient-to-br from-cyan2 via-violet2 to-emerald2 opacity-80 shadow-glow" />
        <h1 className="text-xl font-bold text-ink">
          {ja ? '招待制プライベートベータ' : 'Invitation-only private beta'}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {ja
            ? 'シミュレーション機能のご利用には招待コードが必要です。学校・キャリア・奨学金・定住ロードマップの閲覧ページは、コードなしでご覧いただけます。'
            : 'The simulation features need an invite code. The school, career, scholarship, and settlement-roadmap browsing pages are open without one.'}
        </p>

        <noscript>
          <p className="mt-4 rounded-xl border border-amber2/40 bg-amber2/10 px-3 py-2 text-xs text-ink">
            {ja
              ? '招待コードの確認にはJavaScriptが必要です。有効にしてから再読み込みしてください。閲覧ページはJavaScriptなしでもご利用いただけます。'
              : 'Checking an invite code requires JavaScript. Please enable it and reload. The browsing pages work without JavaScript.'}
          </p>
        </noscript>

        <InviteForm locale={locale} nextPath={next} />

        <p className="mt-5 text-xs text-ink-soft">
          {ja ? '招待をご希望の方は、サポートからお問い合わせください。' : 'Want an invitation? Contact us via the Support page.'}
        </p>
        <div className="mt-2 flex justify-center gap-4 text-xs">
          <a href={`/${locale}/support`} className="text-indigo2 hover:underline">{ja ? 'サポート' : 'Support'}</a>
          <a href={`/${locale}`} className="text-indigo2 hover:underline">{ja ? 'ホームへ' : 'Back to home'}</a>
        </div>
      </div>
    </div>
  );
}
