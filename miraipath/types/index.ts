/**
 * MiraiPath Japan — domain types.
 *
 * The core matching entity is:
 *   institution + program + admission route + academic year
 * University-wide facts must never be assumed to apply to every program,
 * which is why requirements, tuition and sources are scoped per program
 * and per admission route.
 */

// ---------------------------------------------------------------------------
// Shared enums / unions
// ---------------------------------------------------------------------------

export type Locale = "en" | "ja";

export type InstitutionType =
  | "university"
  | "junior_college"
  | "vocational_school"
  | "professional_training_college";

export type FieldOfStudy =
  | "business"
  | "it"
  | "engineering"
  | "hospitality"
  | "tourism"
  | "care"
  | "design"
  | "other";

export type JapanRegion =
  | "hokkaido_tohoku"
  | "kanto"
  | "chubu"
  | "kansai"
  | "chugoku_shikoku"
  | "kyushu_okinawa";

/** JLPT-style ordinal scale. 0 = none, 5 = N1. */
export type JlptLevel = "none" | "N5" | "N4" | "N3" | "N2" | "N1";

export type EducationLevel =
  | "junior_high"
  | "high_school"
  | "language_school"
  | "vocational_diploma"
  | "associate"
  | "bachelor"
  | "master";

export type VerificationStatus =
  | "officially_verified"
  | "institution_submitted"
  | "needs_confirmation"
  | "estimated"
  | "outdated"
  | "unavailable";

export type EligibilityStatus =
  | "likely_eligible"
  | "possibly_eligible"
  | "missing_information"
  | "requirement_not_met"
  | "deadline_may_have_passed";

// ---------------------------------------------------------------------------
// Evidence and sources
// ---------------------------------------------------------------------------

export interface OfficialSource {
  id: string;
  url: string;
  title: string;
  owner: string;
  academicYear: string;
  publicationDate?: string;
  lastCheckedDate: string;
  pageOrSection?: string;
  geographicScope?: string;
  /** Which program(s)/route(s) this source actually covers. */
  programScope: string;
  verificationStatus: VerificationStatus;
  notes?: string;
}

export interface EvidenceFact {
  id: string;
  sourceId: string;
  extractedFact: string;
  verificationStatus: VerificationStatus;
  confidence: "high" | "medium" | "low";
  notes?: string;
}

// ---------------------------------------------------------------------------
// Institutions and programs
// ---------------------------------------------------------------------------

export interface Campus {
  id: string;
  name: string;
  nameJa?: string;
  city: string;
  region: JapanRegion;
}

export interface InstitutionBase {
  id: string;
  type: InstitutionType;
  name: string;
  nameJa: string;
  /** All seeded institutions are fictional; this flag must stay true in demo data. */
  isFictionalDemo: boolean;
  campuses: Campus[];
  description: string;
  descriptionJa?: string;
  website?: string;
}

export interface University extends InstitutionBase {
  type: "university" | "junior_college";
}

export interface VocationalSchool extends InstitutionBase {
  type: "vocational_school" | "professional_training_college";
}

export type Institution = University | VocationalSchool;

export interface AdmissionRequirement {
  id: string;
  kind:
    | "japanese_level"
    | "english_level"
    | "education"
    | "eju"
    | "interview"
    | "written_exam"
    | "portfolio"
    | "attendance"
    | "document";
  description: string;
  descriptionJa?: string;
  /** Minimum JLPT level, when kind === "japanese_level". */
  minJlpt?: Exclude<JlptLevel, "none">;
  /** Minimum completed education, when kind === "education". */
  minEducation?: EducationLevel;
  /** Whether EJU is required, when kind === "eju". */
  ejuRequired?: boolean;
  required: boolean;
}

export interface AdmissionRoute {
  id: string;
  name: string;
  nameJa?: string;
  academicYear: string;
  applicationPeriodStart: string; // ISO date
  applicationPeriodEnd: string; // ISO date
  intakeDate: string; // ISO date
  examType: string;
  requirements: AdmissionRequirement[];
  sourceIds: string[];
}

export interface TuitionRecord {
  id: string;
  academicYear: string;
  currency: "JPY";
  /** First-year tuition. */
  tuitionFirstYear: number;
  /** Admission fee + mandatory facility/insurance fees in year one. */
  mandatoryFeesFirstYear: number;
  /** Estimated total first year (tuition + mandatory fees). Estimated status. */
  estimatedFirstYearTotal: number;
  verificationStatus: VerificationStatus;
  sourceIds: string[];
  notes?: string;
}

export interface Scholarship {
  id: string;
  name: string;
  nameJa?: string;
  provider: string;
  /** e.g. "30% tuition reduction", "¥48,000/month" */
  amountDescription: string;
  eligibilityNote: string;
  /** Scholarships are never guaranteed; keep this explicit. */
  competitive: true;
  verificationStatus: VerificationStatus;
  sourceIds: string[];
}

export interface Program {
  id: string;
  institutionId: string;
  name: string;
  nameJa: string;
  field: FieldOfStudy;
  campusId: string;
  languageOfInstruction: "japanese" | "english" | "bilingual";
  durationYears: number;
  degreeOrCredential: string;
  careerDirections: string[];
  careerDirectionsJa?: string[];
  admissionRoutes: AdmissionRoute[];
  tuition: TuitionRecord;
  scholarships: Scholarship[];
  sourceIds: string[];
  /** Sponsored placement flag. Sponsorship NEVER affects match scoring. */
  sponsored: boolean;
  summary: string;
  summaryJa?: string;
  uncertaintyNotes?: string;
}

