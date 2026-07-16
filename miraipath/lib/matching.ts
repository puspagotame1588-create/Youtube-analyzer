/**
 * Deterministic, transparent matching engine.
 *
 * The "route fit score" measures how well a program fits the student's stated
 * profile and preferences. It is NOT an admission probability and must never
 * be presented as one. Every point is attributable to a visible component.
 *
 * Sponsorship never enters this function.
 */
import type {
  EligibilityStatus,
  JlptLevel,
  EducationLevel,
  MatchResult,
  Program,
  ScoreComponent,
  StudentProfile,
} from "@/types";
import { getCampus, getInstitution, getSource } from "@/data/programs";

// Ordinal scales -------------------------------------------------------------

const JLPT_ORDER: Record<JlptLevel, number> = {
  none: 0,
  N5: 1,
  N4: 2,
  N3: 3,
  N2: 4,
  N1: 5,
};

const EDU_ORDER: Record<EducationLevel, number> = {
  junior_high: 0,
  high_school: 1,
  language_school: 1, // language school assumes high-school completion for matching
  vocational_diploma: 2,
  associate: 2,
  bachelor: 3,
  master: 4,
};

export const MAX_POINTS = {
  academic: 15,
  japanese: 20,
  budget: 18,
  field: 20,
  school_type: 10,
  location: 8,
  timeline: 9,
} as const;

/** Reference date is injectable so tests and demos stay deterministic. */
export interface MatchOptions {
  today?: Date;
}

function isUniversityType(program: Program): boolean {
  const inst = getInstitution(program.institutionId);
  return inst?.type === "university" || inst?.type === "junior_college";
}

