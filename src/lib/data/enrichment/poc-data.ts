/**
 * Proof-of-concept enrichment data for 3 Tokyo universities — hardened.
 *
 * ⚠️  SYNTHETIC FIXTURES — NEVER LEAK INTO PRODUCTION
 *
 * These entities demonstrate the hardened pipeline:
 * - All sources classified (official_university / official_government / untrusted)
 * - All facts have evidence locators (page/section/table row)
 * - All high-impact fields (JLPT, tuition, EJU) present
 * - All marked isSyntheticFixture: true → never decision_ready
 * - Excluded from production ranking/exports via filter
 *
 * When real sources are ingested, same pipeline + validation applies.
 */

import type { EnrichedFact, EnrichmentEntity, EnrichmentSource } from './types';

// ──────────────────────────────────────────────────────────────────────────────
// TOKYO UNIVERSITY (東京大学) — National, full and high-confidence
// ──────────────────────────────────────────────────────────────────────────────

export const tokyoUniSources: EnrichmentSource[] = [
  {
    id: 'src-tokyo-uni-intl-admissions',
    url: 'https://www.u-tokyo.ac.jp/en/admissions/undergraduate/index.html',
    officialDomain: 'u-tokyo.ac.jp',
    classification: 'official_university',
    sourceType: 'admissions-guide',
    academicYear: '2024-2025',
    retrievedAt: '2024-05-15T10:30:00Z',
    publicationDate: '2024-04-01T00:00:00Z',
    contentHash: 'abc123def456',
    extractionStatus: 'success',
    isSyntheticFixture: true,
    notes: 'Synthetic fixture for PoC; official page URL cited for reference only',
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
        sourceLocation: 'Program List, English Name Column',
        extractedAt: '2024-05-15T10:30:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'jlpt_requirement',
        value: 'n1',
        sourceUrl: 'https://www.u-tokyo.ac.jp/en/admissions/undergraduate/index.html',
        sourceLocation: 'Language Requirements Section, Table Row 1',
        extractedAt: '2024-05-15T10:30:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'eju_required',
        value: false,
        sourceUrl: 'https://www.u-tokyo.ac.jp/en/admissions/undergraduate/index.html',
        sourceLocation: 'Testing Requirements > EJU (Not Required)',
        extractedAt: '2024-05-15T10:30:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'tuition_jpy',
        value: 235_400,
        sourceUrl: 'https://www.u-tokyo.ac.jp/en/admissions/undergraduate/index.html',
        sourceLocation: 'Fees > Annual Tuition, National University Standard',
        extractedAt: '2024-05-15T10:30:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'admission_fee_jpy',
        value: 17_000,
        sourceUrl: 'https://www.u-tokyo.ac.jp/en/admissions/undergraduate/index.html',
        sourceLocation: 'Fees > Admission Fee',
        extractedAt: '2024-05-15T10:30:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'academic_year',
        value: '2024-2025',
        sourceUrl: 'https://www.u-tokyo.ac.jp/en/admissions/undergraduate/index.html',
        sourceLocation: 'Document Header, Academic Year 2024-2025',
        extractedAt: '2024-05-15T10:30:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'application_end_date',
        value: '2024-12-10',
        sourceUrl: 'https://www.u-tokyo.ac.jp/en/admissions/undergraduate/index.html',
        sourceLocation: 'Important Dates > Application Deadline',
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
  isSyntheticFixture: true,
  sourceRecordIds: ['src-mext-registry-2026-provisional', 'src-tokyo-uni-intl-admissions'],
};

// ──────────────────────────────────────────────────────────────────────────────
// TOKYO METROPOLITAN UNIVERSITY (東京都立大学) — Public, medium-confidence
// ──────────────────────────────────────────────────────────────────────────────

export const tmuSources: EnrichmentSource[] = [
  {
    id: 'src-tmu-international',
    url: 'https://www.tmu.ac.jp/english/admission/international/index.html',
    officialDomain: 'tmu.ac.jp',
    classification: 'official_university',
    sourceType: 'international-admissions',
    academicYear: '2024-2025',
    retrievedAt: '2024-05-16T14:00:00Z',
    publicationDate: '2024-03-15T00:00:00Z',
    contentHash: 'xyz789uvw012',
    extractionStatus: 'success',
    isSyntheticFixture: true,
    notes: 'Synthetic fixture; medium-confidence extraction due to program specialty parsing ambiguity',
    factsExtracted: [
      {
        field: 'program_name_ja',
        value: '工学府 (建築学専攻)',
        sourceUrl: 'https://www.tmu.ac.jp/english/admission/international/index.html',
        sourceLocation: 'Graduate Programs > Engineering > Architecture Specialty',
        extractedAt: '2024-05-16T14:00:00Z',
        confidence: 'medium',
        extractor: 'pipeline',
      },
      {
        field: 'program_name_en',
        value: 'Graduate School of Engineering, Architecture',
        sourceUrl: 'https://www.tmu.ac.jp/english/admission/international/index.html',
        sourceLocation: 'Program Name, English Translation',
        extractedAt: '2024-05-16T14:00:00Z',
        confidence: 'medium',
        extractor: 'pipeline',
      },
      {
        field: 'jlpt_requirement',
        value: 'n3',
        sourceUrl: 'https://www.tmu.ac.jp/english/admission/international/index.html',
        sourceLocation: 'Language Requirements > JLPT N3 or higher',
        extractedAt: '2024-05-16T14:00:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'eju_required',
        value: true,
        sourceUrl: 'https://www.tmu.ac.jp/english/admission/international/index.html',
        sourceLocation: 'Testing Requirements > EJU Required',
        extractedAt: '2024-05-16T14:00:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'tuition_jpy',
        value: 390_000,
        sourceUrl: 'https://www.tmu.ac.jp/english/admission/international/index.html',
        sourceLocation: 'Fees > Annual Tuition, Public University',
        extractedAt: '2024-05-16T14:00:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'admission_fee_jpy',
        value: 30_000,
        sourceUrl: 'https://www.tmu.ac.jp/english/admission/international/index.html',
        sourceLocation: 'Fees > Admission Fee Table',
        extractedAt: '2024-05-16T14:00:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'academic_year',
        value: '2024-2025',
        sourceUrl: 'https://www.tmu.ac.jp/english/admission/international/index.html',
        sourceLocation: 'Document Date, 2024-2025 Academic Year',
        extractedAt: '2024-05-16T14:00:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'application_end_date',
        value: '2024-07-31',
        sourceUrl: 'https://www.tmu.ac.jp/english/admission/international/index.html',
        sourceLocation: 'Important Dates > Application Deadline',
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
  isSyntheticFixture: true,
  sourceRecordIds: ['src-mext-registry-2026-provisional', 'src-tmu-international'],
};

// ──────────────────────────────────────────────────────────────────────────────
// AOYAMA GAKUIN UNIVERSITY (青山学院大学) — Private, high-confidence complete
// ──────────────────────────────────────────────────────────────────────────────

export const aoyamaSources: EnrichmentSource[] = [
  {
    id: 'src-aoyama-gakuin-admissions',
    url: 'https://www.aoyama.ac.jp/en/admission/index.html',
    officialDomain: 'aoyama.ac.jp',
    classification: 'official_university',
    sourceType: 'admissions',
    academicYear: '2024-2025',
    retrievedAt: '2024-05-14T11:45:00Z',
    publicationDate: '2024-03-01T00:00:00Z',
    contentHash: 'pqr456stu789',
    extractionStatus: 'success',
    isSyntheticFixture: true,
    notes: 'Synthetic fixture for PoC demonstration',
    factsExtracted: [
      {
        field: 'program_name_ja',
        value: '文学部 (英米文学科)',
        sourceUrl: 'https://www.aoyama.ac.jp/en/admission/index.html',
        sourceLocation: 'Undergraduate Programs > Faculty of Literature > English & American Literature',
        extractedAt: '2024-05-14T11:45:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'program_name_en',
        value: 'Faculty of Literature, Department of English and American Literature',
        sourceUrl: 'https://www.aoyama.ac.jp/en/admission/index.html',
        sourceLocation: 'Program List, English Name',
        extractedAt: '2024-05-14T11:45:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'jlpt_requirement',
        value: 'n2',
        sourceUrl: 'https://www.aoyama.ac.jp/en/admission/index.html',
        sourceLocation: 'Language Requirements > JLPT N2',
        extractedAt: '2024-05-14T11:45:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'eju_required',
        value: true,
        sourceUrl: 'https://www.aoyama.ac.jp/en/admission/index.html',
        sourceLocation: 'Testing Requirements > EJU Required, 3 Subjects',
        extractedAt: '2024-05-14T11:45:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'tuition_jpy',
        value: 1_200_000,
        sourceUrl: 'https://www.aoyama.ac.jp/en/admission/index.html',
        sourceLocation: 'Fees > Annual Tuition, Private University',
        extractedAt: '2024-05-14T11:45:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'admission_fee_jpy',
        value: 200_000,
        sourceUrl: 'https://www.aoyama.ac.jp/en/admission/index.html',
        sourceLocation: 'Fees > Admission Fee',
        extractedAt: '2024-05-14T11:45:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'academic_year',
        value: '2024-2025',
        sourceUrl: 'https://www.aoyama.ac.jp/en/admission/index.html',
        sourceLocation: 'Document Header, 2024-2025 Academic Year',
        extractedAt: '2024-05-14T11:45:00Z',
        confidence: 'high',
        extractor: 'pipeline',
      },
      {
        field: 'application_end_date',
        value: '2024-11-30',
        sourceUrl: 'https://www.aoyama.ac.jp/en/admission/index.html',
        sourceLocation: 'Important Dates > Application Deadline',
        extractedAt: '2024-05-14T11:45:00Z',
        confidence: 'high',
        extractor: 'pipeline',
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
  isSyntheticFixture: true,
  sourceRecordIds: ['src-mext-registry-2026-provisional', 'src-aoyama-gakuin-admissions'],
};

export const POC_ENRICHED_ENTITIES: EnrichmentEntity[] = [tokyoUniEntity, tmuEntity, aoyamaEntity];
