"use client";

/**
 * Hero wrapper: capability detection (WebGL / reduced motion / low-end),
 * progressive loading of the 3D scene, the "change a factor" controls,
 * the student/institution view toggle, and the route info panel.
 */
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DEFAULT_HERO_CONTROLS,
  type HeroControls,
  type HeroPath,
} from "@/components/3d/sceneGraph";
import type { HeroMode } from "@/components/3d/RouteUniverse";
import Fallback2D from "@/components/3d/Fallback2D";
import { useI18n } from "@/lib/i18n";
import { formatJpy, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const RouteUniverse = dynamic(() => import("@/components/3d/RouteUniverse"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-300/30 border-t-cyan-300" aria-label="Loading 3D scene" role="status" />
    </div>
  ),
});

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

export default function HeroExperience() {
  const { t, locale } = useI18n();
  const [ready, setReady] = useState(false);
  const [use3D, setUse3D] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [controls, setControls] = useState<HeroControls>(DEFAULT_HERO_CONTROLS);
  const [mode, setMode] = useState<HeroMode>("student");
  const [selected, setSelected] = useState<HeroPath | null>(null);

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReducedMotion(rm);
    // Reduced-motion users get the calmer 2D visualization by default.
    setUse3D(!rm && detectWebGL());
    setReady(true);
  }, []);

  const selectedId = selected?.program.id ?? null;

  const infoPanel = useMemo(() => {
    if (!selected) return null;
    const m = selected.match;
    return {
      name: selected.program.name,
      institution: selected.institutionName,
      score: m.score,
      reason: m.matchReasons[0] ?? m.components.find((c) => c.points > 0)?.reason ?? "",
      gap: m.missingRequirements[0] ?? null,
      tuition: selected.program.tuition.estimatedFirstYearTotal,
      deadline: m.nextDeadline,
      href: `/programs/${selected.program.id}`,
    };
  }, [selected]);

  return (
    <div className="relative">
      <div className="relative h-[420px] w-full overflow-hidden rounded-3xl border border-white/10 bg-deep sm:h-[480px] lg:h-[540px]">
        {ready &&
          (use3D ? (
            <RouteUniverse
              controls={controls}
              mode={mode}
              selectedId={selectedId}
              onSelect={setSelected}
              animate={!reducedMotion}
            />
          ) : (
            <div className="starfield h-full w-full p-4">
              <Fallback2D controls={controls} selectedId={selectedId} onSelect={setSelected} />
            </div>
          ))}

        {/* View toggle */}
        <div className="absolute left-3 top-3 z-10 flex rounded-full border border-white/20 bg-[#0b1533]/80 p-0.5 text-xs font-semibold text-white backdrop-blur-sm">
          {(
            [
              { key: "student", label: t("hero.viewStudent") },
              { key: "institution", label: t("hero.viewInstitution") },
            ] as const
          ).map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => {
                setMode(v.key);
                setSelected(null);
              }}
              aria-pressed={mode === v.key}
              className={cn(
                "rounded-full px-3 py-1.5 transition-colors cursor-pointer",
                mode === v.key ? "bg-electric text-white" : "text-white/60 hover:text-white"
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-3 rounded-lg bg-[#0b1533]/70 px-3 py-1.5 text-[11px] text-white/70 backdrop-blur-sm">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#5b9dff]" /> {t("hero.legendUniversity")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-teal-glow" /> {t("hero.legendVocational")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-warn" /> {t("hero.legendWarning")}
          </span>
        </div>

        {/* Route info panel */}
        <AnimatePresence>
          {infoPanel && mode === "student" && (
            <motion.aside
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: reducedMotion ? 0 : 0.25 }}
              className="glass-dark absolute right-3 top-3 z-10 w-72 max-w-[calc(100%-1.5rem)] rounded-2xl p-4 text-white"
              aria-live="polite"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-200/70">
                {t("hero.fictionalExample")}
              </p>
              <h3 className="mt-1 text-sm font-bold leading-snug">{infoPanel.name}</h3>
              <p className="text-xs text-white/60">{infoPanel.institution}</p>
              <p className="mt-2 text-2xl font-bold tabular-nums">
                {infoPanel.score}
                <span className="ml-1.5 text-xs font-medium text-white/60">{t("results.routeFitScore")}</span>
              </p>
              {infoPanel.reason && (
                <p className="mt-2 text-xs leading-relaxed text-emerald-200/90">✓ {infoPanel.reason}</p>
              )}
              {infoPanel.gap && (
                <p className="mt-1 text-xs leading-relaxed text-amber-200/90">△ {t("hero.missing")}: {infoPanel.gap}</p>
              )}
              <p className="mt-2 text-xs text-white/75">
                {t("hero.estFirstYear")}: <strong>{formatJpy(infoPanel.tuition, locale)}</strong>
              </p>
              {infoPanel.deadline && (
                <p className="text-xs text-white/75">
                  {t("hero.nextDeadline")}: <strong>{formatDate(infoPanel.deadline, locale)}</strong>
                </p>
              )}
              <div className="mt-3 flex items-center gap-3">
                <Link
                  href={infoPanel.href}
                  className="rounded-full bg-electric px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-600"
                >
                  {t("hero.viewRoute")}
                </Link>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-xs text-white/50 hover:text-white cursor-pointer"
                >
                  {t("common.close")}
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* "Change a factor" controls — the network visibly reorganizes */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-white/10 bg-[#0b1533]/60 px-4 py-3 text-xs text-white/80 backdrop-blur-sm">
        <span className="font-semibold text-white/60">{t("hero.tryChanging")}</span>
        <label className="flex items-center gap-1.5">
          <span>{t("hero.japaneseLevel")}</span>
          <select
            value={controls.jlptLevel}
            onChange={(e) => setControls((c) => ({ ...c, jlptLevel: e.target.value as HeroControls["jlptLevel"] }))}
            className="rounded-md border border-white/20 bg-[#101d42] px-2 py-1 text-white"
          >
            <option value="N3">N3</option>
            <option value="N2">N2</option>
            <option value="N1">N1</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          <span>{t("hero.budget")}</span>
          <select
            value={controls.budget}
            onChange={(e) => setControls((c) => ({ ...c, budget: Number(e.target.value) as HeroControls["budget"] }))}
            className="rounded-md border border-white/20 bg-[#101d42] px-2 py-1 text-white"
          >
            <option value={900000}>¥900,000</option>
            <option value={1200000}>¥1,200,000</option>
            <option value={1600000}>¥1,600,000</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          <span>{t("hero.targetField")}</span>
          <select
            value={controls.field}
            onChange={(e) => setControls((c) => ({ ...c, field: e.target.value as HeroControls["field"] }))}
            className="rounded-md border border-white/20 bg-[#101d42] px-2 py-1 text-white"
          >
            <option value="it">IT</option>
            <option value="business">Business</option>
            <option value="hospitality">Hospitality</option>
            <option value="design">Design</option>
          </select>
        </label>
        <span className="text-white/40">{t("hero.controlsHint")}</span>
      </div>
    </div>
  );
}
