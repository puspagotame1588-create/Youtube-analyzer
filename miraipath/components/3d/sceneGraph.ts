/**
 * Data layer for the hero "Future Route Universe".
 *
 * The 3D scene is NOT decorative: every path is a real demo program from the
 * seeded dataset, scored by the same deterministic matching engine used in
 * the product. Changing the hero profile controls re-scores paths, so the
 * visualization always tells the true matching story.
 */
import type { Program, StudentProfile } from "@/types";
import { demoPrograms, getInstitution, getProgram } from "@/data/programs";
import { matchProgram } from "@/lib/matching";
import type { MatchResult } from "@/types";

/** Fixed reference date keeps the hero deterministic across renders. */
export const HERO_TODAY = new Date("2026-07-01T00:00:00");

export const HERO_BASE_PROFILE: StudentProfile = {
  id: "hero-demo",
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-01T00:00:00Z",
  displayName: "Demo student",
  currentCountry: "Japan",
  livingInJapan: true,
  currentSchoolType: "language_school",
  preferredLanguage: "en",
  highestEducation: "high_school",
  jlptLevel: "N3",
  ejuTaken: null,
  preferredField: "it",
  schoolTypePreference: "either",
  preferredRegion: "any",
  tuitionBudgetJpy: 1200000,
  desiredStart: "2027-04",
  priorities: ["low_cost", "career_flexibility"],
  allowInstitutionContact: false,
};

export interface HeroControls {
  jlptLevel: "N3" | "N2" | "N1";
  budget: 900000 | 1200000 | 1600000;
  field: "it" | "business" | "hospitality" | "design";
}

export const DEFAULT_HERO_CONTROLS: HeroControls = {
  jlptLevel: "N3",
  budget: 1200000,
  field: "it",
};

export type Vec3 = [number, number, number];

export interface HeroPath {
  program: Program;
  institutionName: string;
  institutionShortLabel: string;
  isUniversity: boolean;
  careerLabel: string;
  color: string;
  studentPos: Vec3;
  institutionPos: Vec3;
  careerPos: Vec3;
  match: MatchResult;
}

export const STUDENT_POS: Vec3 = [-3.8, 0, 0];

const UNI_COLOR = "#5b9dff"; // electric blue — university routes
const VOC_COLOR = "#2dd4bf"; // teal — vocational routes

interface PathLayout {
  programId: string;
  shortLabel: string;
  institutionPos: Vec3;
  careerPos: Vec3;
}

const LAYOUT: PathLayout[] = [
  // Universities (upper cluster)
  { programId: "prog-hgu-digital-business", shortLabel: "Digital Business · Univ.", institutionPos: [1.6, 1.7, -0.3], careerPos: [4.4, 2.1, -0.5] },
  { programId: "prog-tit-info", shortLabel: "Information Eng. · Univ.", institutionPos: [2.4, 0.9, 0.7], careerPos: [5.0, 1.1, 0.9] },
  { programId: "prog-kmu-mgmt", shortLabel: "Intl. Management · Univ.", institutionPos: [1.2, 2.6, 0.6], careerPos: [3.9, 3.0, 0.8] },
  // Vocational schools (lower cluster)
  { programId: "prog-aidc-ai", shortLabel: "AI Development · Voc.", institutionPos: [1.7, -1.5, 0.5], careerPos: [4.6, -1.8, 0.6] },
  { programId: "prog-shc-hotel", shortLabel: "Hotel Management · Voc.", institutionPos: [2.5, -0.8, -0.5], careerPos: [5.1, -0.9, -0.6] },
  { programId: "prog-mdc-visual", shortLabel: "Visual & UI Design · Voc.", institutionPos: [1.3, -2.5, -0.2], careerPos: [4.0, -2.9, -0.3] },
];

export function buildHeroProfile(controls: HeroControls): StudentProfile {
  return {
    ...HERO_BASE_PROFILE,
    jlptLevel: controls.jlptLevel,
    tuitionBudgetJpy: controls.budget,
    preferredField: controls.field,
  };
}

export function buildHeroPaths(controls: HeroControls): HeroPath[] {
  const profile = buildHeroProfile(controls);
  return LAYOUT.flatMap((layout) => {
    const program = getProgram(layout.programId);
    if (!program) return [];
    const inst = getInstitution(program.institutionId);
    if (!inst) return [];
    const isUniversity = inst.type === "university" || inst.type === "junior_college";
    const match = matchProgram(profile, program, { today: HERO_TODAY });
    return [
      {
        program,
        institutionName: inst.name,
        institutionShortLabel: layout.shortLabel,
        isUniversity,
        careerLabel: program.careerDirections[0] ?? "Career",
        color: isUniversity ? UNI_COLOR : VOC_COLOR,
        studentPos: STUDENT_POS,
        institutionPos: layout.institutionPos,
        careerPos: layout.careerPos,
        match,
      },
    ];
  });
}

/** Anonymized students shown in "Institution view". Fictional sample data. */
export const HERO_INSTITUTION_STUDENTS = [
  { id: "S-2041", label: "N2 · IT · ¥1.0–1.3M", consented: true },
  { id: "S-2117", label: "N2 · Business · ¥1.3–1.6M", consented: true },
  { id: "S-1988", label: "N3 · Business · ¥0.8–1.0M", consented: true },
  { id: "S-2203", label: "N3 · Hospitality · ¥0.8–1.0M", consented: false },
  { id: "S-2314", label: "N2 · IT · ¥1.0–1.3M", consented: true },
] as const;

/** Sanity check used by demoPrograms consumers; all hero programs must exist. */
export const HERO_PROGRAM_COUNT = LAYOUT.filter((l) =>
  demoPrograms.some((p) => p.id === l.programId)
).length;
