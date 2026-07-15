/**
 * Enrichment module: loads extracted facts from official sources, validates them,
 * and tracks their status through the extraction pipeline.
 *
 * The PoC demonstrates: discovery → extraction → validation → status progression.
 * In production, real sources would feed real extraction and validation.
 */

import { POC_ENRICHED_ENTITIES } from './poc-data';
import { processEntity, computeStats, type PipelineStats } from './pipeline';
import type {
  EnrichedUniversityRecord,
  EnrichmentEntity,
  EnrichmentStatus,
} from './types';

/**
 * Loads and processes the PoC enrichment entities through the validation pipeline.
 * Returns a map of university ID → enriched record.
 */
export function loadEnrichedUniversities(): Map<string, EnrichedUniversityRecord> {
  const enriched = new Map<string, EnrichedUniversityRecord>();

  // Process each PoC entity through the pipeline.
  for (const rawEntity of POC_ENRICHED_ENTITIES) {
    const processedEntity = processEntity(rawEntity);

    const univId = processedEntity.universityId;
    let record = enriched.get(univId);

    if (!record) {
      record = {
        universityId: univId,
        entities: [],
        overallStatus: 'identity_only',
        lastEnrichmentAttempt: new Date().toISOString(),
      };
      enriched.set(univId, record);
    }

    record.entities.push(processedEntity);

    // Update overall status: use the most advanced status among entities.
    const statusRank: Record<EnrichmentStatus, number> = {
      identity_only: 0,
      sources_discovered: 1,
      extraction_pending: 2,
      needs_review: 3,
      partially_verified: 4,
      decision_ready: 5,
      stale: 4,
    };
    const maxRank = Math.max(...record.entities.map((e) => statusRank[e.status]));
    const statuses = Object.entries(statusRank).find(([, rank]) => rank === maxRank);
    if (statuses) {
      record.overallStatus = statuses[0] as EnrichmentStatus;
    }
  }

  return enriched;
}

// Singleton instance.
const ENRICHED_UNIVERSITIES = loadEnrichedUniversities();

export function getEnrichedUniversity(univId: string): EnrichedUniversityRecord | undefined {
  return ENRICHED_UNIVERSITIES.get(univId);
}

export function getAllEnrichedUniversities(): EnrichedUniversityRecord[] {
  return Array.from(ENRICHED_UNIVERSITIES.values());
}

export function getEnrichmentStats(): PipelineStats {
  return computeStats(getAllEnrichedUniversities());
}

/**
 * Finds enriched entities (program+route+year) for a university.
 * Returns only decision_ready or partially_verified entities suitable for ranking.
 * Excludes synthetic test fixtures (never used in production).
 */
export function getDecisionReadyEntities(
  univId: string,
): EnrichmentEntity[] {
  const record = ENRICHED_UNIVERSITIES.get(univId);
  if (!record) return [];
  return record.entities.filter(
    (e) =>
      ['decision_ready', 'partially_verified'].includes(e.status) &&
      !e.isSyntheticFixture, // Never return synthetic fixtures
  );
}

export type { EnrichedUniversityRecord, EnrichmentEntity, EnrichedFact, FactValidationIssue, ReviewQueueEntry } from './types';
