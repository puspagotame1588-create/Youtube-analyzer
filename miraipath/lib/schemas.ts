/**
 * Zod schemas for the student route finder and the institution lead form.
 * These are pure (no browser APIs) so they can be unit-tested in Node.
 */
import { z } from "zod";

export const studentProfileSchema = z.object({
  displayName: z.string().max(40).optional().or(z.literal("")),
  currentCountry: z.string().min(1, "required"),
  livingInJapan: z.boolean(),
  currentSchoolType: z.enum([
    "language_school",
    "high_school",
    "university",
    "vocational_school",
    "other",
    "not_in_school",
  ]),
  expectedGraduation: z.string().optional().or(z.literal("")),
  nationality: z.string().max(60).optional().or(z.literal("")),
  preferredLanguage: z.enum(["en", "ja"]),
  highestEducation: z.enum([
    "junior_high",
    "high_school",
    "language_school",
    "vocational_diploma",
    "associate",
    "bachelor",
    "master",
  ]),
  previousMajor: z.string().max(80).optional().or(z.literal("")),
  jlptLevel: z.enum(["none", "N5", "N4", "N3", "N2", "N1"]),
  ejuTaken: z.enum(["yes", "no", "unknown"]),
  gpa: z.string().max(20).optional().or(z.literal("")),
  attendancePercent: z
    .number({ invalid_type_error: "number" })
    .min(0)
    .max(100)
    .optional()
    .or(z.nan().transform(() => undefined)),
  preferredField: z.enum([
    "business",
    "it",
    "engineering",
    "hospitality",
    "tourism",
    "care",
    "design",
    "other",
  ]),
  preferredCareer: z.string().max(80).optional().or(z.literal("")),
  schoolTypePreference: z.enum(["university", "vocational_school", "either"]),
  preferredRegion: z.enum([
    "any",
    "hokkaido_tohoku",
    "kanto",
    "chubu",
    "kansai",
    "chugoku_shikoku",
    "kyushu_okinawa",
  ]),
  tuitionBudgetJpy: z
    .number({ invalid_type_error: "required" })
    .min(100000, "min")
    .max(10000000, "max"),
  familySupport: z.enum(["full", "partial", "none", "unknown"]),
  desiredStart: z.string().min(1, "required"),
  desiredSalaryAspirationJpy: z.number().min(0).max(100000000).optional(),
  priorities: z
    .array(
      z.enum(["low_cost", "speed", "prestige", "career_flexibility", "location", "scholarship"])
    )
    .max(3, "max3"),
  allowInstitutionContact: z.boolean(),
});

export type StudentProfileFormValues = z.infer<typeof studentProfileSchema>;

export const institutionLeadSchema = z.object({
  institutionName: z.string().min(2, "required"),
  institutionType: z.enum([
    "university",
    "junior_college",
    "vocational_school",
    "professional_training_college",
    "language_school",
    "other",
  ]),
  department: z.string().min(2, "required"),
  contactName: z.string().min(2, "required"),
  role: z.string().min(2, "required"),
  workEmail: z.string().email("email"),
  phone: z.string().max(30).optional().or(z.literal("")),
  recruitmentGoals: z.string().min(10, "min10"),
  targetNationalities: z.string().min(2, "required"),
  targetAcademicYear: z.string().min(4, "required"),
  programsToPromote: z.string().min(2, "required"),
  currentChallenge: z.string().min(10, "min10"),
  preferredPilotType: z.enum(["listing", "events", "introductions", "insights"]),
});

export type InstitutionLeadFormValues = z.infer<typeof institutionLeadSchema>;
