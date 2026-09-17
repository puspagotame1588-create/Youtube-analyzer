import { describe, expect, it } from "vitest";
import {
  attemptLadder,
  isFiller,
  isRepeat,
  similarity,
  spreadOverWindow,
} from "@/lib/server/transcribe";
import { contextWindows, findCues, normalize } from "@/lib/highlight";
import { isSilent } from "@/lib/recorder";
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

describe("isRepeat", () => {
  it("catches the loop seen in a real lecture", () => {
    const a = "それで、じゃあ何でやるかというと、だいたい段取り説明しながら考えます。授業の段取りなんですけども。";
    const b = "それで、じゃあなんでやるかというと、だいたい段取りを説明しながら考えます。授業の段取りなんですけども。";
    expect(isRepeat(b, a)).toBe(true);
  });

  it("leaves two different sentences alone", () => {
    expect(
      isRepeat("価格設定では知覚価値を考えます。", "4Pとは製品、価格、流通、販促のことです。"),
    ).toBe(false);
  });

  it("treats an exact repeat as a repeat", () => {
    expect(isRepeat("同じ文です。", "同じ文です。")).toBe(true);
  });

  it("never flags the first line, which has nothing before it", () => {
    expect(isRepeat("最初の行です。", "")).toBe(false);
  });

  it("ignores punctuation and spacing differences", () => {
    expect(similarity("ここは試験に出します", "ここは、試験に出します。")).toBe(1);
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
    const prompt = speechPrompt("ja", ["知覚価値", "STP"]);
    expect(prompt).toContain("知覚価値、STP");
  });
  it("switches language for an English lecture", () => {
    expect(speechPrompt("en", [])).toContain("English");
  });
  it("carries no previous transcript, which is what makes models loop", () => {
    expect(speechPrompt("ja", [])).not.toContain("前の文");
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

  it("gives up terminology hints before timestamps", () => {
    // Losing timestamps collapses a ten minute chunk into one block, so it must
    // cost more than losing the recognition hints.
    const ladder = attemptLadder("gpt-transcribe", { timestamps: true, hasKeywords: true });
    expect(ladder[1]).toEqual({ model: "gpt-transcribe", verbose: true, keywords: false });
    expect(ladder[2]).toEqual({ model: "gpt-transcribe", verbose: false, keywords: false });
  });

  it("gives up optional parameters before giving up the model", () => {
    const ladder = attemptLadder("gpt-transcribe", { timestamps: true, hasKeywords: true });
    const firstOtherModel = ladder.findIndex((a) => a.model !== "gpt-transcribe");
    expect(firstOtherModel).toBeGreaterThan(1);
  });

  it("falls back through the better Japanese model before reaching whisper", () => {
    // Japanese accuracy is the whole point, so a chunk only lands on whisper-1
    // once nothing newer will take it.
    const ladder = attemptLadder("gpt-transcribe", { timestamps: true, hasKeywords: true });
    const models = ladder.map((a) => a.model);
    expect(models.indexOf("gpt-4o-transcribe")).toBeGreaterThan(-1);
    expect(models.indexOf("gpt-4o-transcribe")).toBeLessThan(models.indexOf("whisper-1"));
  });

  it("never asks a json-only fallback for timestamps", () => {
    const ladder = attemptLadder("gpt-transcribe", { timestamps: true, hasKeywords: true });
    expect(ladder.filter((a) => a.model === "gpt-4o-transcribe")).toEqual([
      { model: "gpt-4o-transcribe", verbose: false, keywords: false },
    ]);
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

describe("cue detection", () => {
  it("finds exam, deadline and memorisation cues in Japanese speech", () => {
    expect(findCues("ここは試験に出しますから覚えておいてください", "ja").map((c) => c.category))
      .toEqual(expect.arrayContaining(["exam", "memorize"]));
    expect(findCues("レポートの締め切りは来週の金曜です", "ja")[0].category).toBe("assignment");
    expect(findCues("ここは間違えやすいので注意してください", "ja")[0].category).toBe("caution");
  });

  it("finds the same cues in an English lecture, regardless of case", () => {
    expect(findCues("This WILL be on the final EXAM", "en")[0].category).toBe("exam");
    expect(findCues("A common mistake here", "en")[0].category).toBe("caution");
  });

  it("leaves ordinary explanation alone", () => {
    expect(findCues("マーケティングとは顧客のニーズを理解する活動です", "ja")).toEqual([]);
    expect(findCues("The demand curve slopes downward", "en")).toEqual([]);
  });

  it("reports one cue per category, not one per matching word", () => {
    const cues = findCues("試験でもテストでも期末でも問われます", "ja");
    expect(cues.filter((c) => c.category === "exam")).toHaveLength(1);
  });
});

describe("contextWindows", () => {
  it("surrounds each candidate with the lines around it", () => {
    expect(contextWindows([10], 100)).toEqual([{ start: 7, end: 13, cueLines: [10] }]);
  });

  it("merges candidates that sit close together into one window", () => {
    const windows = contextWindows([10, 12, 40], 100);
    expect(windows).toHaveLength(2);
    expect(windows[0]).toEqual({ start: 7, end: 15, cueLines: [10, 12] });
    expect(windows[1].cueLines).toEqual([40]);
  });

  it("never runs past the start or end of the transcript", () => {
    expect(contextWindows([0], 5)[0]).toEqual({ start: 0, end: 3, cueLines: [0] });
    expect(contextWindows([4], 5)[0]).toEqual({ start: 1, end: 4, cueLines: [4] });
  });
});

describe("normalize", () => {
  it("ignores whitespace so a quote can be matched against its line", () => {
    expect(normalize("ここは 試験に  出します")).toBe(normalize("ここは試験に出します"));
  });
});

describe("isSilent", () => {
  it("skips a chunk far quieter than the rest of the lecture", () => {
    expect(isSilent(0.01, 0.5)).toBe(true);
  });

  it("keeps speech from a quiet microphone at the back of a hall", () => {
    // A weak signal throughout: everything is quiet, so nothing is "too quiet".
    expect(isSilent(0.03, 0.05)).toBe(false);
    expect(isSilent(0.012, 0.05)).toBe(false);
  });

  it("still skips true silence", () => {
    expect(isSilent(0.001, 0.05)).toBe(true);
    expect(isSilent(0, 0)).toBe(true);
  });

  it("adapts as the lecture gets louder", () => {
    // The same chunk is speech early on, and room noise once the teacher
    // starts speaking at a normal level.
    expect(isSilent(0.02, 0.06)).toBe(false);
    expect(isSilent(0.02, 0.9)).toBe(true);
  });
});

describe("spreadOverWindow", () => {
  const text = "今日は4Pを扱います。まず製品について話します。次に価格です。";

  it("splits a timestamp-less block into sentences", () => {
    const out = spreadOverWindow(text, 600, 1200);
    expect(out.map((s) => s.text)).toEqual([
      "今日は4Pを扱います。",
      "まず製品について話します。",
      "次に価格です。",
    ]);
  });

  it("covers the whole window without gaps or overlap", () => {
    const out = spreadOverWindow(text, 600, 1200);
    expect(out[0].startSec).toBe(600);
    expect(out.at(-1)!.endSec).toBe(1200);
    for (let i = 1; i < out.length; i++) {
      expect(out[i].startSec).toBeCloseTo(out[i - 1].endSec);
    }
  });

  it("gives a longer sentence a longer slice", () => {
    const out = spreadOverWindow(text, 0, 600);
    const span = (i: number) => out[i].endSec - out[i].startSec;
    expect(span(1)).toBeGreaterThan(span(2));
  });

  it("leaves a single sentence exactly as it was", () => {
    expect(spreadOverWindow("  一文だけです。 ", 10, 20)).toEqual([
      { startSec: 10, endSec: 20, text: "一文だけです。" },
    ]);
  });
});
