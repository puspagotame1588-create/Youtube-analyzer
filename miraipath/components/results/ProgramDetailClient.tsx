"use client";

/**
 * Program detail. Facts are explicitly typed by origin: officially verified,
 * institution submitted, estimated, platform interpretation, or unknown —
 * each with its own visual treatment and source chips.
 */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, MapPin, Landmark, GitCompareArrows } from "lucide-react";
import { getProgram, getInstitution, getCampus, getSource } from "@/data/programs";
import { loadProfile, getComparePrograms, toggleCompareProgram, recordConsent } from "@/lib/store";
import { matchProgram } from "@/lib/matching";
import { useI18n } from "@/lib/i18n";
import { formatDate, formatJpy, REGION_LABELS } from "@/lib/utils";
import { Badge, Button, Card } from "@/components/shared/ui";
import {
  EligibilityBadge,
  RouteFitScore,
  SourceChip,
  SponsoredTag,
  VerificationBadge,
  ReportIssueButton,
} from "@/components/shared/evidence";
import { ScoreBreakdown } from "@/components/results/MatchCard";
import type { MatchResult } from "@/types";

export default function ProgramDetailClient({ programId }: { programId: string }) {
  const { t, locale } = useI18n();
  const program = getProgram(programId);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [comparing, setComparing] = useState(false);
  const [requested, setRequested] = useState<string | null>(null);

  useEffect(() => {
    const profile = loadProfile();
    if (profile && program) setMatch(matchProgram(profile, program));
    setComparing(getComparePrograms().includes(programId));
  }, [program, programId]);

  const institution = program ? getInstitution(program.institutionId) : undefined;
  const campus = program ? getCampus(program) : undefined;
  const route = program?.admissionRoutes[0];
  const sources = useMemo(
    () => (program ? program.sourceIds.map(getSource).filter(Boolean) : []),
    [program]
  );

  if (!program || !institution || !route) return null;

  const instTypeKey =
    institution.type === "university" || institution.type === "junior_college"
      ? "form.schoolTypes.university"
      : "form.schoolTypes.vocational_school";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/results" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {t("program.backToResults")}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="caution">{t("common.demoDataBadge")}</Badge>
        {program.sponsored && <SponsoredTag />}
        <Badge tone="info">{t(instTypeKey)}</Badge>
        <Badge tone="neutral">{t(`fields.${program.field}`)}</Badge>
      </div>

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">
        {locale === "ja" ? program.nameJa : program.name}
      </h1>
      <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
        <span className="inline-flex items-center gap-1"><Landmark className="h-4 w-4" aria-hidden />{locale === "ja" ? institution.nameJa : institution.name}</span>
        {campus && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" aria-hidden />
            {campus.city} · {locale === "ja" ? REGION_LABELS[campus.region].ja : REGION_LABELS[campus.region].en}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="h-4 w-4" aria-hidden />
          {t("program.intake")}: {formatDate(route.intakeDate, locale)}
        </span>
      </p>

      <p className="mt-4 max-w-3xl leading-relaxed text-ink">
        {locale === "ja" && program.summaryJa ? program.summaryJa : program.summary}
      </p>

      {match && (
        <Card className="lumin-border mt-6 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <RouteFitScore score={match.score} size="lg" />
            <EligibilityBadge status={match.eligibility} />
          </div>
          <div className="mt-4">
            <ScoreBreakdown match={match} />
          </div>
          <p className="mt-3 text-xs text-ink-soft">{t("results.routeFitTooltip")}</p>
        </Card>
      )}
      {!match && (
        <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm text-ink-soft">{t("program.noProfileHint")}</p>
          <Link href="/route-finder">
            <Button size="sm">{t("common.ctaStudent")}</Button>
          </Link>
        </Card>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Admission */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-ink">{t("program.admissionTitle")}</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-soft">{t("program.route")}</dt>
              <dd className="text-right font-medium text-ink">{locale === "ja" && route.nameJa ? route.nameJa : route.name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-soft">{t("results.academicYear")}</dt>
              <dd className="font-medium text-ink">{route.academicYear}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-soft">{t("program.examType")}</dt>
              <dd className="text-right font-medium text-ink">{route.examType}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-soft">{t("program.applicationPeriod")}</dt>
              <dd className="text-right font-medium text-amber-700">
                {formatDate(route.applicationPeriodStart, locale)} – {formatDate(route.applicationPeriodEnd, locale)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-soft">{t("program.languageOfInstruction")}</dt>
              <dd className="font-medium text-ink">{t(`program.lang.${program.languageOfInstruction}`)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-soft">{t("program.duration")}</dt>
              <dd className="font-medium text-ink">{t("results.years", { n: program.durationYears })} · {program.degreeOrCredential}</dd>
            </div>
          </dl>
          <h3 className="mt-4 text-sm font-semibold text-ink">{t("program.requirements")}</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-ink">
            {route.requirements.map((r) => (
              <li key={r.id} className="flex gap-2">
                <span className={r.required ? "text-electric" : "text-ink-soft"} aria-hidden>
                  {r.required ? "●" : "○"}
                </span>
                <span>
                  {locale === "ja" && r.descriptionJa ? r.descriptionJa : r.description}
                  {!r.required && <span className="ml-1 text-xs text-ink-soft">({t("form.optional")})</span>}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Costs */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">{t("program.costsTitle")}</h2>
            <VerificationBadge status={program.tuition.verificationStatus} />
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-soft">{t("results.tuition")} ({t("program.firstYear")})</dt>
              <dd className="font-semibold text-ink">{formatJpy(program.tuition.tuitionFirstYear, locale)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-soft">{t("program.mandatoryFees")}</dt>
              <dd className="font-semibold text-ink">{formatJpy(program.tuition.mandatoryFeesFirstYear, locale)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-ink/10 pt-2">
              <dt className="font-medium text-ink">{t("results.estFirstYearTotal")}</dt>
              <dd className="text-lg font-bold text-ink">{formatJpy(program.tuition.estimatedFirstYearTotal, locale)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs leading-relaxed text-ink-soft">
            {t("program.costNote")}
            {program.tuition.notes ? ` ${program.tuition.notes}` : ""}
          </p>

          <h3 className="mt-5 text-sm font-semibold text-ink">{t("program.scholarships")}</h3>
          {program.scholarships.length === 0 ? (
            <p className="mt-1 text-sm text-ink-soft">{t("program.noScholarships")}</p>
          ) : (
            <ul className="mt-2 space-y-3">
              {program.scholarships.map((s) => (
                <li key={s.id} className="rounded-lg border border-ink/10 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-ink">{locale === "ja" && s.nameJa ? s.nameJa : s.name}</span>
                    <VerificationBadge status={s.verificationStatus} />
                  </div>
                  <p className="mt-1 text-ink">{s.amountDescription}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">{s.eligibilityNote}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-amber-800">{t("program.scholarshipUncertainty")}</p>
        </Card>
      </div>

      {/* Careers */}
      <Card className="mt-6 p-5">
        <h2 className="text-lg font-semibold text-ink">{t("program.careersTitle")}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(locale === "ja" && program.careerDirectionsJa ? program.careerDirectionsJa : program.careerDirections).map((c) => (
            <Badge key={c} tone="info">{c}</Badge>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-ink-soft">{t("program.careersNote")}</p>
      </Card>

      {/* Evidence */}
      <Card className="mt-6 p-5">
        <h2 className="text-lg font-semibold text-ink">{t("program.evidenceTitle")}</h2>
        <p className="mt-1 text-sm text-ink-soft">{t("program.evidenceIntro")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {sources.map((s) => s && <SourceChip key={s.id} source={s} />)}
        </div>
        {program.uncertaintyNotes && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
            ⚠ {program.uncertaintyNotes}
          </p>
        )}
        <div className="mt-3">
          <ReportIssueButton subject={program.name} />
        </div>
      </Card>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button
          onClick={() => setComparing(toggleCompareProgram(programId).includes(programId))}
          variant={comparing ? "secondary" : "primary"}
        >
          <GitCompareArrows className="h-4 w-4" aria-hidden />
          {comparing ? t("results.inCompare") : t("results.addCompare")}
        </Button>
        {requested === "info" ? (
          <span className="text-sm font-medium text-emerald-700" role="status">{t("results.infoRequested")}</span>
        ) : (
          <Button
            variant="outline"
            onClick={() => {
              recordConsent("information_request", program.institutionId, program.id);
              setRequested("info");
            }}
          >
            {t("results.requestInfo")}
          </Button>
        )}
        <Link href="/compare">
          <Button variant="ghost">{t("nav.compare")} →</Button>
        </Link>
      </div>
      <p className="mt-3 text-xs text-ink-soft">{t("program.consentActionNote")}</p>
    </div>
  );
}