// ---------------------------------------------------------------------------
// Student profile
// ---------------------------------------------------------------------------

export type SchoolTypePreference = "university" | "vocational_school" | "either";

export type StudentPriority =
  | "low_cost"
  | "speed"
  | "prestige"
  | "career_flexibility"
  | "location"
  | "scholarship";

export interface StudentProfile {
  id: string;
  createdAt: string;
  updatedAt: string;
  displayName?: string;

  // Situation
  currentCountry: string;
  livingInJapan: boolean;
  currentSchoolType?:
    | "language_school"
    | "high_school"
    | "university"
    | "vocational_school"
    | "other"
    | "not_in_school";
  expectedGraduation?: string; // e.g. "2027-03"
  nationality?: string;
  preferredLanguage: Locale;

  // Academic background
  highestEducation: EducationLevel;
  previousMajor?: string;
  jlptLevel: JlptLevel;
  ejuTaken?: boolean | null;
  gpa?: string;
  attendancePercent?: number;

  // Goals
  preferredField: FieldOfStudy;
  preferredCareer?: string;
  schoolTypePreference: SchoolTypePreference;
  preferredRegion?: JapanRegion | "any";
  /** Annual budget for tuition + mandatory fees, in JPY. */
  tuitionBudgetJpy: number;
  familySupport?: "full" | "partial" | "none" | "unknown";
  desiredStart?: string; // e.g. "2027-04"
  /** Explicitly an aspiration, never a prediction. */
  desiredSalaryAspirationJpy?: number;
  priorities: StudentPriority[];

  // Consent
  allowInstitutionContact: boolean;
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

export interface ScoreComponent {
  key:
    | "academic"
    | "japanese"
    | "budget"
    | "field"
    | "school_type"
    | "location"
    | "timeline"
    | "missing_info"
    | "deadline";
  label: string;
  points: number;
  maxPoints: number;
  reason: string;
}

export interface MatchResult {
  programId: string;
  /** "Route fit score" 0–100. NOT an admission probability. */
  score: number;
  eligibility: EligibilityStatus;
  components: ScoreComponent[];
  matchReasons: string[];
  mismatchReasons: string[];
  missingRequirements: string[];
  warnings: string[];
  nextDeadline?: string;
  nextAction: string;
}

// ---------------------------------------------------------------------------
// Institution side
// ---------------------------------------------------------------------------

export interface InstitutionLead {
  id: string;
  createdAt: string;
  institutionName: string;
  institutionType: InstitutionType | "language_school" | "other";
  department: string;
  contactName: string;
  role: string;
  workEmail: string;
  phone?: string;
  recruitmentGoals: string;
  targetNationalities: string;
  targetAcademicYear: string;
  programsToPromote: string;
  currentChallenge: string;
  preferredPilotType: "listing" | "events" | "introductions" | "insights";
}

export interface MarketplaceEvent {
  id: string;
  institutionId: string;
  title: string;
  titleJa?: string;
  date: string;
  format: "on_campus" | "online";
  description: string;
}

/** Alias kept for the required type list. */
export type Event = MarketplaceEvent;

// ---------------------------------------------------------------------------
// Consent
// ---------------------------------------------------------------------------

export interface ConsentRecord {
  id: string;
  profileId: string;
  scope:
    | "institution_contact"
    | "introduction_request"
    | "event_registration"
    | "information_request"
    | "consultation_request";
  targetInstitutionId?: string;
  targetProgramId?: string;
  grantedAt: string;
  revokedAt?: string;
}

// ---------------------------------------------------------------------------
// Direct consultation ("Consult us directly")
// ---------------------------------------------------------------------------

export type ContactMethod = "email" | "line" | "whatsapp" | "phone";

/**
 * A student's request to find universities by consulting an advisor directly.
 * The academic snapshot is captured at submit time so the advisor sees the
 * exact data the recommendation should be based on. Recorded to Supabase when
 * configured, otherwise to the student's own browser (demo mode).
 */
export interface ConsultationRequest {
  id: string;
  /** Human-friendly reference shown to the student, e.g. "MP-7F3K2Q". */
  reference: string;
  createdAt: string;
  /** Links back to a locally stored profile when one exists. */
  profileId?: string;

  // Contact
  fullName: string;
  email: string;
  contactMethod: ContactMethod;
  /** LINE ID / WhatsApp or phone number, when the method needs one. */
  contactHandle?: string;
  preferredLanguage: Locale;

  // Academic snapshot (captured at submit time)
  currentCountry: string;
  livingInJapan: boolean;
  highestEducation: EducationLevel;
  jlptLevel: JlptLevel;
  preferredField: FieldOfStudy;
  schoolTypePreference: SchoolTypePreference;
  tuitionBudgetJpy: number;
  desiredStart?: string;

  // What the student needs
  message: string;
  /** Programs the student shortlisted before requesting the consultation. */
  shortlistedProgramIds: string[];

  // Consent
  consentToRecord: boolean;
  consentToContact: boolean;
}
