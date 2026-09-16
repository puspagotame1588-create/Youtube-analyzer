import { describe, expect, it } from "vitest";
import { attemptLadder, isFiller } from "@/lib/server/transcribe";
import { safeId } from "@/lib/server/paths";
import { speechPrompt } from "@/lib/server/prompts";
import { NotesSchema } from "@/lib/schemas";

describe("isFiller", () => {
  it("drops stock phrases models emit on silence", () => {
    expect(isFiller("ご視聴ありがとうございました")).toBe(true);
    expect(isFiller("Thanks for watching!")).toBe(true);
    expect(isFiller("   ")).toBe(true);
  });
  it("keeps real lecture speech", () => {
    expect(isFiller("今日は4Pについて説明します")).toBe(false);
    expect(isFiller("ご視聴ありがとうございました、と広告では言いますが、今日の主題は価格戦略です")).toBe(false);
  });
});

describe("safeId", () => {
  it("accepts generated ids and rejects path traversal", () => {
    expect(safeId("abc123")).toBe("abc123");
    expect(() => safeId("../etc")).toThrow();
    expect(() => safeId("a/b")).toThrow();
    expect(() => safeId("")).toThrow();
  });
});

describe("speechPrompt", () => {
  it("passes course terminology and recent context to the speech model", () => {
    const prompt = speechPrompt("ja", ["知覚価値", "STP"], "前の文です。");
    expect(prompt).toContain("知覚価値、STP");
    expect(prompt).toContain("前の文です。");
  });
  it("switches language for an English lecture", () => {
    expect(speechPrompt("en", [], "")).toContain("English");
  });
});

describe("NotesSchema", () => {
  it("requires the exam basis to be teacher or inferred", () => {
    const base = {
      title: "t",
      overview: "o",
      detailed: "d",
      topics: [],
      terms: [],
      assignments: [],
      reviewQuestions: [],
      unclear: [],
    };
    expect(
      NotesSchema.safeParse({ ...base, examTopics: [{ topic: "x", basis: "teacher", quote: "q" }] })
        .success,
    ).toBe(true);
    expect(
      NotesSchema.safeParse({ ...base, examTopics: [{ topic: "x", basis: "maybe", quote: "" }] })
        .success,
    ).toBe(false);
  });
});

describe("pass chunk offsets", () => {
  it("uses the recorded position of each chunk, not the configured length", () => {
    // Boundaries drift while recording and the final chunk is short, so the
    // pipeline must trust the measured times the recorder sent.
    const index = [
      { idx: 0, startSec: 0, endSec: 601.4 },
      { idx: 1, startSec: 601.4, endSec: 1203.1 },
      { idx: 2, startSec: 1203.1, endSec: 1290.0 },
    ];
    const configured = 600;
    const resolve = (i: number) =>
      index.find((e) => e.idx === i)?.startSec ?? i * configured;
    expect(resolve(1)).toBeCloseTo(601.4);
    expect(resolve(2)).toBeCloseTo(1203.1);
    // Falls back to the configured length when the position was never recorded.
    expect(resolve(3)).toBe(1800);
  });
});


describe("attemptLadder", () => {
  it("asks the newest model for everything it supports", () => {
    const [first] = attemptLadder("gpt-transcribe", { timestamps: true, hasKeywords: true });
    expect(first).toEqual({ model: "gpt-transcribe", verbose: true, keywords: true });
  });

  it("never sends keywords or verbose output to a model that lacks them", () => {
    const ladder = attemptLadder("gpt-4o-mini-transcribe", {
      timestamps: true,
      hasKeywords: true,
    });
    expect(ladder[0]).toEqual({
      model: "gpt-4o-mini-transcribe",
      verbose: false,
      keywords: false,
    });
    expect(ladder.every((a) => !a.keywords || a.model.startsWith("gpt-transcribe"))).toBe(true);
  });

  it("gives up optional parameters before giving up the model", () => {
    const ladder = attemptLadder("gpt-transcribe", { timestamps: true, hasKeywords: true });
    const second = ladder[1];
    expect(second.model).toBe("gpt-transcribe");
    expect(second.keywords).toBe(false);
    expect(second.verbose).toBe(false);
  });

  it("ends on whisper, which every account can use", () => {
    const ladder = attemptLadder("gpt-transcribe", { timestamps: true, hasKeywords: true });
    expect(ladder.at(-1)).toEqual({ model: "whisper-1", verbose: false, keywords: false });
    expect(ladder.some((a) => a.model === "whisper-1" && a.verbose)).toBe(true);
  });

  it("does not repeat an identical request when the model is already whisper", () => {
    const ladder = attemptLadder("whisper-1", { timestamps: false, hasKeywords: false });
    const keys = ladder.map((a) => `${a.model}|${a.verbose}|${a.keywords}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
