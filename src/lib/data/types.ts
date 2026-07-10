import type { FieldId, JlptLevel, LocationId } from '@/lib/simulation/types';

/** Verification lifecycle for every public record. */
export type VerificationStatus = 'draft' | 'reviewed' | 'published' | 'outdated' | 'archived';

export type SourceType = 'official' | 'government' | 'licensed' | 'partner' | 'manual';

export interface SourceRecord {
  id: string;
  nameEn: string;
  nameJa: string;
  url: string;
  type: SourceType;
  retrievedAt: string;
  reviewer: string;
  notes?: string;
}

export interface Provenance {
  sourceIds: string[];
  verification: VerificationStatus;
  lastVerified: string;
  reviewDueAt: string;
  reviewer: string;
  confidence: 'low' | 'medium' | 'high';
  /** demonstration data — clearly labeled in every UI surface */
  isDemo: boolean;
}

export type InstitutionType = 'university' | 'vocational';

export interface School {
  id: string;
  institutionType: InstitutionType;
  nameEn: string;
  nameJa: string;
  city: LocationId;
  fields: FieldId[];
  /** first-year total (tuition + admission + facilities), JPY */
  firstYearCostJpy: number;
  /** typical annual tuition after year 1, JPY */
  annualTuitionJpy: number;
  programYears: number;
  jlptRequired: JlptLevel;
  ejuRequired: boolean;
  scholarshipIds: string[];
  intlSupport: 'basic' | 'good' | 'excellent';
  /** share of international graduates employed or advancing within 6 months */
  employmentOutcome?: { value: number; isDemo: boolean };
  applicationMonths: number[]; // months of year when applications are open
  descriptionEn: string;
  descriptionJa: string;
  livingCostMonthlyJpy: number;
  careerSupportEn: string;
  careerSupportJa: string;
  provenance: Provenance;
  sponsored: boolean;
}

export interface Scholarship {
  id: string;
  nameEn: string;
  nameJa: string;
  provider: string;
  amountJpy: number;
  per: 'month' | 'year' | 'once';
  eligibilityEn: string;
  eligibilityJa: string;
  deadlineEn: string;
  deadlineJa: string;
  region: 'kanto' | 'national';
  institutionTypes: InstitutionType[];
  nationalityRestricted: boolean;
  minJlpt: JlptLevel;
  provenance: Provenance;
}

export interface CareerLevel {
  id: string;
  titleEn: string;
  titleJa: string;
  yearsFromEntry: number;
  salaryJpy: { min: number; max: number; isDemo: boolean };
  jlptTypical: JlptLevel;
  skillsEn: string[];
  skillsJa: string[];
  qualificationsEn: string[];
  qualificationsJa: string[];
  obstaclesEn: string;
  obstaclesJa: string;
  visaNoteEn: string;
  visaNoteJa: string;
}

export interface CareerProfile {
  id: string;
  field: FieldId;
  nameEn: string;
  nameJa: string;
  dailyWorkEn: string;
  dailyWorkJa: string;
  /** demand outlook used by the deterministic engine, 0–100, rule-documented */
  demandScore: number;
  minJlptEntry: JlptLevel;
  /** whether a bachelor/vocational diploma unlocks the standard work visa here */
  degreePathways: { university: boolean; vocational: boolean; direct: boolean };
  levels: CareerLevel[];
  workLifeEn: string;
  workLifeJa: string;
  settlementRelevanceEn: string;
  settlementRelevanceJa: string;
  provenance: Provenance;
}

export interface Dataset {
  sources: SourceRecord[];
  schools: School[];
  scholarships: Scholarship[];
  careers: CareerProfile[];
  jobListings: JobListing[];
}

export interface JobListing {
  id: string;
  careerId: string;
  titleEn: string;
  titleJa: string;
  company: string;
  city: LocationId;
  salaryJpy: { min: number; max: number };
  jlpt: JlptLevel;
  applyUrl: string;
  provenance: Provenance;
}
