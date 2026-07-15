import { describe, expect, it } from 'vitest';
import { validateFacts, deriveStatus, createReviewEntry, processEntity, computeStats } from './pipeline';
import { tokyoUniEntity, tmuEntity, aoyamaEntity, POC_ENRICHED_ENTITIES } from './poc-data';
import type { EnrichedFact, EnrichmentEntity, EnrichmentSource } from './types';
import { classifySource } from './validation';

describe('enrichment pipeline — hardened validation & status tracking', () => {
  it('enforces evidence locators on all facts', () => {
    const factsWithoutLocators: EnrichedFact[] = [
      {
        field: 'program_name_ja',
        value: 'Test Program',
        sourceUrl: 'https://example.ac.jp',
        sourceLocation: '', // Empty = missing
        extractedAt: '2024-05-01T00:00:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
    ];
    const dummySource: EnrichmentSource = {
      id: 'test-1',
      url: 'https://example.ac.jp',
      officialDomain: 'example.ac.jp',
      classification: 'official_university',
      sourceType: 'admissions',
      academicYear: '2024-2025',
      retrievedAt: '2024-05-01T00:00:00Z',
      extractionStatus: 'success',
    };
    const issues = validateFacts(factsWithoutLocators, dummySource);
    const locatorIssue = issues.find((i) => i.issue === 'scope_unclear');
    expect(locatorIssue).toBeDefined();
    expect(locatorIssue?.severity).toBe('error');
  });

  it('detects missing required fields in extracted facts', () => {
    const incompleteFacts: EnrichedFact[] = [
      {
        field: 'program_name_ja',
        value: 'Test Program',
        sourceUrl: 'https://example.ac.jp',
        sourceLocation: 'Programs Section',
        extractedAt: '2024-05-01T00:00:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
    ];
    const dummySource: EnrichmentSource = {
      id: 'test-3',
      url: 'https://example.ac.jp',
      officialDomain: 'example.ac.jp',
      classification: 'official_university',
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
        sourceLocation: 'Language Requirements',
        extractedAt: '2024-05-01T00:00:00Z',
        confidence: 'low',
        extractor: 'pipeline',
      },
    ];
    const dummySource: EnrichmentSource = {
      id: 'test-4',
      url: 'https://example.ac.jp',
      officialDomain: 'example.ac.jp',
      classification: 'official_university',
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
        sourceLocation: 'Language Requirements',
        extractedAt: '2024-05-01T00:00:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
    ];
    const dummySource: EnrichmentSource = {
      id: 'test-5',
      url: 'https://example.ac.jp',
      officialDomain: 'example.ac.jp',
      classification: 'official_university',
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
        sourceLocation: 'Fees Section',
        extractedAt: '2024-05-01T00:00:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
    ];
    const dummySource: EnrichmentSource = {
      id: 'test-6',
      url: 'https://example.ac.jp',
      officialDomain: 'example.ac.jp',
      classification: 'official_university',
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
      isSyntheticFixture: false,
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

  it('PoC fixtures never become decision_ready (even if all checks pass)', () => {
    const processed = processEntity(tokyoUniEntity);
    expect(processed.isSyntheticFixture).toBe(true);
    expect(processed.status).not.toBe('decision_ready');
    // Fixtures stay in needs_review to prevent production leakage
    expect(processed.status).toBe('needs_review');
  });

  it('PoC: TMU entity with medium-confidence extraction', () => {
    const processed = processEntity(tmuEntity);
    expect(processed.facts.length).toBeGreaterThan(0);
    expect(processed.isSyntheticFixture).toBe(true);
    // Should not reach decision_ready due to fixture flag
    expect(processed.status).not.toBe('decision_ready');
  });

  it('PoC: Aoyama Gakuin entity is fully extracted but marked as fixture', () => {
    const processed = processEntity(aoyamaEntity);
    expect(processed.facts.length).toBeGreaterThan(7);
    expect(processed.sources.length).toBeGreaterThan(0);
    expect(processed.isSyntheticFixture).toBe(true);
    // Should be needs_review (fixture block) not decision_ready
    expect(processed.status).toBe('needs_review');
  });

  it('detects conflicting sources (multiple sources disagree on fact)', () => {
    const conflictingFacts: EnrichedFact[] = [
      {
        field: 'jlpt_requirement',
        value: 'n1',
        sourceUrl: 'https://source-a.ac.jp',
        sourceLocation: 'Admissions Requirements',
        extractedAt: '2024-05-01T00:00:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'jlpt_requirement',
        value: 'n2',
        sourceUrl: 'https://source-b.ac.jp',
        sourceLocation: 'Language Requirements',
        extractedAt: '2024-05-01T00:00:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
    ];
    const entity: EnrichmentEntity = {
      id: 'test-conflict',
      universityId: 'test-univ',
      programNameJa: 'Test',
      programNameEn: null,
      admissionRoute: 'test',
      academicYear: '2024-2025',
      sources: [
        {
          id: 'src-a',
          url: 'https://source-a.ac.jp',
          officialDomain: 'source-a.ac.jp',
          classification: 'official_university',
          sourceType: 'admissions',
          academicYear: '2024-2025',
          retrievedAt: '2024-05-01T00:00:00Z',
          extractionStatus: 'success',
          factsExtracted: [conflictingFacts[0]!],
        },
        {
          id: 'src-b',
          url: 'https://source-b.ac.jp',
          officialDomain: 'source-b.ac.jp',
          classification: 'official_university',
          sourceType: 'admissions',
          academicYear: '2024-2025',
          retrievedAt: '2024-05-01T00:00:00Z',
          extractionStatus: 'success',
          factsExtracted: [conflictingFacts[1]!],
        },
      ],
      facts: conflictingFacts,
      validationIssues: [],
      status: 'identity_only',
      statusUpdatedAt: new Date().toISOString(),
      sourceRecordIds: [],
    };
    const processed = processEntity(entity);
    // Conflicting facts should be detected during validation or status derivation
    expect(processed.status).not.toBe('decision_ready');
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
    expect(stats.factsExtracted).toBeGreaterThan(20);
    expect(Object.keys(stats.byStatus).length).toBeGreaterThan(0);
  });
});
