"use client";

import { useI18n } from "@/lib/i18n";
import { Badge, Card } from "@/components/shared/ui";
import { VerificationBadge } from "@/components/shared/evidence";

const SECTIONS = [
  "matching",
  "verification",
  "sources",
  "sponsored",
  "consent",
  "uncertainty",
  "corrections",
  "outdated",
] as const;

export default function MethodologyClient() {
  const { t, tList } = useI18n();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Badge tone="info">{t("method.badge")}</Badge>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">{t("method.title")}</h1>
      <p className="mt-3 leading-relaxed text-ink-soft">{t("method.intro")}</p>

      <div className="mt-8 space-y-6">
        {SECTIONS.map((s) => (
          <Card key={s} className="p-6">
            <h2 className="text-lg font-semibold text-ink">{t(`method.${s}Title`)}</h2>
            <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink-soft">
              {tList(`method.${s}Body`).map((para) => (
                <p key={para}>{para}</p>
              ))}
            </div>
            {s === "verification" && (
              <div className="mt-4 flex flex-wrap gap-2">
                {["officially_verified", "institution_submitted", "needs_confirmation", "estimated", "outdated", "unavailable"].map((v) => (
                  <VerificationBadge key={v} status={v} />
                ))}
              </div>
            )}
          </Card>
        ))}

        <Card className="border-amber-200 bg-amber-50/50 p-6">
          <h2 className="text-lg font-semibold text-ink">{t("method.noGuaranteeTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t("method.noGuaranteeIntro")}</p>
          <ul className="mt-3 grid gap-1.5 text-sm text-ink sm:grid-cols-2">
            {tList("method.noGuaranteeList").map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-amber-600" aria-hidden>✕</span> {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
