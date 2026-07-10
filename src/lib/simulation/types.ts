/**
 * CareerVerse deterministic simulation engine — shared types.
 *
 * Hard rule: nothing in lib/simulation may call an AI provider or the network.
 * Scores are produced by explicit rules over verified structured data so that
 * every result is reproducible, inspectable, and unit-testable.
 */

export type CaseName = 'conservative' | 'expected' | 'optimistic';
export type Feasibility = 'low' | 'medium' | 'high';
export type EvidenceStrength = 'weak' | 'moderate' | 'strong';
export type RouteKind = 'university' | 'vocational' | 'employment';

export type FieldId = 'business' | 'it' | 'hospitality' | 'foodservice' | 'realestate';
export type LocationId = 'tokyo' | 'yokohama' | 'chiba' | 'saitama' | 'kanto-any';
export type JlptLevel = 'none' | 'n5' | 'n4' | 'n3' | 'n2' | 'n1';
export type EducationLevel = 'highschool' | 'some-college' | 'bachelor' | 'master';

/** A value the user is not sure about, expanded into the three cases. */
export interface UncertainNumber {
  min: number;
  expected: number;
  max: number;
}

export interface SimProfile {
  goalText: string;
  field: FieldId;
  education: EducationLevel;
  /** current level, plus an optional expected upcoming result ("expecting N2") */
  jlptCurrent: JlptLevel;
  jlptExpected?: JlptLevel;
  /** available education budget in JPY (may be uncertain) */
  budgetJpy: UncertainNumber;
  location: LocationId;
  desiredSalaryJpy?: number;
  riskTolerance?: 'low' | 'medium' | 'high';
  /** fields the user says they are interested in (for interest match) */
  interests: FieldId[];
}

export interface FactorWeights {
  affordability: number;
  visa: number;
  employment: number;
  salary: number;
  location: number;
  settlement: number;
  interest: number;
}

export const DEFAULT_WEIGHTS: FactorWeights = {
  affordability: 20,
  visa: 20,
  employment: 15,
  salary: 15,
  location: 10,
  settlement: 10,
  interest: 10,
};

export type FactorId = keyof FactorWeights;

export type MilestoneKind =
  | 'now'
  | 'language-school'
  | 'jlpt'
  | 'application-deadline'
  | 'admission'
  | 'tuition-payment'
  | 'scholarship'
  | 'internship'
  | 'graduation'
  | 'first-job'
  | 'visa-transition'
  | 'career-3y'
  | 'career-5y'
  | 'settlement';

export interface Milestone {
  id: string;
  kind: MilestoneKind;
  titleEn: string;
  titleJa: string;
  detailEn: string;
  detailJa: string;
  /** months from "now" */
  monthOffset: number;
  costJpy?: number;
  riskFlag?: { en: string; ja: string };
  sourceIds: string[];
}

export type AssumptionOrigin = 'user' | 'default' | 'ai-confirmed';

export interface Assumption {
  id: string;
  labelEn: string;
  labelJa: string;
  value: string;
  origin: AssumptionOrigin;
}

export interface FactorScore {
  factor: FactorId;
  /** 0–100 rule-based score for the expected case */
  score: number;
  weight: number;
  weighted: number;
  reasonEn: string;
  reasonJa: string;
}

export type RouteLabel = 'best-overall' | 'safest' | 'fastest' | 'long-term';

export interface SimRoute {
  id: string;
  kind: RouteKind;
  nameEn: string;
  nameJa: string;
  /** user-renamable display name; defaults to nameEn/nameJa */
  customName?: string;
  field: FieldId;
  schoolIds: string[];
  careerId: string;
  /** months until first full-time job */
  monthsToJob: number;
  totalCostJpy: UncertainNumber;
  /** entry-level salary range for the target career, JPY/year */
  salaryRangeJpy: { min: number; max: number; isDemo: boolean };
  milestones: Milestone[];
  scores: Record<CaseName, number>;
  breakdown: FactorScore[];
  feasibility: Feasibility;
  evidence: EvidenceStrength;
  /** oldest last-verified date among records used */
  dataFreshness: string;
  assumptions: Assumption[];
  missingInfoEn: string[];
  missingInfoJa: string[];
  whatWouldChangeEn: string[];
  whatWouldChangeJa: string[];
  labels: RouteLabel[];
  visaNote: { en: string; ja: string };
  sourceIds: string[];
}

export interface SimulationResult {
  routes: SimRoute[];
  /** true when the top two expected-case scores are within CLOSE_CALL_MARGIN */
  closeCall: boolean;
  closeCallMargin: number;
  weights: FactorWeights;
  profile: SimProfile;
  generatedAt: string;
  engineVersion: string;
}

export const ENGINE_VERSION = '0.1.0';
export const CLOSE_CALL_MARGIN = 5;

export const JLPT_ORDER: Record<JlptLevel, number> = {
  none: 0,
  n5: 1,
  n4: 2,
  n3: 3,
  n2: 4,
  n1: 5,
};
