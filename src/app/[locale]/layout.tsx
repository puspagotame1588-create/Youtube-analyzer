import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { locales, type Locale } from '@/i18n/routing';
import { SiteHeader } from '@/components/ui/SiteHeader';
import { SiteFooter } from '@/components/ui/SiteFooter';
import { QualityBoot } from '@/components/ui/QualityBoot';
import { PrototypeBanner } from '@/components/ui/PrototypeBanner';
import '../globals.css';

export const metadata: Metadata = {
  title: {
    default: 'CareerVerse — See your possible futures in Japan',
    template: '%s | CareerVerse',
  },
  description:
    'A bilingual career-simulation universe for foreign students in Japan. Compare university, vocational school, and employment routes with clearly labeled data and a transparent methodology.',
};

export const viewport: Viewport = {
  themeColor: '#F7F8FC',
  width: 'device-width',
  initialScale: 1,
};

export function generateStaticParams(): Array<{ locale: string }> {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}): Promise<React.JSX.Element> {
  if (!locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-base font-sans text-ink antialiased">
        <NextIntlClientProvider messages={messages}>
          <QualityBoot />
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-panel"
          >
            {locale === 'ja' ? '本文へスキップ' : 'Skip to content'}
          </a>
          <SiteHeader />
          <PrototypeBanner />
          <main id="main">{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