export function matchProgram(
  profile: StudentProfile,
  program: Program,
  options: MatchOptions = {}
): MatchResult {
  const today = options.today ?? new Date();
  const route = program.admissionRoutes[0];
  const components: ScoreComponent[] = [];
  const matchReasons: string[] = [];
  const mismatchReasons: string[] = [];
  const missingRequirements: string[] = [];
  const warnings: string[] = [];

  let hardBlock = false;
  let missingInfo = false;

  // --- Academic eligibility --------------------------------------------------
  const eduReq = route.requirements.find((r) => r.kind === "education" && r.required);
  let academicPoints: number = MAX_POINTS.academic;
  let academicReason = "No specific academic requirement found for this route.";
  if (eduReq?.minEducation) {
    const have = EDU_ORDER[profile.highestEducation];
    const need = EDU_ORDER[eduReq.minEducation];
    if (have >= need) {
      academicPoints = MAX_POINTS.academic;
      academicReason = "Your completed education meets this route's requirement.";
      matchReasons.push("Academic background meets the stated requirement");
    } else {
      academicPoints = 0;
      hardBlock = true;
      academicReason = `This route requires: ${eduReq.description}.`;
      mismatchReasons.push("Completed education below the stated requirement");
      missingRequirements.push(eduReq.description);
    }
  }
  components.push({
    key: "academic",
    label: "Academic eligibility",
    points: academicPoints,
    maxPoints: MAX_POINTS.academic,
    reason: academicReason,
  });

  // --- Japanese language -----------------------------------------------------
  const jaReq = route.requirements.find((r) => r.kind === "japanese_level" && r.required);
  let jaPoints: number = MAX_POINTS.japanese;
  let jaReason = "No Japanese requirement stated for this route.";
  if (jaReq?.minJlpt) {
    const have = JLPT_ORDER[profile.jlptLevel];
    const need = JLPT_ORDER[jaReq.minJlpt];
    if (have >= need) {
      jaPoints = MAX_POINTS.japanese;
      jaReason = `Your level (${profile.jlptLevel === "none" ? "not yet certified" : profile.jlptLevel}) meets the stated ${jaReq.minJlpt} requirement.`;
      matchReasons.push(`Japanese level meets the ${jaReq.minJlpt} requirement`);
    } else if (have === need - 1) {
      jaPoints = Math.round(MAX_POINTS.japanese * 0.4);
      jaReason = `You are one level below the stated ${jaReq.minJlpt} requirement. Some schools accept equivalents — confirmation required.`;
      missingRequirements.push(`JLPT ${jaReq.minJlpt} (you reported ${profile.jlptLevel === "none" ? "no certification" : profile.jlptLevel})`);
      warnings.push("Japanese requirement not yet met; an equivalent may be accepted after confirmation.");
    } else {
      jaPoints = 0;
      hardBlock = true;
      jaReason = `This route states JLPT ${jaReq.minJlpt} or equivalent; you reported ${profile.jlptLevel === "none" ? "no certification yet" : profile.jlptLevel}.`;
      mismatchReasons.push(`Japanese requirement (${jaReq.minJlpt}) not met`);
      missingRequirements.push(`JLPT ${jaReq.minJlpt} or equivalent`);
    }
  }
  components.push({
    key: "japanese",
    label: "Japanese-language eligibility",
    points: jaPoints,
    maxPoints: MAX_POINTS.japanese,
    reason: jaReason,
  });

  // --- Budget ------------------------------------------------------------------
  const cost = program.tuition.estimatedFirstYearTotal;
  let budgetPoints = 0;
  let budgetReason = "";
  if (profile.tuitionBudgetJpy >= cost) {
    budgetPoints = MAX_POINTS.budget;
    budgetReason = "Estimated first-year cost is within your stated budget.";
    matchReasons.push("Estimated first-year cost fits your budget");
  } else if (profile.tuitionBudgetJpy >= cost * 0.85) {
    budgetPoints = Math.round(MAX_POINTS.budget * 0.5);
    budgetReason =
      "Estimated first-year cost is slightly above your budget. Fee waivers or scholarships could close the gap, but they are never guaranteed.";
    warnings.push("First-year cost slightly exceeds your stated budget.");
  } else {
    budgetPoints = 0;
    budgetReason = "Estimated first-year cost is clearly above your stated budget.";
    mismatchReasons.push("Estimated first-year cost exceeds your budget");
  }
  components.push({
    key: "budget",
    label: "Budget fit",
    points: budgetPoints,
    maxPoints: MAX_POINTS.budget,
    reason: budgetReason,
  });

  // --- Field alignment ---------------------------------------------------------
  let fieldPoints = 0;
  let fieldReason = "";
  const related: Record<string, string[]> = {
    business: ["tourism", "hospitality"],
    it: ["engineering", "design"],
    engineering: ["it"],
    hospitality: ["tourism", "business"],
    tourism: ["hospitality", "business"],
    design: ["it"],
    care: [],
    other: [],
  };
  if (profile.preferredField === program.field) {
    fieldPoints = MAX_POINTS.field;
    fieldReason = "This program is in your preferred field.";
    matchReasons.push("Program field matches your preferred field");
  } else if (related[profile.preferredField]?.includes(program.field)) {
    fieldPoints = Math.round(MAX_POINTS.field * 0.5);
    fieldReason = "This program is in a field related to your preference.";
  } else {
    fieldPoints = 0;
    fieldReason = "This program is outside your preferred field.";
    mismatchReasons.push("Field differs from your preference");
  }
  components.push({
    key: "field",
    label: "Field alignment",
    points: fieldPoints,
    maxPoints: MAX_POINTS.field,
    reason: fieldReason,
  });

  // --- School type ---------------------------------------------------------------
  const isUni = isUniversityType(program);
  let typePoints = 0;
  let typeReason = "";
  if (profile.schoolTypePreference === "either") {
    typePoints = MAX_POINTS.school_type;
    typeReason = "You are open to both universities and vocational schools.";
  } else if (
    (profile.schoolTypePreference === "university" && isUni) ||
    (profile.schoolTypePreference === "vocational_school" && !isUni)
  ) {
    typePoints = MAX_POINTS.school_type;
    typeReason = "Institution type matches your preference.";
    matchReasons.push("Institution type matches your preference");
  } else {
    typePoints = 0;
    typeReason = "Institution type differs from your stated preference.";
    mismatchReasons.push("Institution type differs from your preference");
  }
  components.push({
    key: "school_type",
    label: "School-type preference",
    points: typePoints,
    maxPoints: MAX_POINTS.school_type,
    reason: typeReason,
  });

  // --- Location -------------------------------------------------------------------
  const campus = getCampus(program);
  let locPoints: number = MAX_POINTS.location;
  let locReason = "You did not state a region preference.";
  if (profile.preferredRegion && profile.preferredRegion !== "any" && campus) {
    if (campus.region === profile.preferredRegion) {
      locPoints = MAX_POINTS.location;
      locReason = `Campus (${campus.city}) is in your preferred region.`;
      matchReasons.push(`Campus in your preferred region (${campus.city})`);
    } else {
      locPoints = 0;
      locReason = `Campus (${campus.city}) is outside your preferred region.`;
      mismatchReasons.push("Campus outside your preferred region");
    }
  }
  components.push({
    key: "location",
    label: "Location preference",
    points: locPoints,
    maxPoints: MAX_POINTS.location,
    reason: locReason,
  });

  // --- Timeline ----------------------------------------------------------------------
  let timePoints: number = MAX_POINTS.timeline;
  let timeReason = "No start-date preference stated.";
  if (profile.desiredStart) {
    const desired = new Date(`${profile.desiredStart}-01T00:00:00`);
    const intake = new Date(route.intakeDate);
    const diffMonths = Math.abs(
      (intake.getFullYear() - desired.getFullYear()) * 12 + (intake.getMonth() - desired.getMonth())
    );
    if (diffMonths <= 2) {
      timePoints = MAX_POINTS.timeline;
      timeReason = "The intake date closely matches your desired start.";
      matchReasons.push("Intake matches your desired start");
    } else if (diffMonths <= 8) {
      timePoints = Math.round(MAX_POINTS.timeline * 0.55);
      timeReason = "The intake is several months away from your desired start.";
    } else {
      timePoints = 0;
      timeReason = "The intake is far from your desired start date.";
      mismatchReasons.push("Intake timing differs significantly from your desired start");
    }
  }
  components.push({
    key: "timeline",
    label: "Timeline fit",
    points: timePoints,
    maxPoints: MAX_POINTS.timeline,
    reason: timeReason,
  });

  // --- Missing information penalties ---------------------------------------------------
  let missingPenalty = 0;
  const missingNotes: string[] = [];
  const ejuReq = route.requirements.find((r) => r.kind === "eju" && r.required);
  if (ejuReq && (profile.ejuTaken === null || profile.ejuTaken === undefined)) {
    missingPenalty -= 6;
    missingInfo = true;
    missingNotes.push("EJU status not provided but this route requires EJU");
    missingRequirements.push("EJU score (status unknown)");
  } else if (ejuReq && profile.ejuTaken === false) {
    missingPenalty -= 10;
    missingNotes.push("This route requires EJU and you have not taken it yet");
    missingRequirements.push("EJU examination");
    warnings.push("EJU is required for this route; check the next EJU sitting dates.");
  }
  if (profile.jlptLevel === "none") {
    missingInfo = true;
    missingNotes.push("No Japanese certification reported; levels could not be confirmed");
  }
  const portfolioReq = route.requirements.find((r) => r.kind === "portfolio" && r.required);
  if (portfolioReq) {
    warnings.push("A portfolio is required; preparing one takes time.");
    missingRequirements.push(portfolioReq.description);
  }
  if (missingPenalty !== 0 || missingNotes.length > 0) {
    components.push({
      key: "missing_info",
      label: "Missing information",
      points: missingPenalty,
      maxPoints: 0,
      reason: missingNotes.join("; ") || "No missing information detected.",
    });
  }

  // --- Deadline status -----------------------------------------------------------------
  const deadline = new Date(route.applicationPeriodEnd);
  const deadlinePassed = deadline.getTime() < today.getTime();
  const opensLater = new Date(route.applicationPeriodStart).getTime() > today.getTime();
  let deadlinePenalty = 0;
  if (deadlinePassed) {
    deadlinePenalty = -15;
    warnings.push(
      "The listed application period appears to have ended. Check the official page for newer rounds."
    );
    components.push({
      key: "deadline",
      label: "Deadline status",
      points: deadlinePenalty,
      maxPoints: 0,
      reason: "The listed application deadline appears to have passed.",
    });
  }

  // Data-quality warnings ------------------------------------------------------------------
  if (
    program.tuition.verificationStatus === "outdated" ||
    program.tuition.verificationStatus === "needs_confirmation" ||
    program.tuition.verificationStatus === "estimated"
  ) {
    warnings.push("Cost figures are not fully verified for this academic year.");
  }

  // --- Total -------------------------------------------------------------------------------
  const raw =
    academicPoints +
    jaPoints +
    budgetPoints +
    fieldPoints +
    typePoints +
    locPoints +
    timePoints +
    missingPenalty +
    deadlinePenalty;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  // --- Eligibility classification -----------------------------------------------------------
  let eligibility: EligibilityStatus;
  if (deadlinePassed) {
    eligibility = "deadline_may_have_passed";
  } else if (hardBlock) {
    eligibility = "requirement_not_met";
  } else if (missingInfo) {
    eligibility = "missing_information";
  } else if (missingRequirements.length > 0 || warnings.length > 0) {
    eligibility = "possibly_eligible";
  } else {
    eligibility = "likely_eligible";
  }

  // --- Next action ----------------------------------------------------------------------------
  let nextAction: string;
  if (deadlinePassed) {
    nextAction = "Check the official site for the next application round.";
  } else if (hardBlock && jaReq && JLPT_ORDER[profile.jlptLevel] < JLPT_ORDER[jaReq.minJlpt ?? "N1"]) {
    nextAction = `Plan your next JLPT attempt toward ${jaReq.minJlpt}, then revisit this route.`;
  } else if (missingRequirements.some((m) => m.toLowerCase().includes("eju"))) {
    nextAction = "Confirm your EJU plan — registration windows fill early.";
  } else if (opensLater) {
    nextAction = `Prepare documents now; applications open ${route.applicationPeriodStart}.`;
  } else {
    nextAction = "Request official information and confirm requirements with the school.";
  }

  return {
    programId: program.id,
    score,
    eligibility,
    components,
    matchReasons,
    mismatchReasons,
    missingRequirements,
    warnings,
    nextDeadline: route.applicationPeriodEnd,
    nextAction,
  };
}

