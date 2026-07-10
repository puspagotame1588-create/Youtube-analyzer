import { describe, expect, it } from 'vitest';
import { simulate, pickSchool, languageGapMonths, careerForField } from './engine';
import { dataset } from '@/lib/data/seed';
import { DEFAULT_WEIGHTS, type SimProfile } from './types';

const baseProfile: SimProfile = {
  goalText: 'I want to work in IT in Tokyo',
  field: 'it',
  education: 'highschool',
  jlptCurrent: 'n3',
  budgetJpy: { min: 1_000_000, expected: 1_500_000, max: 2_000_000 },
  location: 'tokyo',
  interests: ['it'],
};

describe('simulate', () => {
  it('is deterministic: same input → same output', () => {
    const now = '2026-07-01T00:00:00.000Z';
    const a = simulate(baseProfile, dataset, { now });
    const b = simulate(baseProfile, dataset, { now });
    expect(a).toEqual(b);
  });

  it('produces university, vocational and employment routes for IT', () => {
    const result = simulate(baseProfile, dataset);
    const kinds = result.routes.map((r) => r.kind).sort();
    expect(kinds).toEqual(['employment', 'university', 'vocational']);
  });

  it('assigns each label exactly once', () => {
    const result = simulate(baseProfile, dataset);
    const labels = result.routes.flatMap((r) => r.labels);
    for (const l of ['best-overall', 'safest', 'fastest', 'long-term']) {
      expect(labels.filter((x) => x === l)).toHaveLength(1);
    }
  });

  it('routes are sorted by expected score descending', () => {
    const result = simulate(baseProfile, dataset);
    const scores = result.routes.map((r) => r.scores.expected);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('close-call flag matches the score gap and margin', () => {
    const result = simulate(baseProfile, dataset);
    const [first, second] = result.routes;
    expect(result.closeCall).toBe(
      (first?.scores.expected ?? 0) - (second?.scores.expected ?? 0) <= result.closeCallMargin,
    );
  });

  it('a larger budget never lowers any route score', () => {
    const small = simulate(baseProfile, dataset);
    const big = simulate(
      { ...baseProfile, budgetJpy: { min: 4_000_000, expected: 5_000_000, max: 6_000_000 } },
      dataset,
    );
    for (const route of big.routes) {
      const before = small.routes.find((r) => r.id === route.id);
      expect(route.scores.expected).toBeGreaterThanOrEqual(before?.scores.expected ?? 0);
    }
  });

  it('higher JLPT never lowers employment feasibility', () => {
    const low = simulate({ ...baseProfile, jlptCurrent: 'n5' }, dataset);
    const high = simulate({ ...baseProfile, jlptCurrent: 'n1' }, dataset);
    for (const route of high.routes) {
      const before = low.routes.find((r) => r.id === route.id);
      const empHigh = route.breakdown.find((f) => f.factor === 'employment')?.score ?? 0;
      const empLow = before?.breakdown.find((f) => f.factor === 'employment')?.score ?? 0;
      expect(empHigh).toBeGreaterThanOrEqual(empLow);
    }
  });

  it('conservative score is never above optimistic score', () => {
    const result = simulate(baseProfile, dataset);
    for (const r of result.routes) {
      expect(r.scores.conservative).toBeLessThanOrEqual(r.scores.optimistic);
    }
  });

  it('every route carries provenance surface: sources, freshness, assumptions, visa note', () => {
    const result = simulate(baseProfile, dataset);
    for (const r of result.routes) {
      expect(r.sourceIds.length).toBeGreaterThan(0);
      expect(r.dataFreshness).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.assumptions.length).toBeGreaterThan(0);
      expect(r.visaNote.en).toContain('individual circumstances');
      expect(r.visaNote.ja).toContain('個別');
    }
  });

  it('milestones are chronologically ordered and include a settlement stage', () => {
    const result = simulate(baseProfile, dataset);
    for (const r of result.routes) {
      const offsets = r.milestones.map((m) => m.monthOffset);
      expect(offsets).toEqual([...offsets].sort((a, b) => a - b));
      expect(r.milestones.some((m) => m.kind === 'settlement')).toBe(true);
      expect(r.milestones.some((m) => m.kind === 'visa-transition')).toBe(true);
    }
  });

  it('demo-only data yields weak evidence, never strong', () => {
    const result = simulate(baseProfile, dataset);
    for (const r of result.routes) {
      expect(r.evidence).not.toBe('strong');
    }
  });

  it('weights renormalize when user adjusts priorities', () => {
    const result = simulate(baseProfile, dataset, {
      weights: { ...DEFAULT_WEIGHTS, affordability: 60 },
    });
    for (const r of result.routes) {
      const totalWeight = r.breakdown.reduce((s, f) => s + f.weight, 0);
      expect(totalWeight).toBeCloseTo(100, 5);
    }
  });
});

describe('pickSchool', () => {
  it('prefers schools within budget', () => {
    const school = pickSchool(dataset, 'university', {
      ...baseProfile,
      field: 'business',
      budgetJpy: { min: 3_000_000, expected: 4_000_000, max: 4_500_000 },
    });
    expect(school).toBeDefined();
    expect(school?.fields).toContain('business');
  });

  it('returns undefined when no school covers the field', () => {
    const school = pickSchool(
      { ...dataset, schools: dataset.schools.filter((s) => !s.fields.includes('it')) },
      'university',
      baseProfile,
    );
    expect(school).toBeUndefined();
  });
});

describe('languageGapMonths', () => {
  it('is zero when the requirement is already met', () => {
    expect(languageGapMonths(baseProfile, 'n3')).toBe(0);
  });
  it('counts ~6 months per missing level', () => {
    expect(languageGapMonths({ ...baseProfile, jlptCurrent: 'n5' }, 'n3')).toBe(12);
  });
  it('counts an expected upcoming result', () => {
    expect(languageGapMonths({ ...baseProfile, jlptCurrent: 'n3', jlptExpected: 'n2' }, 'n2')).toBe(0);
  });
});

describe('careerForField', () => {
  it('maps every seeded field to a career profile', () => {
    for (const field of ['business', 'it', 'hospitality', 'foodservice', 'realestate'] as const) {
      expect(careerForField(dataset, field).field).toBe(field);
    }
  });
});
