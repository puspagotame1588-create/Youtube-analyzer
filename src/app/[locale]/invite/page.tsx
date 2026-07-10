'use client';

/**
 * Private-beta invite gate. Codes are validated server-side against stored
 * hashes only; failures are generic; attempts are rate-limited.
 */

import { Suspense, useState } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/routing';

function InviteForm(): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';
  const params = useSearchParams();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        const next = params.get('next');
        window.location.href = next && next.startsWith('/') ? next : `/${locale}/create`;
        return;
      }
      setError(
        res.status === 429
          ? ja
            ? '試行回数が多すぎます。しばらくしてからお試しください。'
            : 'Too many attempts. Please wait a little while and try again.'
          : ja
            ? 'そのコードは使用できません。招待メールのコードをご確認ください。'
            : 'That code can’t be used. Please check the code from your invitation.',
      );
    } catch {
      setError(ja ? '接続エラーが発生しました。もう一度お試しください。' : 'Connection error. Please try again.');
    } finally {
      setBusy(false);
    }
  };

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

        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label htmlFor="invite-code" className="sr-only">
            {ja ? '招待コード' : 'Invite code'}
          </label>
          <input
            id="invite-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={ja ? '招待コード' : 'Invite code'}
            autoComplete="off"
            autoCapitalize="characters"
            className="min-h-[48px] w-full rounded-full border border-ink/10 bg-white px-5 text-center text-sm font-semibold tracking-widest text-ink"
          />
          {error && (
            <p role="alert" className="rounded-xl border border-coral/40 bg-coral/5 px-3 py-2 text-sm text-coral">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || code.trim().length === 0}
            className="min-h-[48px] w-full rounded-full bg-gradient-to-r from-cyan2 to-violet2 text-sm font-semibold text-white shadow-glow hover:brightness-110 disabled:opacity-50"
          >
            {busy ? (ja ? '確認中…' : 'Checking…') : ja ? 'ベータに入る' : 'Enter the beta'}
          </button>
        </form>

        <p className="mt-5 text-xs text-ink-soft">
          {ja ? '招待をご希望の方は、サポートからお問い合わせください。' : 'Want an invitation? Contact us via the Support page.'}
        </p>
        <div className="mt-2 flex justify-center gap-4 text-xs">
          <Link href="/support" className="text-indigo2 hover:underline">{ja ? 'サポート' : 'Support'}</Link>
          <Link href="/" className="text-indigo2 hover:underline">{ja ? 'ホームへ' : 'Back to home'}</Link>
        </div>
      </div>
    </div>
  );
}

export default function InvitePage(): React.JSX.Element {
  return (
    <Suspense fallback={<div className="min-h-[60svh]" />}>
      <InviteForm />
    </Suspense>
  );
}
