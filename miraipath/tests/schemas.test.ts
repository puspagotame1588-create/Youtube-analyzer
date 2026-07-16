import { describe, it, expect } from "vitest";
import {
  studentProfileSchema,
  institutionLeadSchema,
  consultationRequestSchema,
} from "@/lib/schemas";

const validStudent = {
  displayName: "Anish",
  currentCountry: "Japan",
  livingInJapan: true,
  currentSchoolType: "language_school",
  expectedGraduation: "2027-03",
  nationality: "Nepali",
  preferredLanguage: "en",
  highestEducation: "high_school",
  previousMajor: "",
  jlptLevel: "N3",
  ejuTaken: "unknown",
  gpa: "",
  preferredField: "it",
  preferredCareer: "software engineer",
  schoolTypePreference: "either",
  preferredRegion: "kanto",
  tuitionBudgetJpy: 1200000,
  familySupport: "partial",
  desiredStart: "2027-04",
  priorities: ["low_cost", "speed"],
  allowInstitutionContact: false,
};

describe("studentProfileSchema", () => {
  it("accepts a valid profile", () => {
    const result = studentProfileSchema.safeParse(validStudent);
    expect(result.success).toBe(true);
  });

  it("rejects a missing country", () => {
    const result = studentProfileSchema.safeParse({ ...validStudent, currentCountry: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an out-of-range budget", () => {
    expect(studentProfileSchema.safeParse({ ...validStudent, tuitionBudgetJpy: 50 }).success).toBe(false);
    expect(studentProfileSchema.safeParse({ ...validStudent, tuitionBudgetJpy: 99999999 }).success).toBe(false);
  });

  it("rejects more than three priorities", () => {
    const result = studentProfileSchema.safeParse({
      ...validStudent,
      priorities: ["low_cost", "speed", "prestige", "location"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid JLPT level", () => {
    const result = studentProfileSchema.safeParse({ ...validStudent, jlptLevel: "N6" });
    expect(result.success).toBe(false);
  });
});

const validLead = {
  institutionName: "Harborlight Global University",
  institutionType: "university",
  department: "International Admissions Office",
  contactName: "Tanaka Yuki",
  role: "Admissions manager",
  workEmail: "admissions@example.ac.jp",
  phone: "",
  recruitmentGoals: "We aim to enroll 30 qualified international students for AY2027.",
  targetNationalities: "Nepal, Vietnam",
  targetAcademicYear: "2027",
  programsToPromote: "Digital Business Program",
  currentChallenge: "Many inquiries but few applicants meet our N2 requirement.",
  preferredPilotType: "introductions",
};

describe("institutionLeadSchema", () => {
  it("accepts a valid lead", () => {
    expect(institutionLeadSchema.safeParse(validLead).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(institutionLeadSchema.safeParse({ ...validLead, workEmail: "not-an-email" }).success).toBe(false);
  });

  it("rejects a too-short challenge description", () => {
    expect(institutionLeadSchema.safeParse({ ...validLead, currentChallenge: "short" }).success).toBe(false);
  });

  it("rejects an unknown pilot type", () => {
    expect(institutionLeadSchema.safeParse({ ...validLead, preferredPilotType: "billboard" }).success).toBe(false);
  });
});

const validConsult = {
  fullName: "Anish Gurung",
  email: "anish@example.com",
  contactMethod: "email" as const,
  contactHandle: "",
  preferredLanguage: "en" as const,
  currentCountry: "Japan",
  livingInJapan: true,
  highestEducation: "high_school" as const,
  jlptLevel: "N3" as const,
  preferredField: "it" as const,
  schoolTypePreference: "either" as const,
  tuitionBudgetJpy: 1200000,
  desiredStart: "2027-04",
  message: "I want an IT route under 1.2M and am unsure about university vs vocational.",
  consentToRecord: true as const,
  consentToContact: true,
};

describe("consultationRequestSchema", () => {
  it("accepts a valid email-contact request", () => {
    expect(consultationRequestSchema.safeParse(validConsult).success).toBe(true);
  });

  it("requires consent to record before submitting", () => {
    const result = consultationRequestSchema.safeParse({ ...validConsult, consentToRecord: false });
    expect(result.success).toBe(false);
  });

  it("requires a handle when the contact method is not email", () => {
    const noHandle = consultationRequestSchema.safeParse({
      ...validConsult,
      contactMethod: "line",
      contactHandle: "",
    });
    expect(noHandle.success).toBe(false);
    const withHandle = consultationRequestSchema.safeParse({
      ...validConsult,
      contactMethod: "line",
      contactHandle: "anish_line",
    });
    expect(withHandle.success).toBe(true);
  });

  it("rejects a too-short message", () => {
    expect(consultationRequestSchema.safeParse({ ...validConsult, message: "help" }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(consultationRequestSchema.safeParse({ ...validConsult, email: "nope" }).success).toBe(false);
  });
});
