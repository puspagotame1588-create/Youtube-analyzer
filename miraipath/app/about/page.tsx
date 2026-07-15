import type { Metadata } from "next";
import AboutClient from "@/components/shared/AboutClient";

export const metadata: Metadata = {
  title: "About the Pilot",
  description:
    "MiraiPath Japan pilot: helping international students make better education decisions while helping Japanese institutions reach suitable students transparently.",
};

export default function AboutPage() {
  return <AboutClient />;
}
