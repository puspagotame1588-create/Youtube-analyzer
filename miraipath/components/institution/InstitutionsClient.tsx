"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  UserCheck,
  ClipboardList,
  CalendarCheck,
  Target,
  LineChart,
  MessageSquareText,
  Filter,
  BadgeCheck,
  EyeOff,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Badge, Card } from "@/components/shared/ui";
import LeadForm from "@/components/institution/LeadForm";

export default function InstitutionsClient() {
  const { t } = useI18n();
  const reduced = useReducedMotion();

  const features = [
    { icon: UserCheck, key: "inst.feat1" },
    { icon: ClipboardList, key: "inst.feat2" },
    { icon: CalendarCheck, key: "inst.feat3" },
    { icon: Target, key: "inst.feat4" },
    { icon: LineChart, key: "inst.feat5" },
    { icon: MessageSquareText, key: "inst.feat6" },
    { icon: Filter, key: "inst.feat7" },
    { icon: BadgeCheck, key: "inst.feat8" },
    { icon: EyeOff, key: "inst.feat9" },
  ];

  return (
    <div>
      <section className="starfield bg-deep py-16 text-white lg:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Badge tone="info" className="border-teal-300/30 bg-teal-400/10 text-teal-200">
            {t("inst.pilotBadge")}
          </Badge>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            {t("inst.heroTitle")}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/70">{t("inst.heroSubtitle")}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#partner-form"
              className="inline-flex h-12 items-center rounded-full bg-teal-500 px-7 text-base font-semibold text-white shadow-[0_6px_28px_rgba(45,212,191,0.35)] hover:bg-teal-600"
            >
              {t("inst.ctaForm")}
            </a>
            <Link
              href="/institutions/dashboard"
              className="inline-flex h-12 items-center rounded-full border border-white/25 px-7 text-base font-semibold text-white/90 hover:bg-white/10"
            >
              {t("inst.ctaDashboard")}
            </Link>
          </div>
          <p className="mt-5 max-w-xl text-sm text-white/50">{t("inst.heroTrust")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16" aria-labelledby="inst-features">
        <h2 id="inst-features" className="text-center text-3xl font-bold tracking-tight text-ink">
          {t("inst.featuresTitle")}
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, key }, i) => (
            <motion.div
              key={key}
              initial={reduced ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
            >
              <Card className="h-full p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-glow/15 text-teal-700">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-3 font-semibold text-ink">{t(`${key}Title`)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{t(`${key}Body`)}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-deep-2 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-bold">{t("inst.principlesTitle")}</h2>
          <div className="mt-8 grid gap-5 text-left sm:grid-cols-3">
            {["inst.principle1", "inst.principle2", "inst.principle3"].map((k) => (
              <div key={k} className="glass-dark rounded-2xl p-5">
                <h3 className="font-semibold text-teal-200">{t(`${k}Title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{t(`${k}Body`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="partner-form" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-16">
        <h2 className="text-3xl font-bold tracking-tight text-ink">{t("inst.formTitle")}</h2>
        <p className="mt-2 text-ink-soft">{t("inst.formSubtitle")}</p>
        <div className="mt-8">
          <LeadForm />
        </div>
      </section>
    </div>
  );
}
