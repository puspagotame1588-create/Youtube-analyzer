import { describe, expect, it } from 'vitest';
import {
  classifySource,
  isOfficialSource,
  checkStaleness,
  checkDecisionReadiness,
  REQUIRED_FIELDS,
  HIGH_IMPACT_FIELDS,
} from './validation';
import type { SourceClassification } from './types';

describe('enrichment validation — hardened', () => {
  describe('source classification', () => {
    it('classifies .ac.jp domains as official_university', () => {
      expect(classifySource('u-tokyo.ac.jp')).toBe('official_university');
      expect(classifySource('aoyama.ac.jp')).toBe('official_university');
    });

    it('classifies government education domains as official_government', () => {
      expect(classifySource('mext.go.jp')).toBe('official_government');
      expect(classifySource('jasso.go.jp')).toBe('official_government');
      expect(classifySource('moj.go.jp')).toBe('official_government');
    });

    it('classifies Tokyo Metro domain as official_public_agency', () => {
      expect(classifySource('metro.tokyo.lg.jp')).toBe('official_public_agency');
      expect(classifySource('pref.kanagawa.lg.jp')).toBe('official_public_agency');
    });

    it('classifies unknown domains as untrusted', () => {
      expect(classifySource('example.com')).toBe('untrusted');
      expect(classifySource('blog.example.jp')).toBe('untrusted');
    });

    it('normalizes domain case', () => {
      expect(classifySource('U-TOKYO.AC.JP')).toBe('official_university');
      expect(classifySource('MEXT.GO.JP')).toBe('official_government');
    });

    it('only official sources are trusted', () => {
      expect(isOfficialSource('official_university')).toBe(true);
      expect(isOfficialSource('official_government')).toBe(true);
      expect(isOfficialSource('official_public_agency')).toBe(true);
      expect(isOfficialSource('approved_external')).toBe(false);
      expect(isOfficialSource('untrusted')).toBe(false);
    });
  });

  describe('staleness detection (academic-year-aware)', () => {
    it('detects academic year mismatch as hard error', () => {
      const result = checkStaleness('2023-2024', '2024-2025', '2024-05-01T00:00:00Z');
      expect(result.stale).toBe(true);
      expect(result.reason).toBe('academic_year_mismatch');
      expect(result.severity).toBe('error');
    });

    it('detects passed application deadline as stale', () => {
      const pastDeadline = '2023-12-01T00:00:00Z'; // in the past
      const result = checkStaleness(
        '2024-2025',
        '2024-2025',
        '2024-05-01T00:00:00Z',
        pastDeadline,
      );
      expect(result.stale).toBe(true);
      expect(result.reason).toBe('application_deadline_passed');
      expect(result.severity).toBe('error');
    });

    it('marks future deadline as not stale', () => {
      const futureDeadline = new Date();
      futureDeadline.setFullYear(futureDeadline.getFullYear() + 1);
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30);
      const result = checkStaleness(
        '2024-2025',
        '2024-2025',
        recentDate.toISOString(),
        futureDeadline.toISOString(),
      );
      expect(result.stale).toBe(false);
    });

    it('detects archived source (>365 days old)', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 400);
      const result = checkStaleness('2024-2025', '2024-2025', oldDate.toISOString());
      expect(result.stale).toBe(true);
      expect(result.reason).toBe('archived_outdated_source');
      expect(result.severity).toBe('warning');
    });

    it('marks recent source as fresh', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30);
      const result = checkStaleness('2024-2025', '2024-2025', recentDate.toISOString());
      expect(result.stale).toBe(false);
    });
  });

  describe('decision readiness checklist', () => {
    it('requires official source', () => {
      const result = checkDecisionReadiness({
        hasOfficialSource: false,
        sourceClassifications: ['untrusted'],
        hasAllRequiredFields: true,
        factsHaveLocators: true,
        hasValidationErrors: false,
        hasConflicts: false,
        highImpactFieldsReviewed: true,
        academicYearMatches: true,
      });
      expect(result.blockers).toContain('no_official_source');
      expect(result.ready).toBe(false);
    });

    it('rejects untrusted sources', () => {
      const result = checkDecisionReadiness({
        hasOfficialSource: true,
        sourceClassifications: ['official_university', 'untrusted'],
        hasAllRequiredFields: true,
        factsHaveLocators: true,
        hasValidationErrors: false,
        hasConflicts: false,
        highImpactFieldsReviewed: true,
        academicYearMatches: true,
      });
      expect(result.blockers).toContain('untrusted_source');
      expect(result.ready).toBe(false);
    });

    it('requires all 7 required fields', () => {
      const result = checkDecisionReadiness({
        hasOfficialSource: true,
        sourceClassifications: ['official_university'],
        hasAllRequiredFields: false,
        factsHaveLocators: true,
        hasValidationErrors: false,
        hasConflicts: false,
        highImpactFieldsReviewed: true,
        academicYearMatches: true,
      });
      expect(result.blockers).toContain('missing_required_fields');
    });

    it('requires evidence locators on all facts', () => {
      const result = checkDecisionReadiness({
        hasOfficialSource: true,
        sourceClassifications: ['official_university'],
        hasAllRequiredFields: true,
        factsHaveLocators: false,
        hasValidationErrors: false,
        hasConflicts: false,
        highImpactFieldsReviewed: true,
        academicYearMatches: true,
      });
      expect(result.blockers).toContain('missing_evidence_locators');
    });

    it('rejects validation errors', () => {
      const result = checkDecisionReadiness({
        hasOfficialSource: true,
        sourceClassifications: ['official_university'],
        hasAllRequiredFields: true,
        factsHaveLocators: true,
        hasValidationErrors: true,
        hasConflicts: false,
        highImpactFieldsReviewed: true,
        academicYearMatches: true,
      });
      expect(result.blockers).toContain('validation_errors');
    });

    it('rejects unresolved conflicts', () => {
      const result = checkDecisionReadiness({
        hasOfficialSource: true,
        sourceClassifications: ['official_university'],
        hasAllRequiredFields: true,
        factsHaveLocators: true,
        hasValidationErrors: false,
        hasConflicts: true,
        highImpactFieldsReviewed: true,
        academicYearMatches: true,
      });
      expect(result.blockers).toContain('unresolved_conflicts');
    });

    it('requires high-impact fields to be human-reviewed', () => {
      const result = checkDecisionReadiness({
        hasOfficialSource: true,
        sourceClassifications: ['official_university'],
        hasAllRequiredFields: true,
        factsHaveLocators: true,
        hasValidationErrors: false,
        hasConflicts: false,
        highImpactFieldsReviewed: false,
        academicYearMatches: true,
      });
      expect(result.blockers).toContain('high_impact_fields_require_review');
    });

    it('requires academic year to match', () => {
      const result = checkDecisionReadiness({
        hasOfficialSource: true,
        sourceClassifications: ['official_university'],
        hasAllRequiredFields: true,
        factsHaveLocators: true,
        hasValidationErrors: false,
        hasConflicts: false,
        highImpactFieldsReviewed: true,
        academicYearMatches: false,
      });
      expect(result.blockers).toContain('academic_year_mismatch');
    });

    it('rejects synthetic fixtures', () => {
      const result = checkDecisionReadiness({
        hasOfficialSource: true,
        sourceClassifications: ['official_university'],
        hasAllRequiredFields: true,
        factsHaveLocators: true,
        hasValidationErrors: false,
        hasConflicts: false,
        highImpactFieldsReviewed: true,
        academicYearMatches: true,
        isSyntheticFixture: true,
      });
      expect(result.blockers).toContain('synthetic_fixture_cannot_be_decision_ready');
      expect(result.ready).toBe(false);
    });

    it('passes when all requirements met', () => {
      const result = checkDecisionReadiness({
        hasOfficialSource: true,
        sourceClassifications: ['official_university'],
        hasAllRequiredFields: true,
        factsHaveLocators: true,
        hasValidationErrors: false,
        hasConflicts: false,
        highImpactFieldsReviewed: true,
        academicYearMatches: true,
        isSyntheticFixture: false,
      });
      expect(result.ready).toBe(true);
      expect(result.blockers).toHaveLength(0);
    });
  });

  describe('required and high-impact field lists', () => {
    it('has exactly 7 required fields', () => {
      expect(REQUIRED_FIELDS.size).toBe(7);
    });

    it('includes critical eligibility fields', () => {
      expect(REQUIRED_FIELDS.has('jlpt_requirement')).toBe(true);
      expect(REQUIRED_FIELDS.has('eju_required')).toBe(true);
      expect(REQUIRED_FIELDS.has('tuition_jpy')).toBe(true);
      expect(REQUIRED_FIELDS.has('admission_fee_jpy')).toBe(true);
      expect(REQUIRED_FIELDS.has('academic_year')).toBe(true);
      expect(REQUIRED_FIELDS.has('application_end_date')).toBe(true);
      expect(REQUIRED_FIELDS.has('program_name_ja')).toBe(true);
    });

    it('high-impact fields are subset of required', () => {
      for (const field of HIGH_IMPACT_FIELDS) {
        expect(REQUIRED_FIELDS.has(field)).toBe(true);
      }
    });
  });
});
