"use client";

/**
 * Ranked, program-level match results for the locally stored profile.
 * All scoring is deterministic (lib/matching.ts) over the seeded demo
 * catalog. Sponsored placements never affect ranking.
 */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GitCompareArrows, Pencil, Share2, MessagesSquare } from "lucide-react";
import { demoPrograms, getProgram } from "@/data/programs";
import { matchAllPrograms } from "@/lib/matching";
import {
  loadProfile,
  getSavedPrograms,
  toggleSavedProgram,
  getComparePrograms,
  toggleCompareProgram,
} from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import type { StudentProfile } from "@/types";
import MatchCard from "@/components/results/MatchCard";
import { Button, Badge } from "@/components/shared/ui";

export default function ResultsClient() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [compare, setCompare] = useState<string[]>([]);

  useEffect(() => {
    setProfile(loadProfile());
    setSaved(getSavedPrograms());
    setCompare(getComparePrograms());
    setLoaded(true);
  }, []);

  const results = useMemo(() => {
    if (!profile) return [];
    return matchAllPrograms(profile, demoPrograms);
  }, [profile]);

  if (!loaded) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center text-ink-soft" role="status">
        {t("results.loading")}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-ink">{t("results.noProfileTitle")}</h1>
        <p className="mt-3 text-ink-soft">{t("results.noProfileBody")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/route-finder"
            className="inline-flex h-11 items-center rounded-full bg-electric px-6 text-sm font-semibold text-white hover:bg-blue-600"
          >
            {t("common.ctaStudent")}
          </Link>
          <Link
            href="/consult"
            className="inline-flex h-11 items-center rounded-full border border-ink/15 px-6 text-sm font-semibold text-ink hover:bg-ink/5"
          >
            {t("results.consultAdvisor")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge tone="caution">{t("common.demoDataBadge")}</Badge>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
            {t("results.title", { name: profile.displayName ?? t("results.you") })}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">{t("results.subtitle", { count: results.length })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/route-finder">
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4" aria-hidden /> {t("results.editProfile")}
            </Button>
          </Link>
          <Link href="/passport">
            <Button variant="secondary" size="sm">
              <Share2 className="h-4 w-4" aria-hidden /> {t("results.createPassport")}
            </Button>
          </Link>
          <Link href="/consult">
            <Button size="sm">
              <MessagesSquare className="h-4 w-4" aria-hidden /> {t("results.consultAdvisor")}
            </Button>
          </Link>
        </div>
      </div>

      <p className="mt-4 rounded-xl border border-ink/10 bg-surface px-4 py-3 text-xs leading-relaxed text-ink-soft">
        {t("results.disclaimer")}
      </p>

      {compare.length > 0 && (
        <div className="sticky top-16 z-30 mt-4 flex items-center justify-between rounded-2xl border border-electric/25 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-md">
          <p className="text-sm font-medium text-ink">
            {t("results.compareTray", { count: compare.length })}
            <span className="ml-2 hidden text-xs text-ink-soft sm:inline">
              {compare.map((id) => getProgram(id)?.name.split("(")[0].trim()).filter(Boolean).join(" · ")}
            </span>
          </p>
          <Link href="/compare">
            <Button size="sm">
              <GitCompareArrows className="h-4 w-4" aria-hidden />
              {t("results.goCompare")}
            </Button>
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-5">
        {results.map((match, i) => {
          const program = getProgram(match.programId);
          if (!program) return null;
          return (
            <MatchCard
              key={match.programId}
              program={program}
              match={match}
              rank={i}
              saved={saved.includes(program.id)}
              comparing={compare.includes(program.id)}
              onToggleSave={() => setSaved(toggleSavedProgram(program.id))}
              onToggleCompare={() => setCompare(toggleCompareProgram(program.id))}
            />
          );
        })}
      </div>
    </div>
  );
}
