import { describe, expect, it } from 'vitest';
import {
  retrieveScholarshipClaims,
  getScholarshipClaim,
  claimsForProgram,
  unverifiableClaims,
  scholarshipCorpusStats,
  PRODUCTION_STATUS,
  VERIFICATION_DATE,
} from './index';

describe('scholarship claim corpus', () => {
  it('compiles every audited row from the report', () => {
    const s = scholarshipCorpusStats();
    // The report's own summary: 72 PASS, 0 MISMATCH, 8 UNCONFIRMED across 5 programs.
    expect(s.total).toBe(80);
    expect(s.confirmed).toBe(72);
    expect(s.unverifiable).toBe(8);
    expect(s.programs).toBe(5);
    expect(VERIFICATION_DATE).toBe('2026-08-01');
    expect(PRODUCTION_STATUS).toBe('NOT READY FOR PRODUCTION');
  });

  it('gives every claim an official source URL', () => {
    for (const c of [...claimsForProgram('jasso'), ...claimsForProgram('kyoritsu')]) {
      expect(c.sourceUrls.length).toBeGreaterThan(0);
      for (const u of c.sourceUrls) expect(u).toMatch(/^https:\/\//);
    }
  });

  it('carries the exact supporting excerpt, not a paraphrase', () => {
    // J-10: the amount claim must still quote the official figures.
    const j10 = getScholarshipClaim('J-10');
    expect(j10?.excerpt).toContain('48,000');
    expect(j10?.excerpt).toContain('30,000');
  });
});

describe('retrieval keeps unverifiable claims out of the fact list', () => {
  it('never returns an UNCONFIRMED claim among confirmed claims', () => {
    for (const q of ['deadline', 'JASSO deadline', 'Kyoritsu visa', 'language', '締切', '']) {
      const r = retrieveScholarshipClaims(q, { limit: 50 });
      for (const c of r.claims) expect(c.verdict).not.toBe('UNCONFIRMED');
    }
  });

  it('surfaces the JASSO deadline as unverifiable rather than answering it', () => {
    const r = retrieveScholarshipClaims('JASSO application deadline', { programs: ['jasso'] });
    const ids = r.unverifiable.map((c) => c.id);
    expect(ids).toContain('J-14');
    expect(r.claims.map((c) => c.id)).not.toContain('J-14');
  });

  it('reports every Kyoritsu field the audit could not confirm', () => {
    const r = retrieveScholarshipClaims('Kyoritsu', { programs: ['kyoritsu'], limit: 50 });
    const ids = r.unverifiable.map((c) => c.id).sort();
    expect(ids).toEqual(['K-08', 'K-09', 'K-10', 'K-11', 'K-12', 'K-13', 'K-14']);
  });

  it('can suppress unverifiable claims entirely, but never promotes them', () => {
    const r = retrieveScholarshipClaims('deadline', { includeUnverifiable: false, limit: 50 });
    expect(r.unverifiable).toHaveLength(0);
    for (const c of r.claims) expect(c.verdict).not.toBe('UNCONFIRMED');
  });

  it('exposes all eight unverifiable fields across the corpus', () => {
    const all = unverifiableClaims();
    expect(all).toHaveLength(8);
    expect(all.filter((c) => c.program === 'jasso')).toHaveLength(1);
    expect(all.filter((c) => c.program === 'kyoritsu')).toHaveLength(7);
  });
});

describe('retrieval ranking and citation', () => {
  it('finds the JLPT/EJU language requirement for JASSO', () => {
    const r = retrieveScholarshipClaims('JLPT EJU language requirement', { programs: ['jasso'] });
    expect(r.claims.map((c) => c.id)).toContain('J-04');
  });

  it('finds monthly amounts by keyword', () => {
    const r = retrieveScholarshipClaims('monthly amount', { limit: 20 });
    const ids = r.claims.map((c) => c.id);
    expect(ids.some((id) => ['J-10', 'M-07', 'M-08', 'R-09', 'S-06'].includes(id))).toBe(true);
  });

  it('matches a Japanese query against the official excerpt', () => {
    const r = retrieveScholarshipClaims('在留資格', { limit: 20 });
    expect(r.claims.length).toBeGreaterThan(0);
    for (const c of r.claims) {
      expect(`${c.excerpt}${c.statement}`).toMatch(/在留資格|residence status/i);
    }
  });

  it('resolves an audit id directly', () => {
    const r = retrieveScholarshipClaims('R-11');
    expect(r.claims[0]?.id).toBe('R-11');
    // R-11 is the closed-round finding that corrected verified.ts.
    expect(r.claims[0]?.excerpt).toContain('受付を終了しました');
  });

  it('attaches the audit gate and scope warning to every result', () => {
    const r = retrieveScholarshipClaims('MEXT scholarship amount', { programs: ['mext'] });
    const mext = r.programs.find((p) => p.key === 'mext');
    expect(mext?.gate?.pass).toBe(20);
    // The MEXT PASS results only cover two 2027 embassy-recommendation categories.
    expect(mext?.scopeWarning).toMatch(/2027/);
    expect(r.productionStatus).toBe('NOT READY FOR PRODUCTION');
  });

  it('honours the program filter', () => {
    const r = retrieveScholarshipClaims('scholarship', { programs: ['satoyo'], limit: 50 });
    for (const c of [...r.claims, ...r.unverifiable]) expect(c.program).toBe('satoyo');
  });
});
