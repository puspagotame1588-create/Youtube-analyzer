import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/brand";
import { demoPrograms } from "@/data/programs";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    "",
    "/route-finder",
    "/results",
    "/compare",
    "/passport",
    "/institutions",
    "/institutions/dashboard",
    "/methodology",
    "/privacy",
    "/about",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
  }));

  const programPages = demoPrograms.map((p) => ({
    url: `${siteUrl}/programs/${p.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
  }));

  return [...staticPages, ...programPages];
}
