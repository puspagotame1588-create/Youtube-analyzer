import { describe, expect, it } from 'vitest';
import {
  normalizeWeights,
  scoreAffordability,
  scoreEmployment,
  scoreLocation,
  scoreSettlement,
  scoreVisa,
  effectiveJlpt,
} from './scoring';
import { careerForField } from './engine';
import { dataset } from '@/lib/data/seed';
import { DEFAULT_WEIGHTS, type SimProfile } from './types';

const it_ = careerForField(dataset, 'it');
const food = careerForField(dataset, 'foodservice');

describe('scoreAffordability', () => {
  it('caps at 100 when budget covers cost', () => {
    expect(scoreAffordability(3_000_000, 2_000_000)).toBe(100);
  });
  it('scales linearly below the cost', () => {
    expect(scoreAffordability(1_000_000, 2_000_000)).toBe(50);
  });
  it('is 100 for zero-cost routes', () => {
    expect(scoreAffordability(0, 0)).toBe(100);
  });
});

describe('scoreVisa', () => {
  it('study routes score high when the career supports the pathway', () => {
    expect(scoreVisa('university', it_, 'highschool')).toBeGreaterThanOrEqual(85);
    expect(scoreVisa('vocational', it_, 'highschool')).toBeGreaterThanOrEqual(80);
  });
  it('direct employment without a degree is low for degree-gated fields', () => {
    expect(scoreVisa('employment', it_, 'highschool')).toBeLessThanOrEqual(30);
  });
  it('a prior bachelor raises direct-employment feasibility', () => {
    expect(scoreVisa('employment', it_, 'bachelor')).toBeGreaterThan(
      scoreVisa('employment', it_, 'highschool'),
    );
  });
  it('direct-pathway fields (food service) are viable without a degree', () => {
    expect(scoreVisa('employment', food, 'highschool')).toBeGreaterThanOrEqual(60);
  });
});

describe('scoreEmployment', () => {
  it('penalizes a JLPT gap at job-hunting time', () => {
    expect(scoreEmployment(it_, 'none', 'employment')).toBeLessThan(
      scoreEmployment(it_, 'n2', 'employment'),
    );
  });
  it('study routes model language growth', () => {
    expect(scoreEmployment(it_, 'n5', 'university')).toBeGreaterThanOrEqual(
      scoreEmployment(it_, 'n5', 'employment'),
    );
  });
});

describe('scoreLocation', () => {
  it('exact match = 100, flexible = 85, other Kanto = 70', () => {
    expect(scoreLocation('tokyo', 'tokyo')).toBe(100);
    expect(scoreLocation('kanto-any', 'tokyo')).toBe(85);
    expect(scoreLocation('saitama', 'tokyo')).toBe(70);
  });
});

describe('scoreSettlement', () => {
  it('orders university ≥ vocational ≥ direct employment for the same career', () => {
    const u = scoreSettlement('university', it_);
    const v = scoreSettlement('vocational', it_);
    const e = scoreSettlement('employment', it_);
    expect(u).toBeGreaterThanOrEqual(v);
    expect(v).toBeGreaterThanOrEqual(e);
  });
});

describe('normalizeWeights', () => {
  it('sums to 100 after adjustment', () => {
    const w = normalizeWeights({ ...DEFAULT_WEIGHTS, affordability: 80 });
    expect(Object.values(w).reduce((a, b) => a + b, 0)).toBeCloseTo(100, 5);
  });
});

describe('effectiveJlpt', () => {
  const p: SimProfile = {
    goalText: '',
    field: 'it',
    education: 'highschool',
    jlptCurrent: 'n3',
    jlptExpected: 'n2',
    budgetJpy: { min: 0, expected: 0, max: 0 },
    location: 'tokyo',
    interests: [],
  };
  it('conservative case ignores the expected result', () => {
    expect(effectiveJlpt(p, 'conservative')).toBe('n3');
  });
  it('expected/optimistic cases count the expected result', () => {
    expect(effectiveJlpt(p, 'expected')).toBe('n2');
    expect(effectiveJlpt(p, 'optimistic')).toBe('n2');
  });
});
