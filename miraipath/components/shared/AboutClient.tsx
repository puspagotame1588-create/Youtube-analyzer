"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Badge, Card } from "@/components/shared/ui";

export default function AboutClient() {
  const { t, tList } = useI18n();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Badge tone="info">{t("about.badge")}</Badge>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">{t("about.title")}</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink">{t("about.mission")}</p>
      <p className="mt-3 leading-relaxed text-ink-soft">{t("about.body")}</p>

      <Card className="mt-8 p-6">
        <h2 className="text-lg font-semibold text-ink">{t("about.pilotTitle")}</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
          {tList("about.pilotPoints").map((p) => (
            <li key={p} className="flex gap-2.5">
              <span className="text-electric" aria-hidden>→</span> {p}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="text-lg font-semibold text-ink">{t("about.teamTitle")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t("about.teamBody")}</p>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="text-lg font-semibold text-ink">{t("about.demoVsProdTitle")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t("about.demoVsProdBody")}</p>
        <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
          {tList("about.demoList").map((p) => (
            <li key={p} className="flex gap-2">
              <span className="text-amber-600" aria-hidden>•</span> {p}
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/route-finder" className="inline-flex h-11 items-center rounded-full bg-electric px-6 text-sm font-semibold text-white hover:bg-blue-600">
          {t("common.ctaStudent")}
        </Link>
        <Link href="/institutions" className="inline-flex h-11 items-center rounded-full border border-ink/15 px-6 text-sm font-semibold text-ink hover:bg-ink/5">
          {t("common.ctaInstitution")}
        </Link>
      </div>
    </div>
  );
}
