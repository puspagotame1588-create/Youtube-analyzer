'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';

/**
 * Hydration/loading skeleton with a visible progress state, a timeout message,
 * and a retry action — never an indefinite bare "Loading…".
 */
export function PageSkeleton(): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16" role="status" aria-live="polite">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-2/5 rounded-full bg-ink/10" />
        <div className="h-4 w-3/5 rounded-full bg-ink/5" />
        <div className="h-40 rounded-panel bg-ink/5" />
        <div className="h-24 rounded-panel bg-ink/5" />
      </div>
      <p className="mt-6 text-center text-sm text-ink-soft">
        {slow ? (
          <>
            {ja ? '読み込みに時間がかかっています。' : 'This is taking longer than expected.'}{' '}
            <button onClick={() => window.location.reload()} className="font-semibold text-cyan2 hover:underline">
              {ja ? '再読み込み' : 'Reload'}
            </button>
          </>
        ) : ja ? (
          '読み込み中…'
        ) : (
          'Loading…'
        )}
      </p>
    </div>
  );
}
