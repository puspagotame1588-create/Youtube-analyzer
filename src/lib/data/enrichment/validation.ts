/**
 * Source classification and validation.
 *
 * Official sources trusted for evidence: .ac.jp universities, government education
 * agencies (MEXT, JASSO), public agencies (Tokyo Metro Education Board, etc.),
 * and an explicit allowlist of approved partners.
 *
 * Untrusted domains are rejected; approved_external requires manual curation.
 */

import type { SourceClassification } from './types';

const GOVERNMENT_DOMAINS: Set<string> = new Set([
  'mext.go.jp', // Ministry of Education, Culture, Sports, Science & Technology
  'jasso.go.jp', // Japan Student Services Organization
  'moj.go.jp', // Immigration Services Agency
  'nda.go.jp', // National Defense Academy
]);

const PUBLIC_AGENCY_DOMAINS: Set<string> = new Set([
  'metro.tokyo.lg.jp', // Tokyo Metropolitan Government Education Board
  'pref.kanagawa.lg.jp', // Kanagawa Prefecture
  'pref.saitama.lg.jp', // Saitama Prefecture
  'city.yokohama.lg.jp', // Yokohama Municipal Education Board
]);

const APPROVED_EXTERNAL_DOMAINS: Set<string> = new Set([
  // Explicit allowlist for trusted third-party sources (must be maintained)
  // Example: 'jasso-partner.org'
]);

/**
 * Classifies a source domain as trust level.
 */
export function classifySource(domain: string): SourceClassification {
  const normalized = domain.toLowerCase().trim();

  // Official universities: .ac.jp
  if (normalized.endsWith('.ac.jp')) {
    return 'official_university';
  }

  // Official government education agencies
  if (GOVERNMENT_DOMAINS.has(normalized)) {
    return 'official_government';
  }

  // Official public agencies
  if (PUBLIC_AGENCY_DOMAINS.has(normalized)) {
    return 'official_public_agency';
  }

  // Explicitly approved external sources
  if (APPROVED_EXTERNAL_DOMAINS.has(normalized)) {
    return 'approved_external';
  }

  return 'untrusted';
}

/**
 * Checks if a source is from an official source (not untrusted, not just approved_external).
 * For decision_ready, we require official sources (university, government, or public agency).
 */
export function isOfficialSource(classification: SourceClassification): boolean {
  return (
    classification === 'official_university' ||
    classification === 'official_government' ||
    classification === 'official_public_agency'
  );
}

/**
 * Staleness detection with academic-year awareness.
 *
 * A source is stale if:
 * - It describes a different academic year than the target year
 * - Its application deadline has passed
 * - It's archived (>365 days old AND describes outdated year)
 * - A newer official source exists for the same content
 */
export interface StalenessResult {
  stale: boolean;
  reason?: string;
  severity?: 'error' | 'warning';
}

export function checkStaleness(
  sourceAcademicYear: string,
  targetAcademicYear: string,
  retrievedAt: string,
  applicationDeadline?: string,
): StalenessResult {
  // Academic year mismatch is a hard error
  if (sourceAcademicYear !== targetAcademicYear) {
    return {
      stale: true,
      reason: 'academic_year_mismatch',
      severity: 'error',
    };
  }

  // Application deadline passed
  if (applicationDeadline) {
    const deadline = new Date(applicationDeadline);
    if (deadline < new Date()) {
      return {
        stale: true,
        reason: 'application_deadline_passed',
        severity: 'error',
      };
    }
  }

  // Age check: >365 days old
  const retrievedDate = new Date(retrievedAt);
  const now = new Date();
  const daysOld = (now.getTime() - retrievedDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysOld > 365) {
    return {
      stale: true,
      reason: 'archived_outdated_source',
      severity: 'warning',
    };
  }

  return { stale: false };
}

/**
 * Decision-readiness validation.
 *
 * An entity is decision_ready only if:
 * 1. Has at least one official source (university, government, or public agency)
 * 2. Source classification is not 'untrusted'
 * 3. All 7 required fields are present and non-null
 * 4. All facts have evidence locators (page number, section, etc.)
 * 5. No validation errors (high-severity issues)
 * 6. No unresolved conflicting sources
 * 7. High-impact fields (JLPT, tuition, EJU) are human-reviewed
 * 8. Academic year matches target
 * 9. Is not a synthetic fixture
 */

export interface DecisionReadinessCheck {
  ready: boolean;
  blockers: string[];
  checklist: {
    hasOfficialSource: boolean;
    hasAllRequiredFields: boolean;
    hasEvidenceLocators: boolean;
    noValidationErrors: boolean;
    noConflictingSources: boolean;
    highImpactFieldsReviewed: boolean;
    academicYearMatches: boolean;
    notSyntheticFixture: boolean;
  };
}

const REQUIRED_FIELDS = new Set([
  'jlpt_requirement',
  'eju_required',
  'tuition_jpy',
  'admission_fee_jpy',
  'academic_year',
  'application_end_date',
  'program_name_ja',
] as const);

const HIGH_IMPACT_FIELDS = new Set([
  'jlpt_requirement',
  'eju_required',
  'tuition_jpy',
  'admission_fee_jpy',
] as const);

export function checkDecisionReadiness(params: {
  hasOfficialSource: boolean;
  sourceClassifications: SourceClassification[];
  hasAllRequiredFields: boolean;
  factsHaveLocators: boolean;
  hasValidationErrors: boolean;
  hasConflicts: boolean;
  highImpactFieldsReviewed: boolean;
  academicYearMatches: boolean;
  isSyntheticFixture?: boolean;
}): DecisionReadinessCheck {
  const blockers: string[] = [];
  const checklist = {
    hasOfficialSource: params.hasOfficialSource,
    hasAllRequiredFields: params.hasAllRequiredFields,
    hasEvidenceLocators: params.factsHaveLocators,
    noValidationErrors: !params.hasValidationErrors,
    noConflictingSources: !params.hasConflicts,
    highImpactFieldsReviewed: params.highImpactFieldsReviewed,
    academicYearMatches: params.academicYearMatches,
    notSyntheticFixture: !params.isSyntheticFixture,
  };

  if (!params.hasOfficialSource) blockers.push('no_official_source');
  if (params.sourceClassifications.some((c) => c === 'untrusted')) blockers.push('untrusted_source');
  if (!params.hasAllRequiredFields) blockers.push('missing_required_fields');
  if (!params.factsHaveLocators) blockers.push('missing_evidence_locators');
  if (params.hasValidationErrors) blockers.push('validation_errors');
  if (params.hasConflicts) blockers.push('unresolved_conflicts');
  if (!params.highImpactFieldsReviewed) blockers.push('high_impact_fields_require_review');
  if (!params.academicYearMatches) blockers.push('academic_year_mismatch');
  if (params.isSyntheticFixture) blockers.push('synthetic_fixture_cannot_be_decision_ready');

  return {
    ready: blockers.length === 0,
    blockers,
    checklist,
  };
}

export { REQUIRED_FIELDS, HIGH_IMPACT_FIELDS };
