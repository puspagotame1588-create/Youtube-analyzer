"use client";

/**
 * Client-side persistence with a repository interface.
 *
 * Demo mode (no Supabase env vars): everything is stored in localStorage on
 * the student's own device — private by default, nothing leaves the browser.
 * When NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are set,
 * institution leads are also written to Supabase (see supabase/schema.sql).
 */
import type {
  ConsentRecord,
  ConsultationRequest,
  InstitutionLead,
  StudentProfile,
} from "@/types";
import { uid } from "@/lib/utils";

const KEYS = {
  profile: "mp.profile",
  saved: "mp.savedPrograms",
  compare: "mp.comparePrograms",
  consents: "mp.consents",
  leads: "mp.institutionLeads",
  consultations: "mp.consultations",
} as const;

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

// --- Supabase (optional) -----------------------------------------------------

export function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

async function getSupabase() {
  if (!supabaseConfigured()) return null;
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );
}

// --- Student profile ----------------------------------------------------------

export function loadProfile(): StudentProfile | null {
  return read<StudentProfile>(KEYS.profile);
}

export function saveProfile(profile: StudentProfile) {
  write(KEYS.profile, profile);
}

export function deleteProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEYS.profile);
  window.localStorage.removeItem(KEYS.saved);
  window.localStorage.removeItem(KEYS.compare);
  window.localStorage.removeItem(KEYS.consents);
  window.localStorage.removeItem(KEYS.consultations);
}

export function exportProfile(): string | null {
  const profile = loadProfile();
  if (!profile) return null;
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      profile,
      savedPrograms: getSavedPrograms(),
      consents: read<ConsentRecord[]>(KEYS.consents) ?? [],
      consultationRequests: read<ConsultationRequest[]>(KEYS.consultations) ?? [],
    },
    null,
    2
  );
}

// --- Saved / compare programs ---------------------------------------------------

export function getSavedPrograms(): string[] {
  return read<string[]>(KEYS.saved) ?? [];
}

export function toggleSavedProgram(programId: string): string[] {
  const saved = getSavedPrograms();
  const next = saved.includes(programId)
    ? saved.filter((id) => id !== programId)
    : [...saved, programId];
  write(KEYS.saved, next);
  return next;
}

export function getComparePrograms(): string[] {
  return read<string[]>(KEYS.compare) ?? [];
}

export function toggleCompareProgram(programId: string): string[] {
  const current = getComparePrograms();
  let next: string[];
  if (current.includes(programId)) {
    next = current.filter((id) => id !== programId);
  } else if (current.length >= 3) {
    next = [...current.slice(1), programId]; // keep max 3, drop oldest
  } else {
    next = [...current, programId];
  }
  write(KEYS.compare, next);
  return next;
}

// --- Consent ---------------------------------------------------------------------

export function recordConsent(
  scope: ConsentRecord["scope"],
  targetInstitutionId?: string,
  targetProgramId?: string
): ConsentRecord {
  const profile = loadProfile();
  const record: ConsentRecord = {
    id: uid("consent"),
    profileId: profile?.id ?? "anonymous",
    scope,
    targetInstitutionId,
    targetProgramId,
    grantedAt: new Date().toISOString(),
  };
  const all = read<ConsentRecord[]>(KEYS.consents) ?? [];
  write(KEYS.consents, [...all, record]);
  return record;
}

export function getConsents(): ConsentRecord[] {
  return read<ConsentRecord[]>(KEYS.consents) ?? [];
}

// --- Institution leads -------------------------------------------------------------

export async function submitInstitutionLead(
  lead: Omit<InstitutionLead, "id" | "createdAt">
): Promise<{ ok: boolean; mode: "supabase" | "local" }> {
  const record: InstitutionLead = {
    ...lead,
    id: uid("lead"),
    createdAt: new Date().toISOString(),
  };
  const supabase = await getSupabase();
  if (supabase) {
    const { error } = await supabase.from("institution_leads").insert({
      institution_name: record.institutionName,
      institution_type: record.institutionType,
      department: record.department,
      contact_name: record.contactName,
      role: record.role,
      work_email: record.workEmail,
      phone: record.phone ?? null,
      recruitment_goals: record.recruitmentGoals,
      target_nationalities: record.targetNationalities,
      target_academic_year: record.targetAcademicYear,
      programs_to_promote: record.programsToPromote,
      current_challenge: record.currentChallenge,
      preferred_pilot_type: record.preferredPilotType,
    });
    if (!error) return { ok: true, mode: "supabase" };
    // fall through to local storage on error
  }
  const all = read<InstitutionLead[]>(KEYS.leads) ?? [];
  write(KEYS.leads, [...all, record]);
  return { ok: true, mode: "local" };
}

// --- Direct consultation requests ---------------------------------------------------

/** Short human-friendly reference, e.g. "MP-7F3K2Q". */
function consultationReference(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MP-${rand}`;
}

export function getConsultationRequests(): ConsultationRequest[] {
  return read<ConsultationRequest[]>(KEYS.consultations) ?? [];
}

export async function submitConsultationRequest(
  input: Omit<ConsultationRequest, "id" | "reference" | "createdAt">
): Promise<{ ok: boolean; mode: "supabase" | "local"; reference: string }> {
  const record: ConsultationRequest = {
    ...input,
    id: uid("consult"),
    reference: consultationReference(),
    createdAt: new Date().toISOString(),
  };

  // Record local consent for this action regardless of storage backend.
  recordConsent("consultation_request");

  const supabase = await getSupabase();
  if (supabase) {
    const { error } = await supabase.from("student_consultations").insert({
      reference: record.reference,
      profile_id: record.profileId ?? null,
      full_name: record.fullName,
      email: record.email,
      contact_method: record.contactMethod,
      contact_handle: record.contactHandle ?? null,
      preferred_language: record.preferredLanguage,
      current_country: record.currentCountry,
      living_in_japan: record.livingInJapan,
      highest_education: record.highestEducation,
      jlpt_level: record.jlptLevel,
      preferred_field: record.preferredField,
      school_type_preference: record.schoolTypePreference,
      tuition_budget_jpy: record.tuitionBudgetJpy,
      desired_start: record.desiredStart ?? null,
      message: record.message,
      shortlisted_program_ids: record.shortlistedProgramIds,
      consent_to_record: record.consentToRecord,
      consent_to_contact: record.consentToContact,
    });
    if (!error) return { ok: true, mode: "supabase", reference: record.reference };
    // fall through to local storage on error
  }

  const all = getConsultationRequests();
  write(KEYS.consultations, [...all, record]);
  return { ok: true, mode: "local", reference: record.reference };
}
