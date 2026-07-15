import type { Metadata } from "next";
import ResultsClient from "@/components/results/ResultsClient";

export const metadata: Metadata = {
  title: "Your Route Matches",
  description:
    "Program-level route matches with transparent score breakdowns, requirements, costs and sources. Demo version with fictional programs.",
};

export default function ResultsPage() {
  return <ResultsClient />;
}
