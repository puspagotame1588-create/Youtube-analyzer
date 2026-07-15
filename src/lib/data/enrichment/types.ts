import type { SourceRecord } from '@/lib/data/types';
import type { JlptLevel } from '@/lib/simulation/types';

/**
 * Enrichment statuses track progress through the extraction pipeline.
 * Each institution can have multiple EnrichedUniversityRecords (one per program+route+year).
 */
export type EnrichmentStatus =
  | 'identity_only' // registry identity verified; no enrichment sources discovered yet
  | 'sources_discovered' // official pages found; extraction not yet attempted
  | 'extraction_pending' // extraction attempted but incomplete or low-confidence
  | 'needs_review' // facts extracted, but validation flagged contradictions/risks
  | 'partially_verified' // some required fields verified; others explicitly not_verified
  | 'decision_ready' // all required fields verified or documented as null/not_verified
  | 'stale'; // was decision_ready; source > 12 months old, needs refresh

export type EnrichmentField =
  | 'jlpt_requirement'
  | 'eju_required'
  | 'eju_subjects'
  | 'tuition_jpy'
  | 'admission_fee_jpy'
  | 'facility_fee_jpy'
  | 'other_first_year_fees_jpy'
  | 'scholarship_reduction_available'
  | 'program_name_ja'
  | 'program_name_en'
  | 'intake_size'
  | 'academic_year'
  | 'application_start_date'
  | 'application_end_date'
  | 'exam_date'
  | 'interview_required'
  | 'education_years'
  | 'program_scope'; // 'all_students' | 'intl_only' | 'mixed'

export type ExtractionConfidence = 'high' | 'medium' | 'low';

export interface EnrichedFact {
  field: EnrichmentField;
  value: string | number | boolean | null;
  /** Source URL where this fact was extracted from. */
  sourceUrl: string;
  /** Location within source (page number, section, etc.), if available. */
  sourceLocation?: string;
  extractedAt: string; // ISO date
  confidence: ExtractionConfidence;
  extractor: 'pipeline' | 'human-verified';
  extractorVersion?: string;
  notes?: string;
}

export interface FactValidationIssue {
  field: EnrichmentField;
  issue:
    | 'incomplete_required_fields'
    | 'conflicting_sources'
    | 'stale_source'
    | 'suspicious_value'
    | 'low_extraction_confidence'
    | 'scope_unclear';
  severity: 'error' | 'warning';
  message: string;
  suggestedFact?: EnrichedFact;
}

export interface EnrichmentSource {
  id: string;
  /** Source URL (must be official domain). */
  url: string;
  /** e.g. "university.ac.jp" — used for domain validation. */
  officialDomain: string;
  /** e.g. "admissions" | "international" | "tuition-table" | "program-guide". */
  sourceType: string;
  /** Academic year this source describes (e.g., "2024-2025"). */
  academicYear: string;
  /** When we retrieved this page. */
  retrievedAt: string; // ISO date
  /** Content hash to detect modifications. */
  contentHash?: string;
  /** Parse attempt: success or error. */
  extractionStatus: 'success' | 'parse_error' | 'not_attempted';
  extractionError?: string;
  /** Facts extracted from this source (if successful). */
  factsExtracted?: EnrichedFact[];
  /** Metadata from the source itself (if available). */
  publicationDate?: string; // ISO date
  /** Human-readable note on what went wrong or special context. */
  notes?: string;
}

export interface EnrichmentEntity {
  /** Stable ID: `{university_id}:{program_id}:{route_id}:{academic_year}` */
  id: string;
  universityId: string;
  /** Normalized program name (from source, or search term if discovery-only). */
  programNameJa: string;
  programNameEn: string | null;
  /** Admission route (e.g., "international-admission", "MEXT-scholarship-eligible", "direct-application"). */
  admissionRoute: string;
  academicYear: string; // e.g., "2024-2025"
  /** Discovered official sources for this entity. */
  sources: EnrichmentSource[];
  /** All facts extracted from those sources. */
  facts: EnrichedFact[];
  /** Validation issues detected (if any). */
  validationIssues: FactValidationIssue[];
  /** Current status. */
  status: EnrichmentStatus;
  /** Timestamp of last status change. */
  statusUpdatedAt: string;
  /** Human review notes (if needs_review or partially_verified). */
  reviewNotes?: string;
  /** Which SourceRecord(s) back these extracted facts. */
  sourceRecordIds: string[]; // e.g., ["src-mext-registry", "src-tokyo-univ-admissions"]
}

export interface EnrichedUniversityRecord {
  universityId: string;
  /** All discovered entities (program+route+year combinations). */
  entities: EnrichmentEntity[];
  /** Overall enrichment status (most advanced status among entities). */
  overallStatus: EnrichmentStatus;
  /** When we last attempted enrichment. */
  lastEnrichmentAttempt?: string;
  /** Next recommended action. */
  nextAction?: string;
}

export interface EnrichmentBatch {
  id: string;
  createdAt: string;
  universities: string[]; // university IDs in this batch
  priority: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  entitiesCreated: number;
  factsExtracted: number;
  reviewQueueCount: number;
  completedAt?: string;
  notes?: string;
}

export interface ReviewQueueEntry {
  id: string;
  entityId: string;
  universityId: string;
  reason:
    | 'conflicting_sources'
    | 'low_extraction_confidence'
    | 'stale_source'
    | 'incomplete_required_fields'
    | 'human_verification_requested'
    | 'suspicious_value';
  issues: FactValidationIssue[];
  facts: EnrichedFact[];
  createdAt: string;
  status: 'pending' | 'approved_with_override' | 'rejected' | 'needs_clarification';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface EnrichmentAuditLog {
  timestamp: string;
  action:
    | 'batch_created'
    | 'sources_discovered'
    | 'extraction_attempted'
    | 'validation_passed'
    | 'validation_failed'
    | 'review_queued'
    | 'review_approved'
    | 'status_updated'
    | 'fact_imported';
  entityId: string;
  universityId: string;
  details: Record<string, unknown>;
}
