import type { StudentProfile } from "@/types";
import { uid } from "@/lib/utils";

/**
 * A clearly fictional sample student so visitors can explore Results,
 * Compare and the Future Passport without entering their own data first.
 * Mirrors the primary persona: a language-school student in Tokyo at N3,
 * aiming for an IT route under ¥1.2M/year.
 */
export function createDemoProfile(locale: "en" | "ja" = "en"): StudentProfile {
  const now = new Date().toISOString();
  return {
    id: uid("profile-demo"),
    createdAt: now,
    updatedAt: now,
    displayName: locale === "ja" ? "サンプル学生" : "Sample Student",
    currentCountry: "Japan",
    livingInJapan: true,
    currentSchoolType: "language_school",
    preferredLanguage: locale,
    highestEducation: "high_school",
    jlptLevel: "N3",
    ejuTaken: null,
    preferredField: "it",
    schoolTypePreference: "either",
    preferredRegion: "kanto",
    tuitionBudgetJpy: 1200000,
    desiredStart: "2027-04",
    priorities: ["low_cost"],
    allowInstitutionContact: false,
  };
}
