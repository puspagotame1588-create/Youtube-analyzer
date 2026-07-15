"use client";

/**
 * Premium side-by-side comparison for up to three routes, plus the
 * "What changes if…" simulator: change exactly one profile variable and
 * see which routes brighten, fade, unlock or gain new risks. The
 * simulation re-runs the same deterministic matcher — no fabricated
 * outcomes, only re-scored fit.
 */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUp, Minus, X } from "lucide-react";
import { demoPrograms, getCampus, getInstitution, getProgram } from "@/data/programs";
import { matchProgram } from "@/lib/matching";
import { loadProfile, getComparePrograms, toggleCompareProgram } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { REGION_LABELS, formatDate, formatJpy, cn } from "@/lib/utils";
import type { StudentProfile } from "@/types";
import { Badge, Button, Card, Select, Label } from "@/components/shared/ui";
import { EligibilityBadge } from "@/components/shared/evidence";

type WhatIf =
  | { kind: "none" }
  | { kind: "jlpt"; value: StudentProfile["jlptLevel"] }
  | { kind: "budget"; value: number }
  | { kind: "region"; value: NonNullable<StudentProfile["preferredRegion"]> }
  | { kind: "schoolType"; value: StudentProfile["schoolTypePreference"] }
  | { kind: "field"; value: StudentProfile["preferredField"] };

function applyWhatIf(profile: StudentProfile, whatIf: WhatIf): StudentProfile {
  switch (whatIf.kind) {
    case "jlpt":
      return { ...profile, jlptLevel: whatIf.value };
    case "budget":
      return { ...profile, tuitionBudgetJpy: whatIf.value };
    case "region":
      return { ...profile, preferredRegion: whatIf.value };
    case "schoolType":
      return { ...profile, schoolTypePreference: whatIf.value };
    case "field":
      return { ...profile, preferredField: whatIf.value };
    default:
      return profile;
  }
}

