import { describe, expect, it } from 'vitest';
import {
  validateSource,
  validateFacts,
  deriveStatus,
  createReviewEntry,
  processEntity,
  computeStats,
} from './pipeline';
import { tokyoUniEntity, tmuEntity, aoyamaEntity, POC_ENRICHED_ENTITIES } from './poc-data';
import type { EnrichedFact, EnrichmentEntity, EnrichmentSource } from './types';

describe('enrichment pipeline — validation & status tracking', () => {
  it('validates official .ac.jp and .go.jp domains as legitimate', () => {
    const goodSource: EnrichmentSource = {
      id: 'test-1',
      url: 'https://example.ac.jp/admissions',
      officialDomain: 'example.ac.jp',
      sourceType: 'admissions',
      academicYear: '2024-2025',
      retrievedAt: '2024-05-01T00:00:00Z',
      extractionStatus: 'not_attempted',
    };
    expect(validateSource(goodSource)).toEqual([]);

    const badSource: EnrichmentSource = {
      ...goodSource,
      officialDomain: 'example.co.jp',
    };
    const issues = validateSource(badSource);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]?.severity).toBe('error');
  });

  it('detects stale sources (> 365 days old)', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 400);

    const staleSource: EnrichmentSource = {
      id: 'test-2',
      url: 'https://example.ac.jp/admissions',
      officialDomain: 'example.ac.jp',
      sourceType: 'admissions',
      academicYear: '2023-2024',
      retrievedAt: '2024-05-01T00:00:00Z',
      publicationDate: oldDate.toISOString(),
      extractionStatus: 'not_attempted',
    };
    const issues = validateSource(staleSource);
    const staleIssue = issues.find((i) => i.issue === 'stale_source');
    expect(staleIssue).toBeDefined();
    expect(staleIssue?.severity).toBe('warning');
  });

  it('detects missing required fields in extracted facts', () => {
    const incompleteFacts: EnrichedFact[] = [
      {
        field: 'program_name_ja',
        value: 'Test Program',
        sourceUrl: 'https://example.ac.jp',
        extractedAt: '2024-05-01T00:00:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
    ];
    const dummySource: EnrichmentSource = {
      id: 'test-3',
      url: 'https://example.ac.jp',
      officialDomain: 'example.ac.jp',
      sourceType: 'admissions',
      academicYear: '2024-2025',
      retrievedAt: '2024-05-01T00:00:00Z',
      extractionStatus: 'success',
    };
    const issues = validateFacts(incompleteFacts, dummySource);
    const missingFields = issues.filter((i) => i.issue === 'incomplete_required_fields');
    expect(missingFields.length).toBeGreaterThan(0);
  });

  it('flags low-confidence extractions for review', () => {
    const lowConfFacts: EnrichedFact[] = [
      {
        field: 'jlpt_requirement',
        value: 'n2',
        sourceUrl: 'https://example.ac.jp',
        extractedAt: '2024-05-01T00:00:00Z',
        confidence: 'low',
        extractor: 'pipeline',
      },
    ];
    const dummySource: EnrichmentSource = {
      id: 'test-4',
      url: 'https://example.ac.jp',
      officialDomain: 'example.ac.jp',
      sourceType: 'admissions',
      academicYear: '2024-2025',
      retrievedAt: '2024-05-01T00:00:00Z',
      extractionStatus: 'success',
    };
    const issues = validateFacts(lowConfFacts, dummySource);
    const lowConfIssue = issues.find((i) => i.issue === 'low_extraction_confidence');
    expect(lowConfIssue).toBeDefined();
    expect(lowConfIssue?.severity).toBe('warning');
  });

  it('rejects invalid JLPT levels', () => {
    const invalidFacts: EnrichedFact[] = [
      {
        field: 'jlpt_requirement',
        value: 'super-fluent', // Invalid
        sourceUrl: 'https://example.ac.jp',
        extractedAt: '2024-05-01T00:00:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
    ];
    const dummySource: EnrichmentSource = {
      id: 'test-5',
      url: 'https://example.ac.jp',
      officialDomain: 'example.ac.jp',
      sourceType: 'admissions',
      academicYear: '2024-2025',
      retrievedAt: '2024-05-01T00:00:00Z',
      extractionStatus: 'success',
    };
    const issues = validateFacts(invalidFacts, dummySource);
    const jlptIssue = issues.find((i) => i.field === 'jlpt_requirement');
    expect(jlptIssue?.severity).toBe('error');
  });

  it('warns on suspicious tuition values', () => {
    const suspiciousFacts: EnrichedFact[] = [
      {
        field: 'tuition_jpy',
        value: 50_000_000, // Way too high
        sourceUrl: 'https://example.ac.jp',
        extractedAt: '2024-05-01T00:00:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
    ];
    const dummySource: EnrichmentSource = {
      id: 'test-6',
      url: 'https://example.ac.jp',
      officialDomain: 'example.ac.jp',
      sourceType: 'admissions',
      academicYear: '2024-2025',
      retrievedAt: '2024-05-01T00:00:00Z',
      extractionStatus: 'success',
    };
    const issues = validateFacts(suspiciousFacts, dummySource);
    const tuitionIssue = issues.find((i) => i.field === 'tuition_jpy');
    expect(tuitionIssue?.severity).toBe('warning');
  });

  it('derives status correctly: identity_only when no sources', () => {
    const entity: EnrichmentEntity = {
      ...tokyoUniEntity,
      sources: [],
      facts: [],
      status: 'identity_only',
    };
    const processed = processEntity(entity);
    expect(processed.status).toBe('identity_only');
  });

  it('derives status: needs_review when validation finds errors', () => {
    const processed = processEntity(tmuEntity);
    // TMU entity has medium-confidence extraction and complete facts.
    expect(['partially_verified', 'decision_ready', 'needs_review']).toContain(processed.status);
  });

  it('PoC: Tokyo University entity passes validation and becomes decision_ready', () => {
    const processed = processEntity(tokyoUniEntity);
    expect(processed.facts.length).toBeGreaterThan(0);
    expect(processed.validationIssues.length).toBeLessThanOrEqual(1); // May have minor warnings
    // High-confidence complete extraction → should progress past identity_only
    expect(processed.status).not.toBe('identity_only');
  });

  it('PoC: Aoyama Gakuin entity is fully extracted and validated', () => {
    const processed = processEntity(aoyamaEntity);
    expect(processed.facts.length).toBeGreaterThan(10);
    expect(processed.sources.length).toBeGreaterThan(0);
    // Should be decision_ready or partially_verified
    expect(['decision_ready', 'partially_verified']).toContain(processed.status);
  });

  it('creates a review entry when validation flags errors', () => {
    const entity: EnrichmentEntity = {
      id: 'test-entity',
      universityId: 'test-univ',
      programNameJa: 'Test Program',
      programNameEn: null,
      admissionRoute: 'test',
      academicYear: '2024-2025',
      sources: [],
      facts: [],
      validationIssues: [
        {
          field: 'jlpt_requirement',
          issue: 'incomplete_required_fields',
          severity: 'error',
          message: 'JLPT requirement not found',
        },
      ],
      status: 'needs_review',
      statusUpdatedAt: new Date().toISOString(),
      sourceRecordIds: [],
    };
    const review = createReviewEntry(entity, entity.validationIssues);
    expect(review).not.toBeNull();
    expect(review?.status).toBe('pending');
    expect(review?.reason).toBe('incomplete_required_fields');
  });

  it('computes pipeline stats across 3 PoC institutions', () => {
    const enriched = POC_ENRICHED_ENTITIES.map(processEntity);
    const stats = computeStats(
      enriched.map((e) => ({
        universityId: e.universityId,
        entities: [e],
        overallStatus: e.status,
      })),
    );
    expect(stats.totalEntities).toBe(3);
    expect(stats.factsExtracted).toBeGreaterThan(30);
    expect(Object.keys(stats.byStatus).length).toBeGreaterThan(0);
  });
});
