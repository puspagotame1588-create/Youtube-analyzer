import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { EligibilityStatus, JapanRegion, Locale } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatJpy(amount: number, locale: Locale = "en"): string {
  if (locale === "ja") {
    if (amount >= 10000) {
      const man = amount / 10000;
      return `${man % 1 === 0 ? man : man.toFixed(1)}万円`;
    }
    return `${amount.toLocaleString("ja-JP")}円`;
  }
  return `¥${amount.toLocaleString("en-US")}`;
}

export function formatDate(iso: string, locale: Locale = "en"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale === "ja" ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const REGION_LABELS: Record<JapanRegion, { en: string; ja: string }> = {
  hokkaido_tohoku: { en: "Hokkaido / Tohoku", ja: "北海道・東北" },
  kanto: { en: "Kanto (Tokyo area)", ja: "関東（東京圏）" },
  chubu: { en: "Chubu (Nagoya area)", ja: "中部（名古屋圏）" },
  kansai: { en: "Kansai (Osaka / Kyoto)", ja: "関西（大阪・京都）" },
  chugoku_shikoku: { en: "Chugoku / Shikoku", ja: "中国・四国" },
  kyushu_okinawa: { en: "Kyushu / Okinawa", ja: "九州・沖縄" },
};

export const ELIGIBILITY_META: Record<
  EligibilityStatus,
  { en: string; ja: string; tone: "positive" | "caution" | "warning" | "neutral" }
> = {
  likely_eligible: {
    en: "Likely eligible based on available information",
    ja: "現在の情報では出願可能性が高い",
    tone: "positive",
  },
  possibly_eligible: {
    en: "Possibly eligible; confirmation required",
    ja: "出願できる可能性あり（要確認）",
    tone: "caution",
  },
  missing_information: {
    en: "Missing important information",
    ja: "重要な情報が不足しています",
    tone: "neutral",
  },
  requirement_not_met: {
    en: "Current requirement not met",
    ja: "現時点で要件を満たしていません",
    tone: "warning",
  },
  deadline_may_have_passed: {
    en: "Deadline may have passed",
    ja: "出願期間が終了している可能性",
    tone: "warning",
  },
};

export const VERIFICATION_META: Record<
  string,
  { en: string; ja: string; tone: "positive" | "caution" | "warning" | "neutral" }
> = {
  officially_verified: { en: "Officially verified", ja: "公式情報で確認済み", tone: "positive" },
  institution_submitted: { en: "Institution submitted", ja: "学校提供情報", tone: "neutral" },
  needs_confirmation: { en: "Needs confirmation", ja: "要確認", tone: "caution" },
  estimated: { en: "Estimated", ja: "推定値", tone: "caution" },
  outdated: { en: "Outdated", ja: "情報が古い可能性", tone: "warning" },
  unavailable: { en: "Unavailable", ja: "情報なし", tone: "neutral" },
};

export function uid(prefix = "id"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
