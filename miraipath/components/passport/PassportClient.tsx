"use client";

/**
 * Future Passport — client-side canvas image generation (nothing uploaded).
 * The student controls exactly which fields appear. Every card carries a
 * simulation disclaimer. Formats: vertical story, square post, wide link
 * preview (LINE/OG ratio).
 */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Link2, Check } from "lucide-react";
import { demoPrograms, getInstitution, getProgram } from "@/data/programs";
import { matchAllPrograms } from "@/lib/matching";
import { loadProfile, saveProfile } from "@/lib/store";
import { createDemoProfile } from "@/lib/demoProfile";
import { useI18n } from "@/lib/i18n";
import { REGION_LABELS } from "@/lib/utils";
import { Badge, Button, Card, Label, Input } from "@/components/shared/ui";
import type { MatchResult, StudentProfile } from "@/types";

type Format = "story" | "square" | "wide";

const FORMATS: Record<Format, { w: number; h: number; labelKey: string }> = {
  story: { w: 1080, h: 1920, labelKey: "passport.formatStory" },
  square: { w: 1080, h: 1080, labelKey: "passport.formatSquare" },
  wide: { w: 1200, h: 630, labelKey: "passport.formatWide" },
};

interface Toggles {
  nationality: boolean;
  budget: boolean;
  salary: boolean;
  school: boolean;
  japaneseLevel: boolean;
}

