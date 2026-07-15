import { describe, expect, it } from 'vitest';
import {
  MEXT_REGISTRY_SOURCE,
  REGISTRY_META,
  getUniversityByMextCode,
  retrieveUniversities,
  searchUniversities,
  universitiesByPrefecture,
  universityRegistry,
} from './index';
import { ENRICHMENT_FIELDS } from './types';
import { dataset } from '@/lib/data/seed';

describe('verified university registry — honest, identity-only', () => {
  it('loads the 825 active MEXT F1 universities', () => {
    expect(universityRegistry.records.length).toBe(825);
    expect(REGISTRY_META.activeUniversities).toBe(825);
    // Establishment split matches the source coverage report exactly.
    const by = (s: string) => universityRegistry.records.filter((r) => r.sector === s).length;
    expect(by('national')).toBe(85);
    expect(by('public')).toBe(104);
    expect(by('private')).toBe(636);
  });

  it('every record cites the single official MEXT source', () => {
    for (const r of universityRegistry.records) {
      expect(r.sourceId).toBe(MEXT_REGISTRY_SOURCE.id);
    }
    expect(MEXT_REGISTRY_SOURCE.type).toBe('government');
    expect(MEXT_REGISTRY_SOURCE.url).toContain('mext.go.jp');
    expect(MEXT_REGISTRY_SOURCE.retrievedAt).toBe('2026-05-29');
    // The source is also citable from the app dataset.
    expect(dataset.sources.some((s) => s.id === MEXT_REGISTRY_SOURCE.id)).toBe(true);
  });

  it('marks the release provisional and never claims final', () => {
    expect(REGISTRY_META.provisional).toBe(true);
    expect(REGISTRY_META.edition).toBe('2026-provisional');
    expect(universityRegistry.records.every((r) => r.provisional === true)).toBe(true);
    expect(universityRegistry.records.every((r) => r.verification === 'verified_registry_identity')).toBe(true);
  });

  it('surfaces every enrichment family as explicitly NOT verified (never invented)', () => {
    for (const r of universityRegistry.records) {
      for (const f of ENRICHMENT_FIELDS) {
        const e = r.enrichment[f];
        expect(e.verified).toBe(false);
        expect(e.reason).toBe('not_started');
        expect(e.noteEn.length).toBeGreaterThan(0);
        expect(e.noteJa.length).toBeGreaterThan(0);
      }
    }
  });

  it('never invents an English name or website absent from the canonical file', () => {
    // The MEXT file supplies neither; both must be null, not a guess.
    expect(universityRegistry.records.every((r) => r.nameEn === null)).toBe(true);
    expect(universityRegistry.records.every((r) => r.officialWebsiteUrl === null)).toBe(true);
  });

  it('keeps the identity fields it does have, for every record', () => {
    for (const r of universityRegistry.records) {
      expect(r.id).toMatch(/^univ_/);
      expect(r.mextSchoolCode.length).toBeGreaterThan(0);
      expect(r.nameJa.length).toBeGreaterThan(0);
      expect(r.prefectureJa.length).toBeGreaterThan(0);
      expect(['national', 'public', 'private']).toContain(r.sector);
    }
    // Ids are unique.
    expect(new Set(universityRegistry.records.map((r) => r.id)).size).toBe(825);
  });

  it('covers all 47 prefectures, with Tokyo the largest', () => {
    const prefs = new Set(universityRegistry.records.map((r) => r.prefectureJa));
    expect(prefs.size).toBe(47);
    expect(universitiesByPrefecture('東京都').length).toBe(148);
  });

  it('search finds a known national university by Japanese name', () => {
    const hits = searchUniversities('北海道大学');
    const hokudai = hits.find((r) => r.nameJa === '北海道大学');
    expect(hokudai).toBeDefined();
    expect(hokudai?.sector).toBe('national');
    expect(getUniversityByMextCode(hokudai!.mextSchoolCode)?.id).toBe(hokudai!.id);
  });

  it('search filters honour sector and prefecture', () => {
    const tokyoPrivate = searchUniversities('', { prefectureJa: '東京都', sector: 'private' });
    expect(tokyoPrivate.length).toBeGreaterThan(0);
    expect(tokyoPrivate.every((r) => r.prefectureJa === '東京都' && r.sector === 'private')).toBe(true);
  });

  it('retrieval bundles the citation and the unverified-field list for RAG use', () => {
    const out = retrieveUniversities('大学', { prefectureJa: '大阪府', limit: 5 });
    expect(out.records.length).toBeLessThanOrEqual(5);
    expect(out.source.id).toBe(MEXT_REGISTRY_SOURCE.id);
    expect(out.provisional).toBe(true);
    expect(out.unverifiedFields).toEqual([...ENRICHMENT_FIELDS]);
  });
});