// Fit dimensions -------------------------------------------------------------
//
// One number hides too much: a student can be legally eligible but unable to
// afford the route, or have great preference fit while failing a hard
// requirement. These four independent dimensions are shown alongside the
// route-fit score (always rendered as N/100, never as a percentage).

export type PreferenceFitLevel = "high" | "medium" | "low";
export type EvidenceConfidence = "verified" | "partial" | "outdated";

export interface FitDimensions {
  eligibility: EligibilityStatus;
  /** Known required conditions this student already satisfies. */
  readinessMet: number;
  readinessTotal: number;
  preferenceFit: PreferenceFitLevel;
  evidence: EvidenceConfidence;
}

const PREFERENCE_KEYS = ["budget", "field", "school_type", "location", "timeline"];

export function deriveDimensions(match: MatchResult, program: Program): FitDimensions {
  const route = program.admissionRoutes[0];

  const readinessTotal = route.requirements.filter((r) => r.required).length;
  const readinessMet = Math.min(
    readinessTotal,
    Math.max(0, readinessTotal - match.missingRequirements.length)
  );

  const prefComponents = match.components.filter((c) => PREFERENCE_KEYS.includes(c.key));
  const points = prefComponents.reduce((sum, c) => sum + Math.max(0, c.points), 0);
  const maxPoints = prefComponents.reduce((sum, c) => sum + c.maxPoints, 0);
  const ratio = maxPoints > 0 ? points / maxPoints : 0;
  const preferenceFit: PreferenceFitLevel = ratio >= 0.75 ? "high" : ratio >= 0.45 ? "medium" : "low";

  const statuses = [
    ...program.sourceIds.map((id) => getSource(id)?.verificationStatus).filter(Boolean),
    program.tuition.verificationStatus,
  ];
  let evidence: EvidenceConfidence;
  if (statuses.some((s) => s === "outdated")) {
    evidence = "outdated";
  } else if (statuses.length > 0 && statuses.every((s) => s === "officially_verified")) {
    evidence = "verified";
  } else {
    evidence = "partial";
  }

  return { eligibility: match.eligibility, readinessMet, readinessTotal, preferenceFit, evidence };
}

/** Rank all programs for a profile. Deterministic; ties broken by program id. */
export function matchAllPrograms(
  profile: StudentProfile,
  programs: Program[],
  options: MatchOptions = {}
): MatchResult[] {
  return programs
    .map((p) => matchProgram(profile, p, options))
    .sort((a, b) => b.score - a.score || a.programId.localeCompare(b.programId));
}
