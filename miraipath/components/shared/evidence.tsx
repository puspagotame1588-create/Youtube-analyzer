"use client";

/**
 * Evidence UI: source chips, verification badges, eligibility badges,
 * the route-fit tooltip, and the "report incorrect information" control.
 */
import { useState } from "react";
import { ExternalLink, Flag } from "lucide-react";
import type { EligibilityStatus, OfficialSource } from "@/types";
import { Badge, InfoTooltip } from "@/components/shared/ui";
import { ELIGIBILITY_META, VERIFICATION_META, formatDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export function EligibilityBadge({ status }: { status: EligibilityStatus }) {
  const { locale } = useI18n();
  const meta = ELIGIBILITY_META[status];
  return <Badge tone={meta.tone}>{locale === "ja" ? meta.ja : meta.en}</Badge>;
}

export function VerificationBadge({ status }: { status: string }) {
  const { locale } = useI18n();
  const meta = VERIFICATION_META[status] ?? VERIFICATION_META.unavailable;
  return <Badge tone={meta.tone}>{locale === "ja" ? meta.ja : meta.en}</Badge>;
}

export function SourceChip({ source }: { source: OfficialSource }) {
  const { t, locale } = useI18n();
  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-lg border border-ink/10 bg-surface-soft px-2.5 py-1.5 text-xs text-ink-soft">
      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
      <span className="truncate font-medium text-ink" title={source.title}>
        {source.title}
      </span>
      <VerificationBadge status={source.verificationStatus} />
      <span>
        {t("evidence.lastChecked")}: {formatDate(source.lastCheckedDate, locale)}
      </span>
    </span>
  );
}

export function RouteFitScore({
  score,
  size = "md",
}: {
  score: number;
  size?: "md" | "lg";
}) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2">
      <span
        className={
          size === "lg"
            ? "text-4xl font-bold tabular-nums text-ink"
            : "text-2xl font-bold tabular-nums text-ink"
        }
      >
        {score}
      </span>
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-ink-soft">{t("results.routeFitScore")}</span>
        <InfoTooltip label={t("results.routeFitScore")} text={t("results.routeFitTooltip")} />
      </div>
    </div>
  );
}

export function ReportIssueButton({ subject }: { subject: string }) {
  const { t } = useI18n();
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <p className="text-xs font-medium text-emerald-700" role="status">
        {t("evidence.reportThanks")}
      </p>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setSent(true)}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft underline-offset-2 hover:text-ink hover:underline cursor-pointer"
      aria-label={`${t("evidence.reportIssue")}: ${subject}`}
    >
      <Flag className="h-3 w-3" aria-hidden />
      {t("evidence.reportIssue")}
    </button>
  );
}

export function SponsoredTag() {
  const { t } = useI18n();
  return (
    <Badge tone="sponsored">
      {t("evidence.sponsored")}
      <InfoTooltip label={t("evidence.sponsored")} text={t("evidence.sponsoredTooltip")} />
    </Badge>
  );
}
