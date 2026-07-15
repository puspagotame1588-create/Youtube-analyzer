import type { SourceRecord } from '@/lib/data/types';
import {
  RAW_UNIVERSITY_RECORDS,
  REGISTRY_RELEASE_DATE,
  REGISTRY_RETRIEVED_AT,
  type RawUniversityRecord,
} from './registry.generated';
import {
  ENRICHMENT_FIELDS,
  type EnrichmentField,
  type EnrichmentStatus,
  type EstablishmentCategory,
  type RegistryMeta,
  type UniversityRecord,
  type UniversityRegistry,
} from './types';

/**
 * The single official source backing every registry record's identity. All 825
 * records cite the same MEXT school-code CSV, so one SourceRecord is correct.
 */
export const MEXT_REGISTRY_SOURCE: SourceRecord = {
  id: 'src-mext-registry-2026-provisional',
  nameEn: 'MEXT school-code registry (2026-05-01 provisional)',
  nameJa: '文部科学省 学校コード（令和8年5月1日時点・暫定版）',
  url: 'https://www.mext.go.jp/content/20260529-mxt_chousa01-000011635_6.csv',
  type: 'government',
  retrievedAt: REGISTRY_RETRIEVED_AT,
  reviewer: 'registry-import',
  notes:
    'Provisional MEXT release. Provides institutional identity only (name, type, ' +
    'establishment, location). Admissions, tuition, programs, scholarships, and career ' +
    'outcomes are not enriched from this source and are surfaced as "not verified".',
};

/** Human-readable label for each not-yet-enriched field family. */
const ENRICHMENT_NOTES: Record<EnrichmentField, { en: string; ja: string }> = {
  admissions: {
    en: 'Admission requirements (JLPT/EJU, routes, deadlines) not verified from an official source.',
    ja: '入学要件（JLPT/EJU・入試方式・出願期間）は公式ソースで未確認です。',
  },
  costs: {
    en: 'Tuition and fees not verified from an official source.',
    ja: '学費・納付金は公式ソースで未確認です。',
  },
  programs: {
    en: 'Faculties and programs not verified from an official source.',
    ja: '学部・学科・課程は公式ソースで未確認です。',
  },
  scholarships: {
    en: 'Scholarship information not verified from an official source.',
    ja: '奨学金情報は公式ソースで未確認です。',
  },
  international: {
    en: 'International-student support not verified from an official source.',
    ja: '留学生サポートは公式ソースで未確認です。',
  },
  careers: {
    en: 'Employment and career outcomes not verified from an official source.',
    ja: '就職・進路実績は公式ソースで未確認です。',
  },
};

function enrichmentGaps(): Record<EnrichmentField, EnrichmentStatus> {
  const out = {} as Record<EnrichmentField, EnrichmentStatus>;
  for (const f of ENRICHMENT_FIELDS) {
    out[f] = {
      verified: false,
      reason: 'not_started',
      noteEn: ENRICHMENT_NOTES[f].en,
      noteJa: ENRICHMENT_NOTES[f].ja,
    };
  }
  return out;
}

function toRecord(raw: RawUniversityRecord): UniversityRecord {
  return {
    id: raw.id,
    mextSchoolCode: raw.mextSchoolCode,
    nameJa: raw.nameJa,
    nameEn: raw.nameEn,
    normalizedNameJa: raw.normalizedNameJa,
    sector: raw.sector,
    prefectureCode: raw.prefectureCode,
    prefectureJa: raw.prefectureJa,
    municipalityJa: raw.municipalityJa,
    addressJa: raw.addressJa,
    postalCode: raw.postalCode,
    officialWebsiteUrl: raw.officialWebsiteUrl,
    verification: 'verified_registry_identity',
    provisional: true,
    enrichment: enrichmentGaps(),
    sourceId: MEXT_REGISTRY_SOURCE.id,
  };
}

const RECORDS: UniversityRecord[] = RAW_UNIVERSITY_RECORDS.map(toRecord);

export const REGISTRY_META: RegistryMeta = {
  edition: '2026-provisional',
  provisional: true,
  releaseDate: REGISTRY_RELEASE_DATE,
  retrievedAt: REGISTRY_RETRIEVED_AT,
  sourceId: MEXT_REGISTRY_SOURCE.id,
  activeUniversities: RECORDS.length,
};

export const universityRegistry: UniversityRegistry = {
  meta: REGISTRY_META,
  source: MEXT_REGISTRY_SOURCE,
  records: RECORDS,
};

// ── Lookups & search ─────────────────────────────────────────────────────────

const BY_ID = new Map(RECORDS.map((r) => [r.id, r]));
const BY_CODE = new Map(RECORDS.map((r) => [r.mextSchoolCode, r]));

export function getUniversityById(id: string): UniversityRecord | undefined {
  return BY_ID.get(id);
}

export function getUniversityByMextCode(code: string): UniversityRecord | undefined {
  return BY_CODE.get(code);
}

/** NFKC + whitespace-stripped key, matching how the registry normalizes names. */
function normalizeQuery(q: string): string {
  return q.normalize('NFKC').replace(/\s+/g, '');
}

export interface RegistrySearchOptions {
  sector?: EstablishmentCategory;
  prefectureJa?: string;
  limit?: number;
}

/**
 * Substring search over Japanese / English / normalized names. Returns verified
 * identity records only — it never fabricates the enrichment fields the caller may
 * want; those remain explicit "not verified" gaps on each record.
 */
export function searchUniversities(
  query: string,
  opts: RegistrySearchOptions = {},
): UniversityRecord[] {
  const nq = normalizeQuery(query);
  const results = RECORDS.filter((r) => {
    if (opts.sector && r.sector !== opts.sector) return false;
    if (opts.prefectureJa && r.prefectureJa !== opts.prefectureJa) return false;
    if (nq === '') return true;
    return (
      r.normalizedNameJa.includes(nq) ||
      normalizeQuery(r.nameJa).includes(nq) ||
      (r.nameEn ? normalizeQuery(r.nameEn).toLowerCase().includes(nq.toLowerCase()) : false)
    );
  });
  return typeof opts.limit === 'number' ? results.slice(0, opts.limit) : results;
}

export function universitiesByPrefecture(prefectureJa: string): UniversityRecord[] {
  return RECORDS.filter((r) => r.prefectureJa === prefectureJa);
}

export interface RegistryRetrieval {
  records: UniversityRecord[];
  /** The official source every returned record cites. */
  source: SourceRecord;
  provisional: boolean;
  /** Enrichment families that remain unverified for the whole registry phase. */
  unverifiedFields: EnrichmentField[];
}

/**
 * RAG retrieval entry point for the registry. Returns matched universities with
 * their single official citation and an explicit list of the fields that are NOT
 * verified — so a caller (or the AI explanation layer) can cite real institutions
 * without ever presenting unverified eligibility, cost, or program data as fact.
 */
export function retrieveUniversities(
  query: string,
  opts: RegistrySearchOptions = {},
): RegistryRetrieval {
  return {
    records: searchUniversities(query, opts),
    source: MEXT_REGISTRY_SOURCE,
    provisional: true,
    unverifiedFields: [...ENRICHMENT_FIELDS],
  };
}

export type { UniversityRecord, UniversityRegistry, RegistryMeta } from './types';
