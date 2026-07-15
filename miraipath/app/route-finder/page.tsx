import type { Metadata } from "next";
import RouteFinderClient from "@/components/forms/RouteFinderClient";

export const metadata: Metadata = {
  title: "Build My Future Route",
  description:
    "Answer a few questions about your background, Japanese level, budget and goals to see realistic education routes in Japan. Demo version with fictional programs.",
};

export default function RouteFinderPage() {
  return <RouteFinderClient />;
}
