/**
 * Factor scoring rules. Every rule is explicit and documented so results can be
 * explained ("Why this result?") and unit-tested. All scores are 0–100.
 */

import type { CareerProfile, School } from '@/lib/data/types';
import {
  JLPT_ORDER,
  type CaseName,
  type FactorScore,
  type FactorWeights,
  type JlptLevel,
  type LocationId,
  type RouteKind,
  type SimProfile,
  type UncertainNumber,
} from './types';

const clamp = (v: number, min = 0, max = 100): number => Math.min(max, Math.max(min, v));

export const pickCase = (u: UncertainNumber, c: CaseName): number =>
  c === 'conservative' ? u.min : c === 'optimistic' ? u.max : u.expected;

/** JLPT level used for scoring: expected result counts in optimistic/expected cases. */
export const effectiveJlpt = (profile: SimProfile, c: CaseName): JlptLevel => {
  if (c === 'conservative' || !profile.jlptExpected) return profile.jlptCurrent;
  return JLPT_ORDER[profile.jlptExpected] > JLPT_ORDER[profile.jlptCurrent]
    ? profile.jlptExpected
    : profile.jlptCurrent;
};

/**
 * Affordability: budget vs. total route cost.
 * 100 when budget covers the full cost; scales down linearly; part-time income
 * (within the conditions of the student work permission, typically up to 28h/week) is assumed to cover living costs only, so
 * the education budget is compared against education cost alone.
 */
export function scoreAffordability(budget: number, totalEducationCost: number): number {
  if (totalEducationCost <= 0) return 100;
  return clamp(Math.round((budget / totalEducationCost) * 100));
}

/**
 * Visa feasibility (general educational guidance, not legal advice):
 * - university/vocational routes: Student status continues; the standard
 *   work-status change after graduation is well-trodden → high base, reduced
 *   if the career's pathway flag for that education type is false.
 * - direct employment after language school: only careers with a direct
 *   pathway (e.g. Specified Skilled Worker fields) are feasible; others score low
 *   because the standard work status generally expects a degree/専門士.
 */
export function scoreVisa(kind: RouteKind, career: CareerProfile, education: SimProfile['education']): number {
  if (kind === 'university') return career.degreePathways.university ? 90 : 40;
  if (kind === 'vocational') return career.degreePathways.vocational ? 85 : 35;
  // direct employment
  if (career.degreePathways.direct) return 65;
  // A prior bachelor's degree can support a work-status application even
  // without further study in Japan.
  return education === 'bachelor' || education === 'master' ? 60 : 20;
}

/**
 * Employment feasibility: career demand adjusted by the JLPT gap at the moment
 * of job hunting (route-kind specific: study routes add years of language growth,
 * modeled as +1 JLPT step for 2-year programs and +2 for 4-year programs, capped at N1).
 */
export function scoreEmployment(
  career: CareerProfile,
  jlptAtStart: JlptLevel,
  kind: RouteKind,
): number {
  const growth = kind === 'university' ? 2 : kind === 'vocational' ? 1 : 0;
  const levelAtHunt = Math.min(JLPT_ORDER[jlptAtStart] + growth, 5);
  const required = JLPT_ORDER[career.minJlptEntry];
  const gap = required - levelAtHunt;
  const penalty = gap > 0 ? gap * 30 : 0;
  return clamp(career.demandScore - penalty);
}

/** Salary potential: entry+3y ladder midpoint vs desired salary (or a neutral floor). */
export function scoreSalary(career: CareerProfile, desiredSalaryJpy?: number): number {
  const midLevel = career.levels[Math.min(1, career.levels.length - 1)] ?? career.levels[0];
  if (!midLevel) return 0;
  const mid = (midLevel.salaryJpy.min + midLevel.salaryJpy.max) / 2;
  if (!desiredSalaryJpy) return clamp(Math.round((mid / 6_000_000) * 100));
  return clamp(Math.round((mid / desiredSalaryJpy) * 100));
}

/** Location: exact city match 100, same-region (Kanto) 70, flexible preference 85. */
export function scoreLocation(preferred: LocationId, routeCity: LocationId): number {
  if (preferred === 'kanto-any') return 85;
  return preferred === routeCity ? 100 : 70;
}

/**
 * Long-term settlement alignment (general guidance only): longer stable study →
 * work histories and careers whose ladders stay within standard work statuses
 * score higher; direct-entry routes that rely on statuses with different
 * long-term implications score lower.
 */