function drawPassport(
  canvas: HTMLCanvasElement,
  format: Format,
  data: {
    displayName: string;
    field: string;
    region: string;
    route: string | null;
    school: string | null;
    duration: string | null;
    japaneseMilestone: string | null;
    gap: string | null;
    nextAction: string;
    nationality: string | null;
    budget: string | null;
    salaryAspiration: string | null;
    disclaimer: string;
    brandLine: string;
  }
) {
  const { w, h } = FORMATS[format];
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background: deep navy with soft glows
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#050a1c");
  bg.addColorStop(1, "#0c1638");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const glow = (x: number, y: number, r: number, color: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  };
  glow(w * 0.15, h * 0.2, w * 0.5, "rgba(59,130,246,0.25)");
  glow(w * 0.85, h * 0.8, w * 0.5, "rgba(45,212,191,0.18)");

  // Constellation route line
  ctx.strokeStyle = "rgba(125,211,252,0.5)";
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.beginPath();
  ctx.moveTo(w * 0.12, h * 0.82);
  ctx.quadraticCurveTo(w * 0.4, h * 0.62, w * 0.62, h * 0.7);
  ctx.quadraticCurveTo(w * 0.82, h * 0.76, w * 0.9, h * 0.6);
  ctx.stroke();
  for (const [nx, ny, nr, color] of [
    [0.12, 0.82, 0.012, "#7dd3fc"],
    [0.62, 0.7, 0.009, "#5b9dff"],
    [0.9, 0.6, 0.009, "#2dd4bf"],
  ] as const) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(w * nx, h * ny, w * nr, 0, Math.PI * 2);
    ctx.fill();
  }

  const pad = w * 0.08;
  let y = format === "wide" ? h * 0.16 : h * 0.1;
  const fs = (rel: number) => Math.round(w * rel);

  ctx.fillStyle = "#7dd3fc";
  ctx.font = `600 ${fs(0.026)}px sans-serif`;
  ctx.fillText(data.brandLine.toUpperCase(), pad, y);
  y += fs(0.06);

  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${fs(0.055)}px sans-serif`;
  ctx.fillText(data.displayName, pad, y);
  y += fs(0.075);

  const line = (label: string, value: string, accent = "#e2e8f0") => {
    ctx.fillStyle = "rgba(148,163,184,0.9)";
    ctx.font = `500 ${fs(0.024)}px sans-serif`;
    ctx.fillText(label.toUpperCase(), pad, y);
    y += fs(0.036);
    ctx.fillStyle = accent;
    ctx.font = `600 ${fs(0.032)}px sans-serif`;
    // simple wrap
    const maxWidth = w - pad * 2;
    const words = value.split(" ");
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        ctx.fillText(current, pad, y);
        y += fs(0.04);
        current = word;
      } else {
        current = test;
      }
    }
    ctx.fillText(current, pad, y);
    y += fs(0.055);
  };

  line("Target field", data.field, "#93c5fd");
  line("Preferred region", data.region);
  if (data.route) line("Best current route", data.route, "#5eead4");
  if (data.school) line("Institution", data.school);
  if (data.duration) line("Study duration", data.duration);
  if (data.japaneseMilestone) line("Japanese milestone", data.japaneseMilestone, "#fbbf24");
  if (data.gap) line("Biggest current gap", data.gap, "#fcd34d");
  if (data.nationality) line("Nationality", data.nationality);
  if (data.budget) line("Budget", data.budget);
  if (data.salaryAspiration) line("Salary aspiration (not a prediction)", data.salaryAspiration);
  line("Next action", data.nextAction, "#a5f3fc");

  // Disclaimer footer
  ctx.fillStyle = "rgba(148,163,184,0.75)";
  ctx.font = `400 ${fs(0.019)}px sans-serif`;
  const maxWidth = w - pad * 2;
  const words = data.disclaimer.split(" ");
  let cur = "";
  let dy = h - (format === "wide" ? fs(0.07) : fs(0.09));
  const lines: string[] = [];
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = word;
    } else cur = test;
  }
  lines.push(cur);
  for (const l of lines) {
    ctx.fillText(l, pad, dy);
    dy += fs(0.026);
  }
}

export default function PassportClient() {
  const { t, locale } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [best, setBest] = useState<MatchResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [format, setFormat] = useState<Format>("story");
  const [displayName, setDisplayName] = useState("");
  const [toggles, setToggles] = useState<Toggles>({
    nationality: false,
    budget: false,
    salary: false,
    school: true,
    japaneseLevel: true,
  });
  const [copied, setCopied] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const p = loadProfile();
    setProfile(p);
    if (p) {
      const ranked = matchAllPrograms(p, demoPrograms);
      setBest(ranked[0] ?? null);
      setDisplayName(p.displayName ?? "");
    }
    setLoaded(true);
  }, []);

  const bestProgram = best ? getProgram(best.programId) : undefined;

  const cardData = useMemo(() => {
    if (!profile) return null;
    const inst = bestProgram ? getInstitution(bestProgram.institutionId) : undefined;
    const region =
      profile.preferredRegion && profile.preferredRegion !== "any"
        ? locale === "ja"
          ? REGION_LABELS[profile.preferredRegion].ja
          : REGION_LABELS[profile.preferredRegion].en
        : t("passport.anywhere");
    const jaReq = bestProgram?.admissionRoutes[0].requirements.find((r) => r.kind === "japanese_level");
    const milestone = toggles.japaneseLevel
      ? profile.jlptLevel === "none"
        ? t("passport.milestoneNone")
        : jaReq?.minJlpt && profile.jlptLevel !== jaReq.minJlpt
          ? `${profile.jlptLevel} → ${jaReq.minJlpt}`
          : `JLPT ${profile.jlptLevel} ✓`
      : null;
    return {
      displayName: displayName || t("passport.anonymous"),
      field: t(`fields.${profile.preferredField}`),
      region,
      route: bestProgram ? (locale === "ja" ? bestProgram.nameJa : bestProgram.name) : null,
      school: toggles.school && inst ? (locale === "ja" ? inst.nameJa : inst.name) : null,
      duration: bestProgram ? t("results.years", { n: bestProgram.durationYears }) : null,
      japaneseMilestone: milestone,
      gap: best?.missingRequirements[0] ?? null,
      nextAction: best?.nextAction ?? t("passport.defaultAction"),
      nationality: toggles.nationality && profile.nationality ? profile.nationality : null,
      budget: toggles.budget ? `~¥${profile.tuitionBudgetJpy.toLocaleString()}` : null,
      salaryAspiration:
        toggles.salary && profile.desiredSalaryAspirationJpy
          ? `~¥${profile.desiredSalaryAspirationJpy.toLocaleString()}/yr`
          : null,
      disclaimer: t("passport.disclaimer"),
      brandLine: "MiraiPath Japan · Future Passport (demo)",
    };
  }, [profile, bestProgram, best, displayName, toggles, t, locale]);

  const regenerate = useCallback(() => {
    if (!canvasRef.current || !cardData) return;
    drawPassport(canvasRef.current, format, cardData);
    setDataUrl(canvasRef.current.toDataURL("image/png"));
  }, [cardData, format]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  if (!loaded) {
    return (
      <div className="px-4 py-24 text-center text-ink-soft" role="status">
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
          <Link href="/route-finder" className="inline-flex h-11 items-center rounded-full bg-electric px-6 text-sm font-semibold text-white hover:bg-blue-600">
            {t("common.ctaStudent")}
          </Link>
          <button
            type="button"
            onClick={() => {
              saveProfile(createDemoProfile(locale));
              const p = loadProfile();
              setProfile(p);
              if (p) {
                const ranked = matchAllPrograms(p, demoPrograms);
                setBest(ranked[0] ?? null);
                setDisplayName(p.displayName ?? "");
              }
            }}
            className="inline-flex h-11 cursor-pointer items-center rounded-full border border-ink/15 px-6 text-sm font-semibold text-ink hover:bg-ink/5"
          >
            {t("results.tryDemo")}
          </button>
        </div>
        <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-ink-soft">
          {t("results.tryDemoNote")}
        </p>
      </div>
    );
  }

  const shareLink = () => {
    const url = `${window.location.origin}/route-finder?invite=${encodeURIComponent(displayName || "a friend")}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Badge tone="caution">{t("common.demoDataBadge")}</Badge>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">{t("passport.title")}</h1>
      <p className="mt-1 max-w-2xl text-ink-soft">{t("passport.subtitle")}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_3fr]">
        <div className="space-y-5">
          <Card className="p-5">
            <Label htmlFor="pp-name">{t("form.displayName")}</Label>
            <Input
              id="pp-name"
              value={displayName}
              maxLength={40}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("form.displayNamePlaceholder")}
            />

            <h2 className="mt-5 text-sm font-semibold text-ink">{t("passport.privacyTitle")}</h2>
            <p className="mt-1 text-xs text-ink-soft">{t("passport.privacyNote")}</p>
            <div className="mt-3 space-y-2">
              {(
                [
                  ["school", t("passport.showSchool")],
                  ["japaneseLevel", t("passport.showJapanese")],
                  ["nationality", t("passport.showNationality")],
                  ["budget", t("passport.showBudget")],
                  ["salary", t("passport.showSalary")],
                ] as [keyof Toggles, string][]
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2.5 text-sm text-ink">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--mp-electric)]"
                    checked={toggles[key]}
                    onChange={(e) => setToggles((tg) => ({ ...tg, [key]: e.target.checked }))}
                  />
                  {label}
                </label>
              ))}
            </div>

            <h2 className="mt-5 text-sm font-semibold text-ink">{t("passport.formatTitle")}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {(Object.keys(FORMATS) as Format[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  aria-pressed={format === f}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium cursor-pointer ${
                    format === f ? "border-electric bg-electric/10 text-electric" : "border-ink/15 text-ink-soft hover:bg-ink/5"
                  }`}
                >
                  {t(FORMATS[f].labelKey)}
                </button>
              ))}
            </div>
          </Card>

          <Card className="space-y-3 p-5">
            <a
              href={dataUrl ?? "#"}
              download={`miraipath-future-passport-${format}.png`}
              className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-electric px-5 text-sm font-semibold text-white hover:bg-blue-600 ${!dataUrl ? "pointer-events-none opacity-50" : ""}`}
            >
              <Download className="h-4 w-4" aria-hidden />
              {t("passport.download")}
            </a>
            <Button variant="outline" className="w-full" onClick={shareLink}>
              {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
              {copied ? t("passport.copied") : t("passport.compareWithMe")}
            </Button>
            <p className="text-xs leading-relaxed text-ink-soft">{t("passport.shareNote")}</p>
          </Card>
        </div>

        <div>
          <div className="rounded-3xl border border-ink/10 bg-deep p-4 sm:p-6">
            <canvas
              ref={canvasRef}
              className="mx-auto h-auto w-full rounded-xl"
              style={{ maxWidth: format === "story" ? 320 : format === "square" ? 420 : 560 }}
              role="img"
              aria-label={t("passport.canvasAlt")}
            />
          </div>
          <p className="mt-3 text-center text-xs text-ink-soft">{t("passport.disclaimer")}</p>
        </div>
      </div>
    </div>
  );
}
