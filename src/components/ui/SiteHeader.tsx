'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useAppStore } from '@/lib/store/app';
import { useHydrated } from './useHydrated';

const NAV_KEYS = [
  { key: 'create', href: '/create' },
  { key: 'universe', href: '/universe' },
  { key: 'schools', href: '/schools' },
  { key: 'careers', href: '/careers' },
  { key: 'scholarships', href: '/scholarships' },
  { key: 'roadmap', href: '/roadmap' },
  { key: 'plan', href: '/plan' },
  { key: 'tracker', href: '/tracker' },
] as const;

export function SiteHeader(): React.JSX.Element {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();
  const account = useAppStore((s) => s.account);
  const unread = useAppStore((s) => s.notifications.filter((n) => !n.read).length);

  const switchLocale = (next: string): void => {
    router.replace(pathname, { locale: next });
  };

  return (
    <header className="sticky top-0 z-50 cv-glass-strong border-b border-white/60 shadow-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-ink">
            <span
              aria-hidden="true"
              className="inline-block h-6 w-6 rounded-full bg-gradient-to-br from-cyan2 via-violet2 to-emerald2 shadow-glow"
            />
            CareerVerse
          </Link>
          <span className="hidden rounded-full bg-violet2/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet2 sm:inline">
            {t('beta')}
          </span>
        </div>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV_KEYS.slice(0, 6).map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                pathname.startsWith(href) ? 'bg-cyan2/10 font-semibold text-cyan2' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div role="group" aria-label="Language" className="flex overflow-hidden rounded-full border border-ink/10">
            {(['en', 'ja'] as const).map((l) => (
              <button
                key={l}
                onClick={() => switchLocale(l)}
                aria-pressed={locale === l}
                className={`px-3 py-1 text-xs font-semibold transition-colors ${
                  locale === l ? 'bg-ink text-white' : 'bg-white/60 text-ink-soft hover:text-ink'
                }`}
              >
                {l === 'en' ? 'EN' : '日本語'}
              </button>
            ))}
          </div>

          <Link
            href="/notifications"
            aria-label={t('notifications')}
            className="relative hidden rounded-full p-2 text-ink-soft hover:bg-ink/5 sm:block"
          >
            <span aria-hidden="true">🔔</span>
            {hydrated && unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </Link>

          <Link
            href={account ? '/profile' : '/auth'}
            className="hidden rounded-full bg-ink px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo2 sm:block"
          >
            {hydrated && account ? account.displayName : t('signIn')}
          </Link>

          <button
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? t('closeMenu') : t('menu')}
            className="rounded-full p-2 text-ink hover:bg-ink/5 lg:hidden"
          >
            <span aria-hidden="true">{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            aria-label="Mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-ink/5 lg:hidden"
          >
            <div className="grid grid-cols-2 gap-1 p-3">
              {NAV_KEYS.map(({ key, href }) => (
                <Link
                  key={key}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-ink hover:bg-cyan2/10"
                >
                  {t(key)}
                </Link>
              ))}
              <Link
                href="/support"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-ink hover:bg-cyan2/10"
              >
                {t('support')}
              </Link>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-ink hover:bg-cyan2/10"
              >
                {t('settings')}
              </Link>
              <Link
                href={account ? '/profile' : '/auth'}
                onClick={() => setOpen(false)}
                className="col-span-2 rounded-xl bg-ink px-4 py-3 text-center text-sm font-semibold text-white"
              >
                {hydrated && account ? account.displayName : t('signIn')}
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
