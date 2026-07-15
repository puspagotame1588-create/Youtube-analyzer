"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ShieldCheck,
  FileSearch,
  UserCheck,
  Ban,
  Route,
  GitCompareArrows,
  Share2,
  Building2,
  GraduationCap,
  BarChart3,
} from "lucide-react";
import HeroExperience from "@/components/3d/HeroExperience";
import { useI18n } from "@/lib/i18n";
import { Badge, Card } from "@/components/shared/ui";

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

export default function HomeClient() {
  const { t } = useI18n();

  const trustItems = [
    { icon: FileSearch, key: "home.trust1" },
    { icon: ShieldCheck, key: "home.trust2" },
    { icon: UserCheck, key: "home.trust3" },
    { icon: Ban, key: "home.trust4" },
  ];

  return (
    <div>
      {/* ------------------------------------------------ Hero */}
      <section className="starfield relative overflow-hidden bg-deep text-white">
        <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-electric/20 blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-teal-glow/15 blur-[110px]" />

        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-14 lg:grid-cols-[5fr_6fr] lg:pb-20 lg:pt-16">
          <div>
            <Badge tone="info" className="border-cyan-300/30 bg-cyan-400/10 text-cyan-200">
              {t("home.pilotBadge")}
            </Badge>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              {t("home.heroTitle")}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              {t("home.heroSubtitle")}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/route-finder"
                className="inline-flex h-12 items-center rounded-full bg-electric px-7 text-base font-semibold text-white shadow-[0_6px_28px_rgba(59,130,246,0.45)] transition-colors hover:bg-blue-600"
              >
                {t("common.ctaStudent")}
              </Link>
              <Link
                href="/institutions"
                className="inline-flex h-12 items-center rounded-full border border-white/25 px-7 text-base font-semibold text-white/90 transition-colors hover:bg-white/10"
              >
                {t("common.ctaInstitution")}
              </Link>
            </div>
            <p className="mt-5 text-sm text-white/50">{t("home.heroTrustLine")}</p>
          </div>

          <div>
            <HeroExperience />
          </div>
        </div>

        {/* Trust row */}
        <div className="border-t border-white/10 bg-white/[0.03]">
          <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-6 sm:grid-cols-4">
            {trustItems.map(({ icon: Icon, key }) => (
              <li key={key} className="flex items-center gap-2.5 text-sm text-white/75">
                <Icon className="h-4 w-4 shrink-0 text-teal-glow" aria-hidden />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------ How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20" aria-labelledby="how-heading">
        <Reveal>
          <h2 id="how-heading" className="text-center text-3xl font-bold tracking-tight text-ink">
            {t("home.howTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-ink-soft">{t("home.howSubtitle")}</p>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: Route, title: "home.step1Title", body: "home.step1Body" },
            { icon: GitCompareArrows, title: "home.step2Title", body: "home.step2Body" },
            { icon: Share2, title: "home.step3Title", body: "home.step3Body" },
          ].map((step, i) => (
            <Reveal key={step.title} delay={i * 0.1}>
              <Card className="lumin-border h-full p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-electric/10 text-electric">
                  <step.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink">{t(step.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t(step.body)}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ Two-sided value */}
      <section className="bg-deep-2 py-20 text-white" aria-labelledby="sides-heading">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal>
            <h2 id="sides-heading" className="text-center text-3xl font-bold tracking-tight">
              {t("home.sidesTitle")}
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <Reveal>
              <div className="glass-dark h-full rounded-3xl p-8">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300">
                  <GraduationCap className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-xl font-semibold">{t("home.studentSideTitle")}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{t("home.studentSideBody")}</p>
                <ul className="mt-5 space-y-2 text-sm text-white/80">
                  {["home.studentPoint1", "home.studentPoint2", "home.studentPoint3", "home.studentPoint4"].map((k) => (
                    <li key={k} className="flex gap-2">
                      <span className="text-teal-glow" aria-hidden>✓</span> {t(k)}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/route-finder"
                  className="mt-6 inline-flex rounded-full bg-electric px-5 py-2.5 text-sm font-semibold hover:bg-blue-600"
                >
                  {t("common.ctaStudent")}
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="glass-dark h-full rounded-3xl p-8">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-400/15 text-teal-300">
                  <Building2 className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-xl font-semibold">{t("home.institutionSideTitle")}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{t("home.institutionSideBody")}</p>
                <ul className="mt-5 space-y-2 text-sm text-white/80">
                  {["home.instPoint1", "home.instPoint2", "home.instPoint3", "home.instPoint4"].map((k) => (
                    <li key={k} className="flex gap-2">
                      <span className="text-teal-glow" aria-hidden>✓</span> {t(k)}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/institutions"
                  className="mt-6 inline-flex rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold hover:bg-white/10"
                >
                  {t("common.ctaInstitution")}
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Evidence-first */}
      <section className="mx-auto max-w-6xl px-4 py-20" aria-labelledby="evidence-heading">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div>
              <h2 id="evidence-heading" className="text-3xl font-bold tracking-tight text-ink">
                {t("home.evidenceTitle")}
              </h2>
              <p className="mt-4 leading-relaxed text-ink-soft">{t("home.evidenceBody")}</p>
              <ul className="mt-6 space-y-3 text-sm text-ink">
                {["home.evidencePoint1", "home.evidencePoint2", "home.evidencePoint3"].map((k) => (
                  <li key={k} className="flex gap-2.5">
                    <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-electric" aria-hidden />
                    {t(k)}
                  </li>
                ))}
              </ul>
              <Link
                href="/methodology"
                className="mt-6 inline-flex text-sm font-semibold text-electric underline-offset-4 hover:underline"
              >
                {t("home.evidenceLink")} →
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                {t("home.scoreExampleLabel")}
              </p>
              <p className="mt-2 text-4xl font-bold text-ink">
                82 <span className="text-sm font-medium text-ink-soft">{t("results.routeFitScore")}</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {[
                  { label: t("home.exJa"), pts: "+20", tone: "text-emerald-700" },
                  { label: t("home.exBudget"), pts: "+18", tone: "text-emerald-700" },
                  { label: t("home.exField"), pts: "+20", tone: "text-emerald-700" },
                  { label: t("home.exLocation"), pts: "+8", tone: "text-emerald-700" },
                  { label: t("home.exType"), pts: "+10", tone: "text-emerald-700" },
                  { label: t("home.exEju"), pts: "−6", tone: "text-amber-700" },
                ].map((row) => (
                  <li key={row.label} className="flex items-center justify-between border-b border-ink/5 pb-2">
                    <span className="text-ink-soft">{row.label}</span>
                    <span className={`font-semibold tabular-nums ${row.tone}`}>{row.pts}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-relaxed text-ink-soft">{t("results.routeFitTooltip")}</p>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------ Final CTA */}
      <section className="starfield bg-deep py-20 text-center text-white">
        <div className="mx-auto max-w-3xl px-4">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("home.finalCtaTitle")}</h2>
            <p className="mt-4 text-white/70">{t("home.finalCtaBody")}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/route-finder"
                className="inline-flex h-12 items-center rounded-full bg-electric px-7 text-base font-semibold shadow-[0_6px_28px_rgba(59,130,246,0.45)] hover:bg-blue-600"
              >
                {t("common.ctaStudent")}
              </Link>
              <Link
                href="/institutions"
                className="inline-flex h-12 items-center rounded-full border border-white/25 px-7 text-base font-semibold text-white/90 hover:bg-white/10"
              >
                {t("common.ctaInstitution")}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
