import type { Metadata } from "next";
import DashboardClient from "@/components/institution/DashboardClient";

export const metadata: Metadata = {
  title: "Institution Dashboard (Demo)",
  description:
    "Demo partner dashboard: qualified student interest, match funnel, demand insights and anonymized candidate profiles. All figures are fictional sample data.",
  robots: { index: false, follow: true },
};

export default function DashboardPage() {
  return <DashboardClient />;
}