export function scoreSettlement(kind: RouteKind, career: CareerProfile): number {
  const base = kind === 'university' ? 85 : kind === 'vocational' ? 75 : 50;
  const careerBonus = career.id === 'car-it' ? 10 : 0; // HSP points reachability
  const directPenalty = kind === 'employment' && career.degreePathways.direct ? 0 : kind === 'employment' ? -15 : 0;
  return clamp(base + careerBonus + directPenalty);
}

/** Interests & skills match: field in stated interests = 100, adjacent = 60, else 40. */
const ADJACENT: Record<string, string[]> = {
  business: ['realestate', 'it'],
  it: ['business'],
  hospitality: ['foodservice'],
  foodservice: ['hospitality', 'business'],
  realestate: ['business'],
};

export function scoreInterest(profile: SimProfile, careerField: string): number {
  if (profile.field === careerField || profile.interests.includes(careerField as never)) return 100;
  const adj = ADJACENT[profile.field] ?? [];
  return adj.includes(careerField) ? 60 : 40;
}

export function normalizeWeights(w: FactorWeights): FactorWeights {
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  if (total <= 0) return { ...w };
  const scale = 100 / total;
  return Object.fromEntries(
    Object.entries(w).map(([k, v]) => [k, v * scale]),
  ) as unknown as FactorWeights;
}

export interface FactorInputs {
  profile: SimProfile;
  career: CareerProfile;
  kind: RouteKind;
  school?: School;
  totalEducationCost: number;
  routeCity: LocationId;
}

export function computeFactors(inputs: FactorInputs, weights: FactorWeights, c: CaseName): FactorScore[] {
  const { profile, career, kind, totalEducationCost, routeCity } = inputs;
  const w = normalizeWeights(weights);
  const budget = pickCase(profile.budgetJpy, c);
  const jlpt = effectiveJlpt(profile, c);

  const rows: Array<Omit<FactorScore, 'weighted'>> = [
    {
      factor: 'affordability',
      score: scoreAffordability(budget, totalEducationCost),
      weight: w.affordability,
      reasonEn: `Budget ¥${budget.toLocaleString()} vs. education cost ¥${totalEducationCost.toLocaleString()}.`,
      reasonJa: `予算 ¥${budget.toLocaleString()} に対し教育費 ¥${totalEducationCost.toLocaleString()}。`,
    },
    {
      factor: 'visa',
      score: scoreVisa(kind, career, profile.education),
      weight: w.visa,
      reasonEn:
        kind === 'employment'
          ? 'Direct employment depends on statuses available for this field; study routes use the standard graduate transition.'
          : 'Graduating from this route commonly supports a work-status application in this field (individual review always applies).',
      reasonJa:
        kind === 'employment'
          ? '直接就職はこの分野で利用できる在留資格に依存します。進学ルートは卒業後の標準的な変更手続きを利用します。'
          : 'このルートの卒業は、この分野での就労資格申請の一般的な根拠になります（常に個別審査です）。',
    },
    {
      factor: 'employment',
      score: scoreEmployment(career, jlpt, kind),
      weight: w.employment,
      reasonEn: `Field demand ${career.demandScore}/100, adjusted for your expected Japanese level at job-hunting time.`,
      reasonJa: `分野の需要 ${career.demandScore}/100 を、就職活動時の想定日本語レベルで調整。`,
    },
    {
      factor: 'salary',
      score: scoreSalary(career, profile.desiredSalaryJpy),
      weight: w.salary,
      reasonEn: 'Mid-career salary range for this field vs. your desired salary.',
      reasonJa: 'この分野の中堅給与レンジと希望給与の比較。',
    },
    {
      factor: 'location',
      score: scoreLocation(profile.location, routeCity),
      weight: w.location,
      reasonEn: 'Match between your preferred city and where this route is based.',
      reasonJa: '希望勤務地とルートの拠点の一致度。',
    },
    {
      factor: 'settlement',
      score: scoreSettlement(kind, career),
      weight: w.settlement,
      reasonEn: 'How commonly this route leads to stable long-term residence paths (general guidance, individual review applies).',
      reasonJa: 'このルートが安定した長期在留につながる一般的な度合い（一般情報であり、個別審査があります）。',
    },
    {
      factor: 'interest',
      score: scoreInterest(profile, career.field),
      weight: w.interest,
      reasonEn: 'Match between this field and your stated goal and interests.',
      reasonJa: 'この分野とあなたの目標・興味の一致度。',
    },
  ];

  return rows.map((r) => ({ ...r, weighted: (r.score * r.weight) / 100 }));
}

export function totalScore(breakdown: FactorScore[]): number {
  return Math.round(breakdown.reduce((sum, f) => sum + f.weighted, 0));
}
