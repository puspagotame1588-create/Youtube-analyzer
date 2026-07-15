import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/shared/providers";
import { siteUrl } from "@/lib/brand";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MiraiPath Japan | Compare Universities and Vocational Schools",
    template: "%s | MiraiPath Japan",
  },
  description:
    "Compare universities, vocational schools, tuition, Japanese requirements, deadlines and career trade-offs in Japan using transparent, source-linked information. Pilot / demo version.",
  keywords: [
    "study in Japan",
    "international students",
    "Japanese universities",
    "vocational schools Japan",
    "留学",
    "専門学校",
    "進路比較",
  ],
  alternates: {
    canonical: "/",
    languages: { en: "/", ja: "/" },
  },
  openGraph: {
    type: "website",
    siteName: "MiraiPath Japan",
    title: "MiraiPath Japan | Compare Universities and Vocational Schools",
    description:
      "Find the route that fits your future. Compare programs, requirements, costs and career directions — with sources.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "MiraiPath Japan｜大学・専門学校の進路比較",
    description:
      "自分に合う進路を、根拠とともに。学費・日本語要件・出願期間を比較できる進路プラットフォーム（デモ版）。",
  },
  icons: { icon: "/favicon.svg" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#050a1c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
