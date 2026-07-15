/**
 * Proof-of-concept enrichment data for 3 Tokyo universities.
 *
 * This demonstrates the pipeline working end-to-end:
 * - Discovery: official sources are "found" (mocked)
 * - Extraction: facts are "extracted" from those sources (mocked)
 * - Validation: facts are validated for completeness and consistency
 * - Status: entities progress through identity_only → decision_ready
 *
 * In production, discovery + extraction are automated; the pipeline loads
 * real extracted data and validates it. This PoC shows the validation +
 * status-tracking logic with realistic but mock-sourced data.
 */

import type { EnrichedFact, EnrichmentEntity, EnrichmentSource } from './types';

// ──────────────────────────────────────────────────────────────────────────────
// 1. TOKYO UNIVERSITY (東京大学) — National university
// ──────────────────────────────────────────────────────────────────────────────

export const tokyoUniSources: EnrichmentSource[] = [
  {
    id: 'src-tokyo-uni-intl-admissions',
    url: 'https://www.u-tokyo.ac.jp/en/admissions/undergraduate/index.html',
    officialDomain: 'u-tokyo.ac.jp',
    sourceType: 'admissions-guide',
    academicYear: '2024-2025',
    retrievedAt: '2024-05-15T10:30:00Z',
    publicationDate: '2024-04-01T00:00:00Z',
    contentHash: 'abc123def456',
    extractionStatus: 'success',
    notes: 'Official undergraduate international admission page',
    factsExtracted: [
      {
        field: 'program_name_ja',
        value: '理学部 (生物学科)',
        sourceUrl: 'https://www.u-tokyo.ac.jp/en/admissions/undergraduate/index.html',
        sourceLocation: 'Programs > Science > Biology',
        extractedAt: '2024-05-15T10:30:00Z',
        confidence: 'high',
        extractor: 'pipeline',
        extractorVersion: '0.1',
      },
      {
        field: 'program_name_en',
        value: 'School of Science, Department of Biology',
        sourceUrl: 'https://www.u-tokyo.ac.jp/en/admissions/undergraduate/index.html',
        extractedAt: '2024-05-15T10:30:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'jlpt_requirement',
        value: 'n1',
        sourceUrl: 'https://www.u-tokyo.ac.jp/en/admissions/undergraduate/index.html',
        sourceLocation: 'Language Requirements',
        extractedAt: '2024-05-15T10:30:00Z',
        confidence: 'high',
        extractor: 'pipeline',
        notes: 'Minimum JLPT N1 for most undergraduate programs',
      },
      {
        field: 'eju_required',
        value: false,
        sourceUrl: 'https://www.u-tokyo.ac.jp/en/admissions/undergraduate/index.html',
        extractedAt: '2024-05-15T10:30:00Z',
        confidence: 'high',
        extractor: 'pipeline',
        notes: 'EJU not required; JLPT and English proficiency (TOEFL) accepted',
      },
      {
        field: 'tuition_jpy',
        value: 235_400,
        sourceUrl: 'https://www.u-tokyo.ac.jp/en/admissions/undergraduate/index.html',
        sourceLocation: 'Fees > Annual Tuition',
        extractedAt: '2024-05-15T10:30:00Z',
        confidence: 'high',
        extractor: 'pipeline',
        notes: 'National university standard annual tuition',
      },
      {
        field: 'admission_fee_jpy',
        value: 17_000,
        sourceUrl: 'https://www.u-tokyo.ac.jp/en/admissions/undergraduate/index.html',
        extractedAt: '2024-05-15T10:30:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'facility_fee_jpy',
        value: 0,
        sourceUrl: 'https://www.u-tokyo.ac.jp/en/admissions/undergraduate/index.html',
        extractedAt: '2024-05-15T10:30:00Z',
        confidence: 'high',
        extractor: 'pipeline',
        notes: 'Facility fee bundled into tuition',
      },
      {
        field: 'scholarship_reduction_available',
        value: true,
        sourceUrl: 'https://www.u-tokyo.ac.jp/en/admissions/undergraduate/index.html',
        sourceLocation: 'Scholarship Information > MEXT',
        extractedAt: '2024-05-15T10:30:00Z',
        confidence: 'high',
        extractor: 'pipeline',
        notes: 'MEXT scholarships available for international students',
      },
      {
        field: 'academic_year',
        value: '2024-2025',
        sourceUrl: 'https://www.u-tokyo.ac.jp/en/admissions/undergraduate/index.html',
        extractedAt: '2024-05-15T10:30:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'application_end_date',
        value: '2024-12-10',
        sourceUrl: 'https://www.u-tokyo.ac.jp/en/admissions/undergraduate/index.html',
        sourceLocation: 'Important Dates > Deadline',
        extractedAt: '2024-05-15T10:30:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'interview_required',
        value: true,
        sourceUrl: 'https://www.u-tokyo.ac.jp/en/admissions/undergraduate/index.html',
        extractedAt: '2024-05-15T10:30:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
    ],
  },
];

export const tokyoUniEntity: EnrichmentEntity = {
  id: 'univ_f113110102700:biology:international-direct:2024-2025',
  universityId: 'univ_f113110102700',
  programNameJa: '理学部 (生物学科)',
  programNameEn: 'School of Science, Department of Biology',
  admissionRoute: 'international-direct-application',
  academicYear: '2024-2025',
  sources: tokyoUniSources,
  facts: tokyoUniSources[0]?.factsExtracted ?? [],
  validationIssues: [],
  status: 'identity_only',
  statusUpdatedAt: new Date().toISOString(),
  sourceRecordIds: ['src-mext-registry-2026-provisional', 'src-tokyo-uni-intl-admissions'],
};

// ──────────────────────────────────────────────────────────────────────────────
// 2. TOKYO METROPOLITAN UNIVERSITY (東京都立大学) — Public university
// ──────────────────────────────────────────────────────────────────────────────

export const tmuSources: EnrichmentSource[] = [
  {
    id: 'src-tmu-international',
    url: 'https://www.tmu.ac.jp/english/admission/international/index.html',
    officialDomain: 'tmu.ac.jp',
    sourceType: 'international-admissions',
    academicYear: '2024-2025',
    retrievedAt: '2024-05-16T14:00:00Z',
    publicationDate: '2024-03-15T00:00:00Z',
    contentHash: 'xyz789uvw012',
    extractionStatus: 'success',
    notes: 'International student admissions guide',
    factsExtracted: [
      {
        field: 'program_name_ja',
        value: '工学府 (建築学専攻)',
        sourceUrl: 'https://www.tmu.ac.jp/english/admission/international/index.html',
        extractedAt: '2024-05-16T14:00:00Z',
        confidence: 'medium',
        extractor: 'pipeline',
        notes: 'Extracted from program listing; confirm exact specialty name',
      },
      {
        field: 'program_name_en',
        value: 'Graduate School of Engineering, Architecture',
        sourceUrl: 'https://www.tmu.ac.jp/english/admission/international/index.html',
        extractedAt: '2024-05-16T14:00:00Z',
        confidence: 'medium',
        extractor: 'pipeline',
      },
      {
        field: 'jlpt_requirement',
        value: 'n3',
        sourceUrl: 'https://www.tmu.ac.jp/english/admission/international/index.html',
        sourceLocation: 'Language Requirements',
        extractedAt: '2024-05-16T14:00:00Z',
        confidence: 'high',
        extractor: 'pipeline',
        notes: 'JLPT N3 or higher required for graduate programs',
      },
      {
        field: 'eju_required',
        value: true,
        sourceUrl: 'https://www.tmu.ac.jp/english/admission/international/index.html',
        extractedAt: '2024-05-16T14:00:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'eju_subjects',
        value: 'mathematics, science, English',
        sourceUrl: 'https://www.tmu.ac.jp/english/admission/international/index.html',
        extractedAt: '2024-05-16T14:00:00Z',
        confidence: 'medium',
        extractor: 'pipeline',
      },
      {
        field: 'tuition_jpy',
        value: 390_000,
        sourceUrl: 'https://www.tmu.ac.jp/english/admission/international/index.html',
        sourceLocation: 'Fees > Annual Tuition',
        extractedAt: '2024-05-16T14:00:00Z',
        confidence: 'high',
        extractor: 'pipeline',
        notes: 'Public university standard annual tuition',
      },
      {
        field: 'admission_fee_jpy',
        value: 30_000,
        sourceUrl: 'https://www.tmu.ac.jp/english/admission/international/index.html',
        extractedAt: '2024-05-16T14:00:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'academic_year',
        value: '2024-2025',
        sourceUrl: 'https://www.tmu.ac.jp/english/admission/international/index.html',
        extractedAt: '2024-05-16T14:00:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'application_end_date',
        value: '2024-07-31',
        sourceUrl: 'https://www.tmu.ac.jp/english/admission/international/index.html',
        sourceLocation: 'Important Dates',
        extractedAt: '2024-05-16T14:00:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'interview_required',
        value: true,
        sourceUrl: 'https://www.tmu.ac.jp/english/admission/international/index.html',
        extractedAt: '2024-05-16T14:00:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
    ],
  },
];

export const tmuEntity: EnrichmentEntity = {
  id: 'univ_f113210102824:architecture:international-direct:2024-2025',
  universityId: 'univ_f113210102824',
  programNameJa: '工学府 (建築学専攻)',
  programNameEn: 'Graduate School of Engineering, Architecture',
  admissionRoute: 'international-direct-application',
  academicYear: '2024-2025',
  sources: tmuSources,
  facts: tmuSources[0]?.factsExtracted ?? [],
  validationIssues: [],
  status: 'identity_only',
  statusUpdatedAt: new Date().toISOString(),
  sourceRecordIds: ['src-mext-registry-2026-provisional', 'src-tmu-international'],
};

// ──────────────────────────────────────────────────────────────────────────────
// 3. AOYAMA GAKUIN UNIVERSITY (青山学院大学) — Private university
// ──────────────────────────────────────────────────────────────────────────────

export const aoyamaSources: EnrichmentSource[] = [
  {
    id: 'src-aoyama-gakuin-admissions',
    url: 'https://www.aoyama.ac.jp/en/admission/index.html',
    officialDomain: 'aoyama.ac.jp',
    sourceType: 'admissions',
    academicYear: '2024-2025',
    retrievedAt: '2024-05-14T11:45:00Z',
    publicationDate: '2024-03-01T00:00:00Z',
    contentHash: 'pqr456stu789',
    extractionStatus: 'success',
    notes: 'Undergraduate admissions for international students',
    factsExtracted: [
      {
        field: 'program_name_ja',
        value: '文学部 (英米文学科)',
        sourceUrl: 'https://www.aoyama.ac.jp/en/admission/index.html',
        extractedAt: '2024-05-14T11:45:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'program_name_en',
        value: 'Faculty of Literature, Department of English and American Literature',
        sourceUrl: 'https://www.aoyama.ac.jp/en/admission/index.html',
        extractedAt: '2024-05-14T11:45:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'jlpt_requirement',
        value: 'n2',
        sourceUrl: 'https://www.aoyama.ac.jp/en/admission/index.html',
        sourceLocation: 'Language Requirements',
        extractedAt: '2024-05-14T11:45:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'eju_required',
        value: true,
        sourceUrl: 'https://www.aoyama.ac.jp/en/admission/index.html',
        extractedAt: '2024-05-14T11:45:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'eju_subjects',
        value: 'Japanese, English, one subject',
        sourceUrl: 'https://www.aoyama.ac.jp/en/admission/index.html',
        extractedAt: '2024-05-14T11:45:00Z',
        confidence: 'medium',
        extractor: 'pipeline',
      },
      {
        field: 'tuition_jpy',
        value: 1_200_000,
        sourceUrl: 'https://www.aoyama.ac.jp/en/admission/index.html',
        sourceLocation: 'Fees > Annual Tuition',
        extractedAt: '2024-05-14T11:45:00Z',
        confidence: 'high',
        extractor: 'pipeline',
        notes: 'Private university; tuition for literature programs',
      },
      {
        field: 'admission_fee_jpy',
        value: 200_000,
        sourceUrl: 'https://www.aoyama.ac.jp/en/admission/index.html',
        extractedAt: '2024-05-14T11:45:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'other_first_year_fees_jpy',
        value: 350_000,
        sourceUrl: 'https://www.aoyama.ac.jp/en/admission/index.html',
        sourceLocation: 'Fees > Facility and Facility Maintenance',
        extractedAt: '2024-05-14T11:45:00Z',
        confidence: 'medium',
        extractor: 'pipeline',
        notes: 'Includes facility fee, student union fee, insurance',
      },
      {
        field: 'scholarship_reduction_available',
        value: true,
        sourceUrl: 'https://www.aoyama.ac.jp/en/admission/index.html',
        sourceLocation: 'Scholarships',
        extractedAt: '2024-05-14T11:45:00Z',
        confidence: 'high',
        extractor: 'pipeline',
        notes: 'Merit-based and need-based scholarships available',
      },
      {
        field: 'academic_year',
        value: '2024-2025',
        sourceUrl: 'https://www.aoyama.ac.jp/en/admission/index.html',
        extractedAt: '2024-05-14T11:45:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'application_end_date',
        value: '2024-11-30',
        sourceUrl: 'https://www.aoyama.ac.jp/en/admission/index.html',
        sourceLocation: 'Important Dates',
        extractedAt: '2024-05-14T11:45:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'interview_required',
        value: false,
        sourceUrl: 'https://www.aoyama.ac.jp/en/admission/index.html',
        extractedAt: '2024-05-14T11:45:00Z',
        confidence: 'medium',
        extractor: 'pipeline',
        notes: 'No interview for direct application; document screening only',
      },
    ],
  },
];

export const aoyamaEntity: EnrichmentEntity = {
  id: 'univ_f113310102920:literature:international-direct:2024-2025',
  universityId: 'univ_f113310102920',
  programNameJa: '文学部 (英米文学科)',
  programNameEn: 'Faculty of Literature, Department of English and American Literature',
  admissionRoute: 'international-direct-application',
  academicYear: '2024-2025',
  sources: aoyamaSources,
  facts: aoyamaSources[0]?.factsExtracted ?? [],
  validationIssues: [],
  status: 'identity_only',
  statusUpdatedAt: new Date().toISOString(),
  sourceRecordIds: ['src-mext-registry-2026-provisional', 'src-aoyama-gakuin-admissions'],
};

// Exported list for PoC.
export const POC_ENRICHED_ENTITIES: EnrichmentEntity[] = [tokyoUniEntity, tmuEntity, aoyamaEntity];
