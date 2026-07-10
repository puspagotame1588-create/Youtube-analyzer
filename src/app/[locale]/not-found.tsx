'use client';

import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function NotFound(): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';
  return (
    <div className="cv-hero-gradient flex min-h-[70svh] items-center justify-center px-4">
      <div className="cv-glass-strong max-w-md rounded-panel p-10 text-center shadow-panel">
        <p aria-hidden="true" className="text-4xl">🛰</p>
        <h1 className="mt-3 text-xl font-bold text-ink">{ja ? 'ページが見つかりません' : 'Page not found'}</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {ja ? 'このルートはまだ宇宙に存在しないようです。' : 'This route doesn’t exist in the universe yet.'}
        </p>
        <Link href="/" className="mt-6 inline-flex min-h-[44px] items-center rounded-full bg-gradient-to-r from-cyan2 to-violet2 px-8 py-2.5 text-sm font-semibold text-white shadow-glow">
          {ja ? 'ホームへ戻る' : 'Go to home'}
        </Link>
      </div>
    </div>
  );
}
