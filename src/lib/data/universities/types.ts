import type { SourceRecord } from '@/lib/data/types';

/**
 * Verified university registry — identity phase.
 *
 * These records come from the official MEXT 2026-05-01 *provisional* school-code
 * release (see data/japan-universities-registry-2026-provisional/MANIFEST.md).
 * They carry real institutional identity only. Admissions requirements (JLPT/EJU),
 * tuition, programs, scholarships, and career outcomes are NOT enriched here — the
 * upstream source ships those as empty tables — so every such field is represented
 * as an explicit "not verified" gap and is never invented.
 */

export type EstablishmentCategory = 'national' | 'public' | 'private';

/**
 * Verification lifecycle for a registry record. `verified_registry_identity` means
 * the canonical MEXT identity passed validation — NOT that admissions, cost, or
 * program data has been reviewed. `provisional` reflects that MEXT has not yet
 * published the 2026 final edition.
 */
export type RegistryVerification = 'verified_registry_identity';

/**
 * The families of information the decision report needs but that the registry
 * phase does not yet supply. Each is surfaced to the UI as "Not verified".
 */
export type EnrichmentField =
  | 'admissions' // JLPT/EJU requirements, routes, deadlines
  | 'costs' // tuition, fees
  | 'programs' // faculties, programs, academic year
  | 'scholarships'
  | 'international' // international-student support
  | 'careers'; // employment outcomes

export const ENRICHMENT_FIELDS: readonly EnrichmentField[] = [
  'admissions',
  'costs',
  'programs',
  'scholarships',
  'international',
  'careers',
] as const;

/** Why an enrichment family is absent — mirrors the source's missing-value vocabulary. */
export type EnrichmentGapReason = 'not_started';

export interface EnrichmentStatus {
  /** Always false in the registry phase — no enrichment family is verified yet. */
  verified: false;
  reason: EnrichmentGapReason;
  /** Bilingual, UI-ready note. */
  noteEn: string;
  noteJa: string;
}

export interface UniversityRecord {
  /** Stable internal id: `univ_` + immutable MEXT school code. */
  id: string;
  mextSchoolCode: string;
  /** Official Japanese name (MEXT-direct). Always present. */
  nameJa: string;
  /**
   * Official English name. `null` when absent from the canonical MEXT file —
   * never invented or machine-translated.
   */
  nameEn: string | null;
  /** Comparison key (NFKC + whitespace-stripped). Not a display name. */
  normalizedNameJa: string;
  sector: EstablishmentCategory;
  prefectureCode: string;
  prefectureJa: string;
  municipalityJa: string;
  addressJa: string;
  postalCode: string;
  /** `null` when absent from the canonical MEXT file — never inferred. */
  officialWebsiteUrl: string | null;
  verification: RegistryVerification;
  /** True while MEXT's 2026 final edition is unpublished. */
  provisional: boolean;
  /**
   * Enrichment families the decision report keys on, each explicitly not-verified.
   * Keeps eligibility/cost/program data honest: absent, not fabricated.
   */
  enrichment: Record<EnrichmentField, EnrichmentStatus>;
  /** Id of the SourceRecord (the MEXT registry) backing this record's identity. */
  sourceId: string;
}

export interface RegistryMeta {
  /** e.g. "2026-provisional" */
  edition: string;
  provisional: boolean;
  /** Release the identity data reflects (ISO date). */
  releaseDate: string;
  /** When CareerVerse retrieved it (ISO date). */
  retrievedAt: string;
  sourceId: string;
  activeUniversities: number;
}

export interface UniversityRegistry {
  meta: RegistryMeta;
  source: SourceRecord;
  records: UniversityRecord[];
}
