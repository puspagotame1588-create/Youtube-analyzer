'use client';

import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';

/**
 * Persistent, slim prototype-dataset notice. Elegant, not alarming — but
 * always visible so simulation results are never mistaken for verified
 * nationwide coverage.
 */
export function PrototypeBanner(): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';
  return (
    <div className="border-b border-amber2/20 bg-gradient-to-r from-amber2/10 via-amber2/5 to-amber2/10">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-1.5 text-center">
        <span aria-hidden="true" className="text-[11px]">◳</span>
        <p className="text-[11px] leading-snug text-ink">
          {ja
            ? 'プロトタイプ版：シミュレーションはラベル付きのデモデータで動作します。実在校の検証済みリストは順次追加中です。'
            : 'Prototype dataset: simulations run on labeled demonstration data while real Kanto records are verified.'}{' '}
          <Link href="/sources" className="font-semibold text-amber2 underline-offset-2 hover:underline">
            {ja ? 'プロトタイプデータについて' : 'About the prototype dataset'}
          </Link>
        </p>
      </div>
    </div>
  );
}
