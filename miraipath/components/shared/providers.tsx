"use client";

import { I18nProvider, useI18n } from "@/lib/i18n";
import { Header, Footer } from "@/components/shared/chrome";

function Shell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <>
      <a href="#main" className="skip-link">
        {t("common.skipToContent")}
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <Shell>{children}</Shell>
    </I18nProvider>
  );
}
