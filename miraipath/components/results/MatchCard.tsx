"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Bookmark, BookmarkCheck, ChevronDown, GitCompareArrows, MailQuestion } from "lucide-react";
import type { MatchResult, Program } from "@/types";
import { getCampus, getInstitution, getSource } from "@/data/programs";
import { useI18n } from "@/lib/i18n";
import { formatDate, formatJpy, cn } from "@/lib/utils";
import { Badge, Card, Button } from "@/components/shared/ui";
import {
  EligibilityBadge,
  RouteFitScore,
  SourceChip,
  SponsoredTag,
  ReportIssueButton,
} from "@/components/shared/evidence";
import { recordConsent } from "@/lib/store";

export function ScoreBreakdown({ match }: { match: MatchResult }) {
  const { t } = useI18n();
  return (
    <ul className="space-y-1.5 text-sm">
      {match.components.map((c) => (
        <li key={c.key} className="flex items-start justify-between gap-3 border-b border-ink/5 pb-1.5">
          <div>
            <span className="font-medium text-ink">{t(`scoreKeys.${c.key}`)}</span>
            <p className="text-xs leading-relaxed text-ink-soft">{c.reason}</p>
          </div>
          <span
            className={cn(
              "shrink-0 font-semibold tabular-nums",
              c.points > 0 ? "text-emerald-700" : c.points < 0 ? "text-amber-700" : "text-ink-soft"
            )}
          >
            {c.points > 0 ? `+${c.points}` : c.points}
            {c.maxPoints > 0 && <span className="text-xs font-normal text-ink-soft"> / {c.maxPoints}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function MatchCard({
  program,
  match,
  rank,
  saved,
  comparing,
  onToggleSave,
  onToggleCompare,
}: {
  program: Program;
  match: MatchResult;
  rank: number;
  saved: boolean;
  comparing: boolean;
  onToggleSave: () => void;
  onToggleCompare: () => void;
}) {
  const { t, locale } = useI18n();
  const reduced = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [infoRequested, setInfoRequested] = useState(false);
  const institution = getInstitution(program.institutionId);
  const campus = getCampus(program);
  const route = program.admissionRoutes[0];
  const sources = program.sourceIds.map(getSource).filter(Boolean);

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(rank * 0.05, 0.4) }}
    >
      <Card className={cn("p-5 sm:p-6", program.sponsored && "border-violet-200")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{t("common.demoDataBadge")}</Badge>
              {program.sponsored && <SponsoredTag />}
              <EligibilityBadge status={match.eligibility} />
            </div>
            <h3 className="mt-2 text-lg font-bold leading-snug text-ink">
              <Link href={`/programs/${program.id}`} className="hover:text-electric">
                {locale === "ja" ? program.nameJa : program.name}
              </Link>
            </h3>
            <p className="text-sm text-ink-soft">
              {locale === "ja" ? institution?.nameJa : institution?.name}
              {campus ? ` · ${campus.city}` : ""} · {t(`fields.${program.field}`)} ·{" "}
              {t("results.years", { n: program.durationYears })}
            </p>
          </div>
          <RouteFitScore score={match.score} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-ink-soft">{t("results.tuition")}</dt>
            <dd className="font-semibold text-ink">{formatJpy(program.tuition.tuitionFirstYear, locale)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-soft">{t("results.estFirstYearTotal")}</dt>
            <dd className="font-semibold text-ink">{formatJpy(program.tuition.estimatedFirstYearTotal, locale)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-soft">{t("results.nextDeadline")}</dt>
            <dd className="font-semibold text-amber-700">{match.nextDeadline ? formatDate(match.nextDeadline, locale) : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-soft">{t("results.academicYear")}</dt>
            <dd className="font-semibold text-ink">{route.academicYear} · {route.examType.split("+")[0].trim()}</dd>
          </div>
        </dl>

        {match.matchReasons.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-700">{t("results.whyMatch")}</h4>
            <ul className="mt-1 space-y-0.5 text-sm text-ink">
              {match.matchReasons.slice(0, 3).map((r) => (
                <li key={r}>✓ {r}</li>
              ))}
            </ul>
          </div>
        )}

        {(match.missingRequirements.length > 0 || match.mismatchReasons.length > 0) && (
          <div className="mt-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-700">{t("results.gaps")}</h4>
            <ul className="mt-1 space-y-0.5 text-sm text-ink-soft">
              {[...match.mismatchReasons, ...match.missingRequirements].slice(0, 3).map((r) => (
                <li key={r}>△ {r}</li>
              ))}
            </ul>
          </div>
        )}

        {match.warnings.length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
            {match.warnings.map((w) => (
              <p key={w}>⚠ {w}</p>
            ))}
          </div>
        )}

        <div className="mt-4 rounded-lg bg-surface-soft px-3 py-2 text-sm">
          <span className="font-semibold text-ink">{t("results.nextAction")}: </span>
          <span className="text-ink-soft">{match.nextAction}</span>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-electric cursor-pointer"
        >
          {t("results.scoreBreakdown")}
          <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} aria-hidden />
        </button>
        {expanded && (
          <div className="mt-3">
            <ScoreBreakdown match={match} />
            <div className="mt-3 flex flex-wrap gap-2">
              {sources.map((s) => s && <SourceChip key={s.id} source={s} />)}
            </div>
            <div className="mt-2">
              <ReportIssueButton subject={program.name} />
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-ink/5 pt-4">
          <Link
            href={`/programs/${program.id}`}
            className="inline-flex h-9 items-center rounded-full bg-electric px-4 text-sm font-semibold text-white hover:bg-blue-600"
          >
            {t("results.viewProgram")}
          </Link>
          <Button variant="outline" size="sm" onClick={onToggleCompare} aria-pressed={comparing}>
            <GitCompareArrows className="h-4 w-4" aria-hidden />
            {comparing ? t("results.inCompare") : t("results.addCompare")}
          </Button>
          <Button variant="outline" size="sm" onClick={onToggleSave} aria-pressed={saved}>
            {saved ? <BookmarkCheck className="h-4 w-4" aria-hidden /> : <Bookmark className="h-4 w-4" aria-hidden />}
            {saved ? t("results.saved") : t("results.save")}
          </Button>
          {infoRequested ? (
            <span className="text-xs font-medium text-emerald-700" role="status">
              {t("results.infoRequested")}
            </span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                recordConsent("information_request", program.institutionId, program.id);
                setInfoRequested(true);
              }}
            >
              <MailQuestion className="h-4 w-4" aria-hidden />
              {t("results.requestInfo")}
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
