'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export function SiteFooter(): React.JSX.Element {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');
  return (
    <footer className="mt-16 border-t border-ink/5 bg-white/50 py-10 text-sm text-ink-soft">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link className="hover:text-ink" href="/privacy">{t('privacy')}</Link>
          <Link className="hover:text-ink" href="/terms">{t('terms')}</Link>
          <Link className="hover:text-ink" href="/methodology">{t('methodology')}</Link>
          <Link className="hover:text-ink" href="/sources">{t('sources')}</Link>
          <Link className="hover:text-ink" href="/support">{t('support')}</Link>
          <Link className="hover:text-ink" href="/settings">{nav('settings')}</Link>
        </div>
        <p className="mt-4 max-w-3xl text-xs leading-relaxed">{t('disclaimer')}</p>
        <p className="mt-2 text-xs text-ink-soft/70">{t('localMode')}</p>
        <p className="mt-4 text-xs text-ink-soft/60">© 2026 CareerVerse — Private beta</p>
      </div>
    </footer>
  );
}
