"use client";

/**
 * Institution dashboard demo, fed entirely by seeded fictional data
 * (data/dashboard.ts). Candidates are anonymized; identifiable details are
 * never shown before consent — the consent column makes this explicit.
 */
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import { motion, useReducedMotion } from "framer-motion";
import {
  dashboardKpis,
  languageLevelDistribution,
  budgetDistribution,
  fieldInterestDistribution,
  sourceAttribution,
  conversionFunnel,
  topStudentConcerns,
  topPrograms,
  demoCandidates,
} from "@/data/dashboard";
import { useI18n } from "@/lib/i18n";
import { Badge, Card } from "@/components/shared/ui";

const CHART_COLORS = ["#3b82f6", "#2dd4bf", "#8b5cf6", "#f59e0b", "#64748b", "#22d3ee", "#f472b6"];

function Kpi({ label, value, delay }: { label: string; value: number; delay: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card className="p-4">
        <p className="text-xs font-medium text-ink-soft">{label}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-ink">{value}</p>
      </Card>
    </motion.div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold text-ink">{title}</h3>
      {children}
    </Card>
  );
}

export default function DashboardClient() {
  const { t } = useI18n();

  const kpis = [
    { label: t("dash.kpiQualified"), value: dashboardKpis.qualifiedInterest },
    { label: t("dash.kpiNewMatches"), value: dashboardKpis.newMatchesThisWeek },
    { label: t("dash.kpiComplete"), value: dashboardKpis.completeProfiles },
    { label: t("dash.kpiIncomplete"), value: dashboardKpis.incompleteProfiles },
    { label: t("dash.kpiEvents"), value: dashboardKpis.eventRegistrations },
    { label: t("dash.kpiInfoRequests"), value: dashboardKpis.informationRequests },
    { label: t("dash.kpiIntent"), value: dashboardKpis.applicationIntent },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="caution">{t("dash.demoBadge")}</Badge>
            <Badge tone="info">Harborlight Global University (Fictional Demo)</Badge>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">{t("dash.title")}</h1>
          <p className="mt-1 text-sm text-ink-soft">{t("dash.subtitle")}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
        {kpis.map((k, i) => (
          <Kpi key={k.label} label={k.label} value={k.value} delay={i * 0.05} />
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title={t("dash.funnel")}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionFunnel} layout="vertical" margin={{ left: 30, right: 40 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="stage" width={130} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: "rgba(59,130,246,0.06)" }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]}>
                  <LabelList dataKey="count" position="right" style={{ fontSize: 12, fill: "#46506a" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title={t("dash.langDist")}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={languageLevelDistribution} margin={{ top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6eaf2" />
                <XAxis dataKey="level" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip cursor={{ fill: "rgba(45,212,191,0.08)" }} />
                <Bar dataKey="students" fill="#2dd4bf" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <ChartCard title={t("dash.budgetDist")}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetDistribution} margin={{ top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6eaf2" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="students" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title={t("dash.fieldDist")}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fieldInterestDistribution}
                  dataKey="value"
                  nameKey="field"
                  innerRadius={40}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {fieldInterestDistribution.map((entry, i) => (
                    <Cell key={entry.field} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
            {fieldInterestDistribution.map((f, i) => (
              <li key={f.field} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                {f.field} ({f.value})
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard title={t("dash.sources")}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceAttribution} layout="vertical" margin={{ left: 60, right: 30 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="source" width={110} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#22d3ee" radius={[0, 6, 6, 0]}>
                  <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: "#46506a" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Concerns + top programs */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title={t("dash.concerns")}>
          <ul className="space-y-2.5">
            {topStudentConcerns.map((c) => (
              <li key={c.concern} className="flex items-start justify-between gap-3 text-sm">
                <span className="text-ink">{c.concern}</span>
                <Badge tone="info">{c.count}</Badge>
              </li>
            ))}
          </ul>
        </ChartCard>
        <ChartCard title={t("dash.topPrograms")}>
          <ul className="space-y-3">
            {topPrograms.map((p, i) => (
              <li key={p.program} className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">{p.program}</span>
                  <span className="tabular-nums text-ink-soft">{p.interest}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/8">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(p.interest / topPrograms[0].interest) * 100}%`,
                      background: CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>

      {/* Candidate table */}
      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/8 px-5 py-4">
          <h3 className="text-sm font-semibold text-ink">{t("dash.candidatesTitle")}</h3>
          <p className="text-xs text-ink-soft">{t("dash.candidatesNote")}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="bg-surface-soft text-left text-xs uppercase tracking-wider text-ink-soft">
                <th className="px-4 py-3 font-semibold">{t("dash.colId")}</th>
                <th className="px-4 py-3 font-semibold">{t("dash.colLocation")}</th>
                <th className="px-4 py-3 font-semibold">{t("dash.colJapanese")}</th>
                <th className="px-4 py-3 font-semibold">{t("dash.colEducation")}</th>
                <th className="px-4 py-3 font-semibold">{t("dash.colField")}</th>
                <th className="px-4 py-3 font-semibold">{t("dash.colStart")}</th>
                <th className="px-4 py-3 font-semibold">{t("dash.colBudget")}</th>
                <th className="px-4 py-3 font-semibold">{t("dash.colComplete")}</th>
                <th className="px-4 py-3 font-semibold">{t("dash.colReason")}</th>
                <th className="px-4 py-3 font-semibold">{t("dash.colConsent")}</th>
              </tr>
            </thead>
            <tbody>
              {demoCandidates.map((c) => (
                <tr key={c.id} className="border-t border-ink/5">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-ink">{c.id}</td>
                  <td className="px-4 py-3 text-ink">{c.location}</td>
                  <td className="px-4 py-3 text-ink">{c.japaneseLevel}</td>
                  <td className="px-4 py-3 text-ink">{c.education}</td>
                  <td className="px-4 py-3 text-ink">{c.desiredField}</td>
                  <td className="px-4 py-3 tabular-nums text-ink">{c.preferredStart}</td>
                  <td className="px-4 py-3 text-ink">{c.budgetRange}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-ink/10">
                        <div className="h-full rounded-full bg-electric" style={{ width: `${c.profileCompleteness}%` }} />
                      </div>
                      <span className="text-xs tabular-nums text-ink-soft">{c.profileCompleteness}%</span>
                    </div>
                  </td>
                  <td className="max-w-56 px-4 py-3 text-xs leading-relaxed text-ink-soft">{c.matchReason}</td>
                  <td className="px-4 py-3">
                    {c.consent === "granted" ? (
                      <Badge tone="positive">{t("dash.consentGranted")}</Badge>
                    ) : (
                      <Badge tone="neutral">{t("dash.consentNone")}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-ink/8 px-5 py-3 text-xs leading-relaxed text-ink-soft">
          {t("dash.privacyFootnote")}
        </p>
      </Card>
    </div>
  );
}
