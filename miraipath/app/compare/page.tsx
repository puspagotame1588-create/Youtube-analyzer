import type { Metadata } from "next";
import CompareClient from "@/components/results/CompareClient";

export const metadata: Metadata = {
  title: "Compare Routes",
  description:
    "Side-by-side comparison of up to three education routes in Japan, with a what-changes-if simulator. Demo version with fictional programs.",
};

export default function ComparePage() {
  return <CompareClient />;
}
