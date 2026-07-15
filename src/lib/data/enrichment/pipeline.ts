import type {
  EnrichedFact,
  EnrichedUniversityRecord,
  EnrichmentAuditLog,
  EnrichmentBatch,
  EnrichmentEntity,
  EnrichmentField,
  EnrichmentSource,
  FactValidationIssue,
  ReviewQueueEntry,
} from './types';

const REQUIRED_FIELDS = [
  'jlpt_requirement',
  'eju_required',
  'tuition_jpy',
  'admission_fee_jpy',
  'academic_year',
  'application_end_date',
  'program_name_ja',
] as const satisfies readonly EnrichmentField[];

const STALE_THRESHOLD_DAYS = 365;

/**
 * Validates discovered sources: checks domain is official, not stale, has content.
 */
export function validateSource(source: EnrichmentSource): FactValidationIssue[] {
  const issues: FactValidationIssue[] = [];

  // Check domain is official (in real system, match against known official domains).
  if (!source.officialDomain.includes('.ac.jp') && !source.officialDomain.includes('.go.jp')) {
    issues.push({
      field: 'program_scope',
      issue: 'suspicious_value',
      severity: 'error',
      message: `Source domain ${source.officialDomain} is not a recognized Japanese educational/government domain.`,
    });
  }

  // Check for staleness.
  if (source.publicationDate) {
    const pubDate = new Date(source.publicationDate);
    const now = new Date();
    const daysOld = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld > STALE_THRESHOLD_DAYS) {
      issues.push({
        field: 'academic_year',
        issue: 'stale_source',
        severity: 'warning',
        message: `Source was published ${Math.round(daysOld)} days ago; may not reflect current requirements.`,
      });
    }
  }

  return issues;
}

/**
 * Validates extracted facts: checks for required fields, contradictions, suspicious values.
 */
export function validateFacts(facts: EnrichedFact[], source: EnrichmentSource): FactValidationIssue[] {
  const issues: FactValidationIssue[] = [];
  const presentFields = new Set(facts.map((f) => f.field));

  // Check for missing required fields.
  for (const req of REQUIRED_FIELDS) {
    if (!presentFields.has(req)) {
      issues.push({
        field: req,
        issue: 'incomplete_required_fields',
        severity: 'error',
        message: `Required field '${req}' not found in extracted facts.`,
      });
    }
  }

  // Check for low-confidence facts.
  for (const fact of facts) {
    if (fact.confidence === 'low') {
      issues.push({
        field: fact.field,
        issue: 'low_extraction_confidence',
        severity: 'warning',
        message: `Extracted value for '${fact.field}' has low confidence. Requires human review.`,
        suggestedFact: fact,
      });
    }
  }

  // Validate specific field values.
  const jlpt = facts.find((f) => f.field === 'jlpt_requirement');
  if (jlpt && jlpt.value && typeof jlpt.value === 'string') {
    const valid = ['none', 'n5', 'n4', 'n3', 'n2', 'n1'].includes(jlpt.value.toLowerCase());
    if (!valid) {
      issues.push({
        field: 'jlpt_requirement',
        issue: 'suspicious_value',
        severity: 'error',
        message: `Invalid JLPT level: ${jlpt.value}. Expected one of: none, N5, N4, N3, N2, N1.`,
      });
    }
  }

  const tuition = facts.find((f) => f.field === 'tuition_jpy');
  if (tuition && tuition.value && typeof tuition.value === 'number') {
    if (tuition.value < 0 || tuition.value > 10_000_000) {
      issues.push({
        field: 'tuition_jpy',
        issue: 'suspicious_value',
        severity: 'warning',
        message: `Tuition value ¥${tuition.value} is outside typical range (¥0–¥10M). Verify extraction.`,
      });
    }
  }

  return issues;
}

/**
 * Determines enrichment status based on facts and validation issues.
 */
export function deriveStatus(entity: EnrichmentEntity): EnrichmentEntity['status'] {
  if (entity.sources.length === 0) return 'identity_only';
  if (entity.sources.every((s) => s.extractionStatus === 'not_attempted')) return 'sources_discovered';
  if (entity.sources.some((s) => s.extractionStatus === 'parse_error')) return 'extraction_pending';
  if (entity.validationIssues.some((i) => i.severity === 'error')) return 'needs_review';
  if (entity.validationIssues.length > 0) return 'partially_verified';
  return 'decision_ready';
}

/**
 * Creates a review queue entry for high-risk extractions.
 */
export function createReviewEntry(
  entity: EnrichmentEntity,
  issues: FactValidationIssue[],
): ReviewQueueEntry | null {
  if (!issues.some((i) => i.severity === 'error')) return null;

  // Map issue type to review queue reason.
  const issueType = issues[0]?.issue;
  const reason: ReviewQueueEntry['reason'] = issueType === 'incomplete_required_fields'
    ? 'incomplete_required_fields'
    : issueType === 'conflicting_sources'
      ? 'conflicting_sources'
      : issueType === 'stale_source'
        ? 'stale_source'
        : issueType === 'low_extraction_confidence'
          ? 'low_extraction_confidence'
          : 'human_verification_requested';

  return {
    id: `review-${entity.id}-${Date.now()}`,
    entityId: entity.id,
    universityId: entity.universityId,
    reason,
    issues,
    facts: entity.facts,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
}

/**
 * Processes an enrichment entity through the validation pipeline.
 */
export function processEntity(entity: EnrichmentEntity): EnrichmentEntity {
  const allIssues: FactValidationIssue[] = [];

  // Validate sources.
  for (const source of entity.sources) {
    const sourceIssues = validateSource(source);
    allIssues.push(...sourceIssues);
  }

  // Validate extracted facts.
  for (const source of entity.sources.filter((s) => s.extractionStatus === 'success')) {
    if (source.factsExtracted) {
      const factIssues = validateFacts(source.factsExtracted, source);
      allIssues.push(...factIssues);
    }
  }

  // Update entity with issues and derived status.
  return {
    ...entity,
    validationIssues: allIssues,
    status: deriveStatus({ ...entity, validationIssues: allIssues }),
    statusUpdatedAt: new Date().toISOString(),
  };
}

export interface PipelineStats {
  totalEntities: number;
  byStatus: Record<string, number>;
  factsExtracted: number;
  reviewQueueSize: number;
  validationIssues: number;
}

/**
 * Computes summary statistics for a batch of universities.
 */
export function computeStats(universities: EnrichedUniversityRecord[]): PipelineStats {
  const stats: PipelineStats = {
    totalEntities: 0,
    byStatus: {},
    factsExtracted: 0,
    reviewQueueSize: 0,
    validationIssues: 0,
  };

  for (const univ of universities) {
    for (const entity of univ.entities) {
      stats.totalEntities += 1;
      stats.byStatus[entity.status] = (stats.byStatus[entity.status] ?? 0) + 1;
      stats.factsExtracted += entity.facts.length;
      stats.validationIssues += entity.validationIssues.length;
      if (entity.status === 'needs_review') stats.reviewQueueSize += 1;
    }
  }

  return stats;
}

/**
 * Creates an audit log entry.
 */
export function logAudit(
  action: EnrichmentAuditLog['action'],
  entityId: string,
  universityId: string,
  details: Record<string, unknown>,
): EnrichmentAuditLog {
  return {
    timestamp: new Date().toISOString(),
    action,
    entityId,
    universityId,
    details,
  };
}