export default function CompareClient() {
  const { t, locale } = useI18n();
  const reduced = useReducedMotion();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [ids, setIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [whatIf, setWhatIf] = useState<WhatIf>({ kind: "none" });

  useEffect(() => {
    setProfile(loadProfile());
    setIds(getComparePrograms());
    setLoaded(true);
  }, []);

  const programs = useMemo(() => ids.map(getProgram).filter((p) => p !== undefined), [ids]);

  const baseMatches = useMemo(() => {
    if (!profile) return new Map<string, ReturnType<typeof matchProgram>>();
    return new Map(programs.map((p) => [p.id, matchProgram(profile, p)]));
  }, [profile, programs]);

  const simProfile = useMemo(
    () => (profile && whatIf.kind !== "none" ? applyWhatIf(profile, whatIf) : null),
    [profile, whatIf]
  );

  const simMatches = useMemo(() => {
    if (!simProfile) return null;
    return new Map(programs.map((p) => [p.id, matchProgram(simProfile, p)]));
  }, [simProfile, programs]);

  /** Simulator effects across the WHOLE catalog, not just compared programs. */
  const catalogShift = useMemo(() => {
    if (!profile || !simProfile) return null;
    const unlocked: string[] = [];
    const lost: string[] = [];
    for (const p of demoPrograms) {
      const before = matchProgram(profile, p);
      const after = matchProgram(simProfile, p);
      const wasBlocked = before.eligibility === "requirement_not_met";
      const isBlocked = after.eligibility === "requirement_not_met";
      if (wasBlocked && !isBlocked) unlocked.push(p.name);
      if (!wasBlocked && isBlocked) lost.push(p.name);
    }
    return { unlocked, lost };
  }, [profile, simProfile]);

  if (!loaded) return <div className="px-4 py-24 text-center text-ink-soft" role="status">…</div>;

  if (!profile) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-ink">{t("results.noProfileTitle")}</h1>
        <p className="mt-3 text-ink-soft">{t("results.noProfileBody")}</p>
        <Link href="/route-finder" className="mt-6 inline-flex h-11 items-center rounded-full bg-electric px-6 text-sm font-semibold text-white hover:bg-blue-600">
          {t("common.ctaStudent")}
        </Link>
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-ink">{t("compare.emptyTitle")}</h1>
        <p className="mt-3 text-ink-soft">{t("compare.emptyBody")}</p>
        <Link href="/results" className="mt-6 inline-flex h-11 items-center rounded-full bg-electric px-6 text-sm font-semibold text-white hover:bg-blue-600">
          {t("nav.results")}
        </Link>
      </div>
    );
  }

  const rowDefs: {
    key: string;
    label: string;
    render: (pid: string) => React.ReactNode;
  }[] = [
    {
      key: "eligibility",
      label: t("compare.admissionPossibility"),
      render: (pid) => {
        const m = (simMatches ?? baseMatches).get(pid);
        return m ? <EligibilityBadge status={m.eligibility} /> : "—";
      },
    },
    {
      key: "missing",
      label: t("compare.missingRequirements"),
      render: (pid) => {
        const m = (simMatches ?? baseMatches).get(pid);
        if (!m || m.missingRequirements.length === 0)
          return <span className="text-emerald-700">{t("compare.noneKnown")}</span>;
        return (
          <ul className="space-y-1 text-xs">
            {m.missingRequirements.map((r) => (
              <li key={r}>△ {r}</li>
            ))}
          </ul>
        );
      },
    },
    {
      key: "tuition",
      label: t("results.tuition"),
      render: (pid) => formatJpy(getProgram(pid)!.tuition.tuitionFirstYear, locale),
    },
    {
      key: "total",
      label: t("results.estFirstYearTotal"),
      render: (pid) => (
        <strong>{formatJpy(getProgram(pid)!.tuition.estimatedFirstYearTotal, locale)}</strong>
      ),
    },
    {
      key: "duration",
      label: t("program.duration"),
      render: (pid) => t("results.years", { n: getProgram(pid)!.durationYears }),
    },
    {
      key: "japanese",
      label: t("compare.japaneseRequirement"),
      render: (pid) => {
        const req = getProgram(pid)!.admissionRoutes[0].requirements.find((r) => r.kind === "japanese_level");
        return req?.minJlpt ? `JLPT ${req.minJlpt}` : "—";
      },
    },
    {
      key: "location",
      label: t("compare.location"),
      render: (pid) => {
        const campus = getCampus(getProgram(pid)!);
        return campus ? `${campus.city} (${locale === "ja" ? REGION_LABELS[campus.region].ja : REGION_LABELS[campus.region].en})` : "—";
      },
    },
    {
      key: "deadline",
      label: t("results.nextDeadline"),
      render: (pid) => (
        <span className="text-amber-700">
          {formatDate(getProgram(pid)!.admissionRoutes[0].applicationPeriodEnd, locale)}
        </span>
      ),
    },
    {
      key: "scholarship",
      label: t("compare.scholarshipPossibilities"),
      render: (pid) => {
        const s = getProgram(pid)!.scholarships;
        return s.length > 0 ? (
          <span>
            {s[0].amountDescription}
            <span className="block text-xs text-ink-soft">{t("compare.neverGuaranteed")}</span>
          </span>
        ) : (
          t("program.noScholarships")
        );
      },
    },
    {
      key: "career",
      label: t("compare.careerFlexibility"),
      render: (pid) => {
        const p = getProgram(pid)!;
        const uni = getInstitution(p.institutionId)?.type === "university";
        return uni ? t("compare.careerFlexUni") : t("compare.careerFlexVoc");
      },
    },
    {
      key: "speed",
      label: t("compare.speedToEmployment"),
      render: (pid) => t("compare.speedYears", { n: getProgram(pid)!.durationYears }),
    },
    {
      key: "credential",
      label: t("compare.qualificationOutcome"),
      render: (pid) => getProgram(pid)!.degreeOrCredential,
    },
    {
      key: "risks",
      label: t("compare.mainRisks"),
      render: (pid) => {
        const m = (simMatches ?? baseMatches).get(pid);
        if (!m || m.warnings.length === 0) return <span className="text-ink-soft">{t("compare.noneKnown")}</span>;
        return (
          <ul className="space-y-1 text-xs text-amber-900">
            {m.warnings.slice(0, 2).map((w) => (
              <li key={w}>⚠ {w}</li>
            ))}
          </ul>
        );
      },
    },
    {
      key: "next",
      label: t("results.nextAction"),
      render: (pid) => {
        const m = (simMatches ?? baseMatches).get(pid);
        return <span className="text-xs leading-relaxed">{m?.nextAction ?? "—"}</span>;
      },
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Badge tone="caution">{t("common.demoDataBadge")}</Badge>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">{t("compare.title")}</h1>
      <p className="mt-1 text-ink-soft">{t("compare.subtitle")}</p>

      {/* What changes if… simulator */}
      <Card className="lumin-border mt-6 p-5">
        <h2 className="text-lg font-semibold text-ink">{t("compare.whatIfTitle")}</h2>
        <p className="mt-1 text-sm text-ink-soft">{t("compare.whatIfSubtitle")}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="whatif-kind">{t("compare.whatIfVariable")}</Label>
            <Select
              id="whatif-kind"
              value={whatIf.kind}
              onChange={(e) => {
                const kind = e.target.value as WhatIf["kind"];
                if (kind === "none") setWhatIf({ kind: "none" });
                else if (kind === "jlpt") setWhatIf({ kind, value: "N1" });
                else if (kind === "budget") setWhatIf({ kind, value: 1600000 });
                else if (kind === "region") setWhatIf({ kind, value: "kansai" });
                else if (kind === "schoolType") setWhatIf({ kind, value: "vocational_school" });
                else setWhatIf({ kind: "field", value: "it" });
              }}
            >
              <option value="none">{t("compare.whatIfNone")}</option>
              <option value="jlpt">{t("form.jlptLevel")} ({profile.jlptLevel === "none" ? "—" : profile.jlptLevel})</option>
              <option value="budget">{t("form.budget")} ({formatJpy(profile.tuitionBudgetJpy, locale)})</option>
              <option value="region">{t("form.preferredRegion")}</option>
              <option value="schoolType">{t("form.schoolTypePreference")}</option>
              <option value="field">{t("form.preferredField")}</option>
            </Select>
          </div>
          {whatIf.kind !== "none" && (
            <div>
              <Label htmlFor="whatif-value">{t("compare.whatIfNewValue")}</Label>
              {whatIf.kind === "jlpt" && (
                <Select id="whatif-value" value={whatIf.value} onChange={(e) => setWhatIf({ kind: "jlpt", value: e.target.value as StudentProfile["jlptLevel"] })}>
                  {["N3", "N2", "N1"].map((l) => <option key={l} value={l}>{l}</option>)}
                </Select>
              )}
              {whatIf.kind === "budget" && (
                <Select id="whatif-value" value={whatIf.value} onChange={(e) => setWhatIf({ kind: "budget", value: Number(e.target.value) })}>
                  {[1000000, 1200000, 1400000, 1600000, 2000000].map((b) => (
                    <option key={b} value={b}>{formatJpy(b, locale)}</option>
                  ))}
                </Select>
              )}
              {whatIf.kind === "region" && (
                <Select id="whatif-value" value={whatIf.value} onChange={(e) => setWhatIf({ kind: "region", value: e.target.value as NonNullable<StudentProfile["preferredRegion"]> })}>
                  <option value="any">{t("form.anyRegion")}</option>
                  {Object.entries(REGION_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{locale === "ja" ? v.ja : v.en}</option>
                  ))}
                </Select>
              )}
              {whatIf.kind === "schoolType" && (
                <Select id="whatif-value" value={whatIf.value} onChange={(e) => setWhatIf({ kind: "schoolType", value: e.target.value as StudentProfile["schoolTypePreference"] })}>
                  <option value="university">{t("form.schoolTypes.university")}</option>
                  <option value="vocational_school">{t("form.schoolTypes.vocational_school")}</option>
                  <option value="either">{t("form.either")}</option>
                </Select>
              )}
              {whatIf.kind === "field" && (
                <Select id="whatif-value" value={whatIf.value} onChange={(e) => setWhatIf({ kind: "field", value: e.target.value as StudentProfile["preferredField"] })}>
                  {(["it", "business", "engineering", "hospitality", "tourism", "care", "design"] as const).map((f) => (
                    <option key={f} value={f}>{t(`fields.${f}`)}</option>
                  ))}
                </Select>
              )}
            </div>
          )}
          {whatIf.kind !== "none" && (
            <div className="flex items-end">
              <Button variant="outline" onClick={() => setWhatIf({ kind: "none" })}>
                <X className="h-4 w-4" aria-hidden /> {t("compare.whatIfReset")}
              </Button>
            </div>
          )}
        </div>

        {catalogShift && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 grid gap-3 sm:grid-cols-2"
            aria-live="polite"
          >
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
              <h3 className="font-semibold text-emerald-900">{t("compare.unlocked")}</h3>
              {catalogShift.unlocked.length === 0 ? (
                <p className="mt-1 text-emerald-800/70">{t("compare.noChange")}</p>
              ) : (
                <ul className="mt-1 space-y-0.5 text-emerald-900">
                  {catalogShift.unlocked.map((n) => <li key={n}>＋ {n}</li>)}
                </ul>
              )}
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
              <h3 className="font-semibold text-amber-900">{t("compare.becameUnavailable")}</h3>
              {catalogShift.lost.length === 0 ? (
                <p className="mt-1 text-amber-800/70">{t("compare.noChange")}</p>
              ) : (
                <ul className="mt-1 space-y-0.5 text-amber-900">
                  {catalogShift.lost.map((n) => <li key={n}>− {n}</li>)}
                </ul>
              )}
            </div>
          </motion.div>
        )}
        <p className="mt-3 text-xs text-ink-soft">{t("compare.whatIfDisclaimer")}</p>
      </Card>

      {/* Comparison table */}
      <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-surface">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <caption className="sr-only">{t("compare.title")}</caption>
          <thead>
            <tr>
              <th scope="col" className="w-44 border-b border-ink/10 bg-surface-soft p-4 text-left text-xs font-semibold uppercase tracking-wider text-ink-soft">
                {t("compare.category")}
              </th>
              {programs.map((p) => {
                const base = baseMatches.get(p.id);
                const sim = simMatches?.get(p.id);
                const delta = sim && base ? sim.score - base.score : 0;
                return (
                  <th key={p.id} scope="col" className="border-b border-ink/10 p-4 text-left align-top">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link href={`/programs/${p.id}`} className="font-bold leading-snug text-ink hover:text-electric">
                          {locale === "ja" ? p.nameJa : p.name}
                        </Link>
                        <p className="mt-0.5 text-xs font-normal text-ink-soft">
                          {locale === "ja" ? getInstitution(p.institutionId)?.nameJa : getInstitution(p.institutionId)?.name}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIds(toggleCompareProgram(p.id))}
                        aria-label={`${t("compare.remove")}: ${p.name}`}
                        className="rounded p-1 text-ink-soft hover:bg-ink/5 hover:text-ink cursor-pointer"
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <motion.span
                        key={(sim ?? base)?.score}
                        initial={reduced ? false : { scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-2xl font-bold tabular-nums text-ink"
                      >
                        {(sim ?? base)?.score ?? "—"}
                      </motion.span>
                      <span className="text-xs font-normal text-ink-soft">{t("results.routeFitScore")}</span>
                      {sim && base && (
                        <span
                          className={cn(
                            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold",
                            delta > 0 ? "bg-emerald-100 text-emerald-800" : delta < 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {delta > 0 ? <ArrowUp className="h-3 w-3" aria-hidden /> : delta < 0 ? <ArrowDown className="h-3 w-3" aria-hidden /> : <Minus className="h-3 w-3" aria-hidden />}
                          {delta > 0 ? `+${delta}` : delta}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rowDefs.map((row, i) => (
              <tr key={row.key} className={i % 2 === 0 ? "bg-surface" : "bg-surface-soft/60"}>
                <th scope="row" className="border-b border-ink/5 p-4 text-left align-top text-xs font-semibold text-ink-soft">
                  {row.label}
                </th>
                {programs.map((p) => (
                  <td key={p.id} className="border-b border-ink/5 p-4 align-top text-ink">
                    {row.render(p.id)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-ink-soft">{t("compare.footnote")}</p>
    </div>
  );
}
