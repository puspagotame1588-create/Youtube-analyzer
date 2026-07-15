import type { Metadata } from "next";
import MethodologyClient from "@/components/shared/MethodologyClient";

export const metadata: Metadata = {
  title: "Trust & Methodology",
  description:
    "How MiraiPath matching works, how sources are verified, how sponsorship is separated from scoring, and what the platform does not guarantee.",
};

export default function MethodologyPage() {
  return <MethodologyClient />;
}
