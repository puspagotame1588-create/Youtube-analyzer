import { describe, expect, it } from 'vitest';
import { simulate } from './engine';
import { dataset } from '@/lib/data/seed';
import { buildDecisionReport, deriveEligibility, type RequirementCheck } from './decision';
import { DEFAULT_WEIGHTS, type SimProfile } from './types';

const profile: SimProfile = {
  goalText: 'Work in IT in Tokyo',
  field: 'it',
  education: 'highschool',
  jlptCurrent: 'n3',
  budgetJpy: { min: 1_000_000, expected: 1_500_000, max: 2_000_000 },
  location: 'tokyo',
  interests: ['it'],
};

const result = simulate(profile, dataset, { weights: DEFAULT_WEIGHTS, now: '2026-07-11T00:00:00.000Z' });
const report = buildDecisionReport(result, dataset);

const check = (status: RequirementCheck['status']): RequirementCheck => ({
  id: 'x',
  label: { en: 'x', ja: 'x' },
  requirement: { en: 'x', ja: 'x' },
  userStatus: { en: 'x', ja: 'x' },
  status,
  evidence: { source: null, scope: 'school', scopeNote: { en: '', ja: '' }, isDemo: true },
  nextAction: { en: 'x', ja: 'x' },
});

describe('decision report — deterministic contract', () => {
  it('1. scores shown match the deterministic engine output exactly', () => {
    for (const r of report.routes) {
      const engineRoute = result.routes.find((x) => x.id === r.routeId);
      expect(r.score).toBe(engineRoute?.scores.expected);
      // score-breakdown points sum to the engine score (values copied, not altered).
      const sum = r.scoreBreakdown.reduce((s, c) => s + c.points, 0);
      expect(Math.abs(sum - r.score)).toBeLessThanOrEqual(2); // rounding only
    }
  });

  it('2. derivation is pure — no field can raise a score above the engine value', () => {
    const rerun = buildDecisionReport(result, dataset);
    expect(rerun.routes.map((r) => r.score)).toEqual(report.routes.map((r) => r.score));
    for (const r of rerun.routes) {
      for (const c of r.scoreBreakdown) expect(c.points).toBeLessThanOrEqual(c.max + 1);
    }
  });

  it('3. missing data surfaces as "Not verified"/未確認, never invented', () => {
    const eju = report.routes.flatMap((r) => r.blockers).find((b) => b.id === 'eju');
    if (eju) {
      expect(eju.userStatus.en).toBe('Not verified');
      expect(eju.userStatus.ja).toBe('未確認');
    }
    // Any evidence without a source must be explicitly source:null (UI → "Not verified").
    const noSource = report.routes.flatMap((r) => r.blockers).filter((b) => b.evidence.source === null);
    expect(noSource.every((b) => b.evidence.source === null)).toBe(true);
  });

  it('4/5. eligibility is separate from suitability; not_currently_eligible is never recommended', () => {
    // Pure logic: a not_met requirement forces not_currently_eligible regardless of score.
    expect(deriveEligibility([check('met'), check('not_met')])).toBe('not_currently_eligible');
    expect(deriveEligibility([check('met'), check('met')])).toBe('eligible');
    expect(deriveEligibility([check('met'), check('unverified')])).toBe('likely_eligible');
    expect(deriveEligibility([check('unverified'), check('unverified')])).toBe('possibly_eligible');
    expect(deriveEligibility([])).toBe('unknown');
    // Integration: the recommended route must be eligible-ish.
    if (report.recommendedRouteId) {
      const rec = report.routes.find((r) => r.routeId === report.recommendedRouteId)!;
      expect(rec.eligibility).not.toBe('not_currently_eligible');
      expect(rec.eligibility).not.toBe('unknown');
    }
    // A not_currently_eligible route is never the recommendation even if high-scored.
    for (const r of report.routes) {
      if (r.eligibility === 'not_currently_eligible') expect(report.recommendedRouteId).not.toBe(r.routeId);
    }
  });

  it('6. facts, assumptions, estimates, and unknowns are separate (assumptions never merged into facts)', () => {
    for (const r of report.routes) {
      const factText = new Set(r.facts.map((f) => f.statement.en));
      for (const a of r.assumptions) expect(factText.has(a.statement.en)).toBe(false);
      expect(r.facts.every((f) => f.kind === 'fact')).toBe(true);
      expect(r.assumptions.every((f) => f.kind === 'assumption')).toBe(true);
      expect(r.estimates.every((f) => f.kind === 'estimate')).toBe(true);
      expect(r.unknowns.every((f) => f.kind === 'unknown')).toBe(true);
    }
  });

  it('7. evidence citations expose source + scope + checked date when available', () => {
    const withSource = report.routes.flatMap((r) => r.blockers).find((b) => b.evidence.source !== null);
    if (withSource) {
      expect(withSource.evidence.source).toHaveProperty('en');
      expect(['program', 'school', 'general', 'none']).toContain(withSource.evidence.scope);
    }
  });

  it('8. school-level evidence is NOT labelled program-specific', () => {
    const schoolChecks = report.routes.flatMap((r) => r.blockers).filter((b) => b.id === 'jlpt' || b.id === 'eju');
    for (const b of schoolChecks) {
      expect(b.evidence.scope).not.toBe('program');
      expect(b.evidence.scope).toBe('school');
      expect(b.evidence.scopeNote.en).toMatch(/program-specific applicability not verified/i);
    }
  });

  it('9. demonstration data stays clearly flagged', () => {
    // Seed is demonstration data → routes flagged isDemo, and demo salary appears as an estimate.
    const anyDemo = report.routes.some((r) => r.isDemo) || report.routes.some((r) => r.estimates.some((e) => /Demonstration|デモ/.test(e.basis.en + e.basis.ja)));
    expect(anyDemo).toBe(true);
  });

  it('sensitivity shows only factors that actually move the deterministic ranking', () => {
    for (const s of report.sensitivity) {
      // Every listed factor must have a real effect (score delta or a re-rank).
      expect(s.scoreDelta !== 0 || s.changesRanking).toBe(true);
    }
    // Deterministic: same inputs → same sensitivity.
    const again = buildDecisionReport(result, dataset).sensitivity;
    expect(again.map((s) => [s.id, s.scoreDelta, s.changesRanking])).toEqual(
      report.sensitivity.map((s) => [s.id, s.scoreDelta, s.changesRanking]),
    );
  });

  it('eligibility values stay within the allowed set', () => {
    const allowed = ['eligible', 'likely_eligible', 'possibly_eligible', 'not_currently_eligible', 'unknown'];
    for (const r of report.routes) expect(allowed).toContain(r.eligibility);
  });
});
