import { describe, it, expect } from "vitest";
import { matchProgram, matchAllPrograms } from "@/lib/matching";
import { demoPrograms, getProgram } from "@/data/programs";
import type { StudentProfile } from "@/types";

const TODAY = new Date("2026-07-01T00:00:00");

const baseProfile: StudentProfile = {
  id: "test-profile",
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-01T00:00:00Z",
  currentCountry: "Japan",
  livingInJapan: true,
  currentSchoolType: "language_school",
  preferredLanguage: "en",
  highestEducation: "high_school",
  jlptLevel: "N2",
  ejuTaken: null,
  preferredField: "it",
  schoolTypePreference: "either",
  preferredRegion: "any",
  tuitionBudgetJpy: 1200000,
  desiredStart: "2027-04",
  priorities: ["low_cost"],
  allowInstitutionContact: false,
};

describe("matchProgram", () => {
  const aiProgram = getProgram("prog-aidc-ai")!;

  it("is deterministic for the same inputs", () => {
    const a = matchProgram(baseProfile, aiProgram, { today: TODAY });
    const b = matchProgram(baseProfile, aiProgram, { today: TODAY });
    expect(a).toEqual(b);
  });

  it("keeps the score in the 0-100 range for all seeded programs", () => {
    for (const p of demoPrograms) {
      const m = matchProgram(baseProfile, p, { today: TODAY });
      expect(m.score).toBeGreaterThanOrEqual(0);
      expect(m.score).toBeLessThanOrEqual(100);
    }
  });

  it("scores an N2 IT student highly on the N3 IT vocational program", () => {
    const m = matchProgram(baseProfile, aiProgram, { today: TODAY });
    expect(m.score).toBeGreaterThanOrEqual(80);
    expect(m.eligibility).toBe("likely_eligible");
    expect(m.matchReasons.length).toBeGreaterThan(0);
  });

  it("hard-blocks when the Japanese requirement is clearly not met", () => {
    const noJapanese: StudentProfile = { ...baseProfile, jlptLevel: "N5" };
    const m = matchProgram(noJapanese, aiProgram, { today: TODAY });
    expect(m.eligibility).toBe("requirement_not_met");
    const jaComponent = m.components.find((c) => c.key === "japanese");
    expect(jaComponent?.points).toBe(0);
    expect(m.missingRequirements.some((r) => r.includes("JLPT"))).toBe(true);
  });

  it("marks one-level-below Japanese as needing confirmation, not blocked", () => {
    // Program requires N2; student has N3.
    const n3Student: StudentProfile = { ...baseProfile, jlptLevel: "N3", preferredField: "business" };
    const m = matchProgram(n3Student, getProgram("prog-hgu-digital-business")!, { today: TODAY });
    expect(m.eligibility).not.toBe("requirement_not_met");
    expect(m.warnings.length).toBeGreaterThan(0);
  });

  it("penalizes unknown EJU status on EJU-required routes and flags missing info", () => {
    const engStudent: StudentProfile = { ...baseProfile, preferredField: "engineering", ejuTaken: null };
    const m = matchProgram(engStudent, getProgram("prog-hgu-mech")!, { today: TODAY });
    const missing = m.components.find((c) => c.key === "missing_info");
    expect(missing).toBeDefined();
    expect(missing!.points).toBeLessThan(0);
    expect(m.eligibility).toBe("missing_information");
  });

  it("flags programs whose application deadline has passed", () => {
    const m = matchProgram(baseProfile, getProgram("prog-obc-business")!, { today: TODAY });
    expect(m.eligibility).toBe("deadline_may_have_passed");
    const deadline = m.components.find((c) => c.key === "deadline");
    expect(deadline?.points).toBeLessThan(0);
  });

  it("gives zero budget points when cost clearly exceeds budget", () => {
    const tight: StudentProfile = { ...baseProfile, tuitionBudgetJpy: 800000 };
    const m = matchProgram(tight, getProgram("prog-hgu-mech")!, { today: TODAY });
    const budget = m.components.find((c) => c.key === "budget");
    expect(budget?.points).toBe(0);
  });

  it("never mentions guarantees in generated text", () => {
    for (const p of demoPrograms) {
      const m = matchProgram(baseProfile, p, { today: TODAY });
      const allText = [
        ...m.matchReasons,
        ...m.mismatchReasons,
        ...m.warnings,
        m.nextAction,
        ...m.components.map((c) => c.reason),
      ]
        .join(" ")
        .toLowerCase();
      expect(allText).not.toContain("guaranteed admission");
      expect(allText).not.toContain("100%");
      expect(allText).not.toContain("perfect match");
    }
  });

  it("the score sum matches the component breakdown", () => {
    for (const p of demoPrograms) {
      const m = matchProgram(baseProfile, p, { today: TODAY });
      const sum = m.components.reduce((acc, c) => acc + c.points, 0);
      expect(m.score).toBe(Math.max(0, Math.min(100, Math.round(sum))));
    }
  });
});

describe("matchAllPrograms", () => {
  it("returns results sorted by score descending", () => {
    const results = matchAllPrograms(baseProfile, demoPrograms, { today: TODAY });
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it("covers every seeded program exactly once", () => {
    const results = matchAllPrograms(baseProfile, demoPrograms, { today: TODAY });
    expect(results.length).toBe(demoPrograms.length);
    expect(new Set(results.map((r) => r.programId)).size).toBe(demoPrograms.length);
  });

  it("improving Japanese level never lowers any program's score", () => {
    const n3 = matchAllPrograms({ ...baseProfile, jlptLevel: "N3" }, demoPrograms, { today: TODAY });
    const n1 = matchAllPrograms({ ...baseProfile, jlptLevel: "N1" }, demoPrograms, { today: TODAY });
    const n3Map = new Map(n3.map((r) => [r.programId, r.score]));
    for (const r of n1) {
      expect(r.score).toBeGreaterThanOrEqual(n3Map.get(r.programId)!);
    }
  });
});
