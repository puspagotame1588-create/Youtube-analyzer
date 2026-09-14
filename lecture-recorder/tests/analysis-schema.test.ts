import { describe, expect, it } from "vitest";
import { AnalysisSchema, AnalyzeRequestSchema, TranslateRequestSchema } from "@/lib/analysis-schema";
import { demoAnalysis } from "@/lib/demo";

describe("AnalysisSchema", () => {
  it("accepts the demo analysis (so demo mode never breaks the client parser)", () => {
    const demo = demoAnalysis({
      course: "経営学",
      lectureNumber: 1,
      segments: [{ ja: "こんにちは", en: "Hello" }],
    });
    expect(AnalysisSchema.safeParse(demo).success).toBe(true);
  });
  it("rejects a missing English side", () => {
    const bad = { title: { ja: "x" }, summary: { ja: "a", en: "b" }, mainPoints: [], topics: [] };
    expect(AnalysisSchema.safeParse(bad).success).toBe(false);
  });
});

describe("AnalyzeRequestSchema", () => {
  it("requires at least one segment and a positive lecture number", () => {
    expect(
      AnalyzeRequestSchema.safeParse({ course: "x", lectureNumber: 0, date: "2026-01-01", segments: [] })
        .success,
    ).toBe(false);
    const ok = AnalyzeRequestSchema.safeParse({
      course: "x",
      lectureNumber: 2,
      date: "2026-01-01",
      segments: [{ startSec: 0, ja: "はい" }],
    });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.segments[0].en).toBe("");
  });
});

describe("TranslateRequestSchema", () => {
  it("rejects empty Japanese", () => {
    expect(TranslateRequestSchema.safeParse({ ja: "" }).success).toBe(false);
  });
});
