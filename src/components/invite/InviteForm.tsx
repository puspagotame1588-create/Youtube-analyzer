'use client';

import { useState } from 'react';
import { safeInternalPath } from '@/lib/net/safe-path';

/** Client island of the invite gate; the page shell is server-rendered. */
export function InviteForm({ locale, nextPath }: { locale: string; nextPath?: string }): React.JSX.Element {
  const ja = locale === 'ja';
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
        // Only ever navigate to a validated same-origin path — never an
        // attacker-supplied external/scheme URL from the ?next= param.
        window.location.href = safeInternalPath(nextPath, `/${locale}/create`);
        return;
      }
      if (res.status === 503) {
        setError(
          ja
            ? 'ベータの招待ゲートがまだ設定されていません（フェイルクローズド状態）。運営者が招待コードを発行するまでお待ちください。'
            : 'The beta gate is not configured yet (failing closed). Please wait until the operator issues invite codes.',
        );
      } else if (res.status === 429) {
        setError(ja ? '試行回数が多すぎます。しばらくしてからお試しください。' : 'Too many attempts. Please wait a little while and try again.');
      } else {
        setError(ja ? 'そのコードは使用できません。招待メールのコードをご確認ください。' : 'That code can’t be used. Please check the code from your invitation.');
      }
    } catch {
      setError(ja ? '接続エラーが発生しました。もう一度お試しください。' : 'Connection error. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
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
      <div role="alert" aria-live="polite">
        {error && (
          <p className="rounded-xl border border-coral/40 bg-coral/5 px-3 py-2 text-sm text-coral">{error}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={busy || code.trim().length === 0}
        className="min-h-[48px] w-full rounded-full bg-gradient-to-r from-cyan2 to-violet2 text-sm font-semibold text-white shadow-glow hover:brightness-110 disabled:opacity-50"
      >
        {busy ? (ja ? '確認中…' : 'Checking…') : ja ? 'ベータに入る' : 'Enter the beta'}
      </button>
    </form>
  );
}
