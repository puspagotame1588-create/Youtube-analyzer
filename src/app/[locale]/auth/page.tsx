'use client';

/** Beta account creation / sign-in (local beta mode, clearly labeled). */

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useAppStore } from '@/lib/store/app';
import { useHydrated } from '@/components/ui/useHydrated';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

export default function AuthPage(): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';
  const hydrated = useHydrated();
  const router = useRouter();
  const account = useAppStore((s) => s.account);
  const signUp = useAppStore((s) => s.signUp);
  const signOut = useAppStore((s) => s.signOut);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [age, setAge] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hydrated) return <PageSkeleton />;

  if (account) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="cv-glass-strong rounded-panel p-8 shadow-panel">
          <h1 className="text-xl font-bold text-ink">
            {ja ? `こんにちは、${account.displayName}さん` : `Hello, ${account.displayName}`}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">{account.email}</p>
          <div className="mt-6 flex flex-col gap-2">
            <button onClick={() => router.push('/profile')} className="min-h-[44px] rounded-full bg-ink px-6 text-sm font-semibold text-white">
              {ja ? 'プロフィールへ' : 'Go to profile'}
            </button>
            <button onClick={signOut} className="min-h-[44px] rounded-full border border-ink/10 px-6 text-sm font-semibold text-ink">
              {ja ? 'ログアウト' : 'Sign out'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const errText: Record<string, { en: string; ja: string }> = {
    age: { en: 'CareerVerse is an 18+ service. Please confirm your age.', ja: 'CareerVerseは18歳以上のサービスです。年齢の確認をお願いします。' },
    'beta-code': { en: 'Invalid beta access code. Ask the CareerVerse team for an invitation.', ja: 'ベータコードが正しくありません。運営チームに招待をお問い合わせください。' },
    email: { en: 'Please enter a valid email address.', ja: '正しいメールアドレスを入力してください。' },
  };

  return (
    <div className="cv-hero-gradient min-h-[80svh] py-16">
      <div className="mx-auto max-w-md px-4">
        <div className="cv-glass-strong rounded-panel p-8 shadow-panel">
          <h1 className="text-xl font-bold text-ink">{ja ? 'ベータアカウント作成' : 'Create your beta account'}</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {ja
              ? '保存・比較・アラート・書類には、アカウントが必要です（18歳以上・招待制）。'
              : 'Saving, comparing, alerts, and documents need an account (18+, invitation only).'}
          </p>
          <p className="mt-3 rounded-xl bg-cyan2/10 px-3 py-2 text-xs text-cyan2">
            {ja
              ? 'ローカルベータモード：アカウントとデータはこの端末のブラウザにのみ保存されます。'
              : 'Local beta mode: your account and data are stored only in this device’s browser.'}
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const out = signUp(email.trim(), name.trim(), code, age);
              if (!out.ok) {
                setError(out.error ?? 'unknown');
                return;
              }
              router.push('/universe');
            }}
          >
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-ink-soft">{ja ? 'メールアドレス' : 'Email'}</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-ink/10 bg-white px-3 text-ink"
                autoComplete="email"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-ink-soft">{ja ? '表示名' : 'Display name'}</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-ink/10 bg-white px-3 text-ink"
                autoComplete="nickname"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-ink-soft">{ja ? 'ベータアクセスコード' : 'Beta access code'}</span>
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-ink/10 bg-white px-3 text-ink"
                placeholder="KANTO-BETA"
              />
            </label>
            <label className="flex min-h-[44px] cursor-pointer items-start gap-3 text-sm text-ink">
              <input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[#00B8D9]" />
              {ja ? '私は18歳以上です。' : 'I confirm that I am 18 or older.'}
            </label>

            {error && (
              <p role="alert" className="rounded-xl border border-coral/40 bg-coral/5 px-3 py-2 text-sm text-coral">
                {errText[error] ? (ja ? errText[error].ja : errText[error].en) : ja ? 'エラーが発生しました。' : 'Something went wrong.'}
              </p>
            )}

            <button type="submit" className="min-h-[48px] w-full rounded-full bg-gradient-to-r from-cyan2 to-violet2 text-sm font-semibold text-white shadow-glow hover:brightness-110">
              {ja ? 'アカウントを作成' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
