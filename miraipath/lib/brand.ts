/**
 * Brand tokens — swap these (and the CSS variables in app/globals.css)
 * to rebrand the product later. "CareerVerse" remains internal only.
 */
export const brand = {
  name: "MiraiPath Japan",
  shortName: "MiraiPath",
  internalCodename: "careerverse",
  taglineEn: "Find the route that fits your future.",
  taglineJa: "自分に合う進路を、根拠とともに。",
  domainPlaceholder: "miraipath.example",
} as const;

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
