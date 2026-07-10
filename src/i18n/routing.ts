import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const locales = ['en', 'ja'] as const;
export type Locale = (typeof locales)[number];

// Architecture note: future locales (zh-Hans, vi, ko, tl, ne) are added here and
// in messages/ — no route or component changes required.
export const routing = defineRouting({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always',
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
