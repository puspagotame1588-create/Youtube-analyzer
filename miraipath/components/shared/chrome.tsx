"use client";

/**
 * Site chrome: logo, header with language switch, demo banner, footer.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Compass } from "lucide-react";
import { brand } from "@/lib/brand";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 font-bold tracking-tight",
        dark ? "text-white" : "text-ink"
      )}
      aria-label={`${brand.name} home`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-electric to-teal-glow text-white">
        <Compass className="h-5 w-5" aria-hidden />
      </span>
      <span className="text-lg">{brand.name}</span>
    </Link>
  );
}

export function LanguageSwitch({ dark = false }: { dark?: boolean }) {
  const { locale, setLocale } = useI18n();
  return (
    <div
      role="group"
      aria-label="Language / 言語"
      className={cn(
        "flex items-center rounded-full border p-0.5 text-xs font-semibold",
        dark ? "border-white/25 text-white" : "border-ink/15 text-ink"
      )}
    >
      {(["en", "ja"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={cn(
            "rounded-full px-3 py-1 transition-colors cursor-pointer",
            locale === l
              ? "bg-electric text-white"
              : dark
                ? "hover:bg-white/10"
                : "hover:bg-ink/5"
          )}
        >
          {l === "en" ? "EN" : "日本語"}
        </button>
      ))}
    </div>
  );
}

export function DemoBanner() {
  const { t } = useI18n();
  return (
    <div className="bg-amber-warn/15 border-b border-amber-warn/30 px-4 py-1.5 text-center text-xs font-medium text-amber-900">
      {t("common.demoBanner")}
    </div>
  );
}

const NAV_ITEMS = [
  { href: "/route-finder", key: "nav.routeFinder" },
  { href: "/results", key: "nav.results" },
  { href: "/compare", key: "nav.compare" },
  { href: "/institutions", key: "nav.institutions" },
  { href: "/methodology", key: "nav.methodology" },
  { href: "/about", key: "nav.about" },
];

export function Header() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/8 bg-white/85 backdrop-blur-md">
      <DemoBanner />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-electric/10 text-electric"
                  : "text-ink-soft hover:bg-ink/5 hover:text-ink"
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitch />
          <Link
            href="/route-finder"
            className="hidden rounded-full bg-electric px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(59,130,246,0.35)] transition-colors hover:bg-blue-600 md:inline-flex"
          >
            {t("common.ctaStudent")}
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink lg:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>
      {open && (
        <nav aria-label="Mobile" className="border-t border-ink/8 bg-white px-4 py-3 lg:hidden">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm font-medium",
                    pathname === item.href ? "bg-electric/10 text-electric" : "text-ink hover:bg-ink/5"
                  )}
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/route-finder"
                onClick={() => setOpen(false)}
                className="mt-1 block rounded-lg bg-electric px-3 py-2 text-center text-sm font-semibold text-white"
              >
                {t("common.ctaStudent")}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-ink/8 bg-deep text-white/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo dark />
          <p className="mt-3 text-sm leading-relaxed text-white/60">{t("footer.tagline")}</p>
          <p className="mt-4 text-xs text-white/40">{t("common.demoBanner")}</p>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-white">{t("footer.students")}</h2>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/route-finder">{t("nav.routeFinder")}</Link></li>
            <li><Link className="hover:text-white" href="/results">{t("nav.results")}</Link></li>
            <li><Link className="hover:text-white" href="/compare">{t("nav.compare")}</Link></li>
            <li><Link className="hover:text-white" href="/passport">{t("nav.passport")}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-white">{t("footer.institutions")}</h2>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/institutions">{t("nav.institutions")}</Link></li>
            <li><Link className="hover:text-white" href="/institutions/dashboard">{t("nav.dashboard")}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-white">{t("footer.trust")}</h2>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/methodology">{t("nav.methodology")}</Link></li>
            <li><Link className="hover:text-white" href="/privacy">{t("nav.privacy")}</Link></li>
            <li><Link className="hover:text-white" href="/about">{t("nav.about")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/40">
        <p>{t("footer.disclaimer")}</p>
        <p className="mt-1">© 2026 {`${"MiraiPath Japan"}`} (pilot) — {t("footer.fictionalNote")}</p>
      </div>
    </footer>
  );
}
