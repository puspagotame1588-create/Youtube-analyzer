import { describe, expect, it } from "vitest";
import {
  planChunks,
  resolveCitations,
  segmentId,
  segmentIndex,
  toFlowSegments,
  transcriptRevision,
  isOutdated,
} from "@/lib/flow";
import { auditCoverage, checkArithmetic, evaluate, validateFlow } from "@/lib/flow-validate";
import { mergeOutlineTopics } from "@/lib/server/flow";
import { buildMarkdown } from "@/lib/export";
import { demoFlow, demoTranscript } from "./fixtures/demo-lecture";
import { makeLongTranscript } from "./fixtures/long-lecture";
import type { LectureFlow } from "@/lib/types";

/** Deep copy, so a test that breaks the flow cannot affect the next one. */
const copy = (flow: LectureFlow): LectureFlow => structuredClone(flow);

describe("segment ids", () => {
  it("reads as s1, s2 … and round-trips", () => {
    expect(segmentId(0)).toBe("s1");
    expect(segmentId(7)).toBe("s8");
    expect(segmentIndex("s1")).toBe(0);
    expect(segmentIndex("s8")).toBe(7);
  });

  it("rejects anything this app would not have issued", () => {
    for (const bad of ["", "s0", "s", "x1", "s1x", "s 1", "s-1", "s01", "S1"]) {
      expect(segmentIndex(bad)).toBeNull();
    }
  });

  it("exposes milliseconds without touching the stored transcript", () => {
    const out = toFlowSegments(demoTranscript.segments);
    expect(out[0]).toMatchObject({ id: "s1", startMs: 0, endMs: 45000, speaker: null });
    expect(out.at(-1)!.id).toBe("s8");
    // The source transcript still speaks in seconds.
    expect(demoTranscript.segments[0]).not.toHaveProperty("startMs");
  });
});

describe("transcriptRevision", () => {
  it("is stable for the same transcript", () => {
    expect(transcriptRevision(demoTranscript)).toBe(transcriptRevision(demoTranscript));
  });

  it("changes when any segment text changes", () => {
    const before = transcriptRevision(demoTranscript);
    const edited = structuredClone(demoTranscript);
    edited.segments[3].source += "。";
    expect(transcriptRevision(edited)).not.toBe(before);
  });

  it("changes when a segment is inserted, because ids shift meaning", () => {
    const before = transcriptRevision(demoTranscript);
    const edited = structuredClone(demoTranscript);
    edited.segments.splice(2, 0, { startSec: 90, endSec: 95, source: "補足です。" });
    expect(transcriptRevision(edited)).not.toBe(before);
  });

  it("changes when only a boundary moves", () => {
    const before = transcriptRevision(demoTranscript);
    const edited = structuredClone(demoTranscript);
    edited.segments[1].endSec = 96;
    expect(transcriptRevision(edited)).not.toBe(before);
  });

  it("marks a stored flow outdated once the transcript moves on", () => {
    const flow = { ...demoFlow, transcriptRevision: transcriptRevision(demoTranscript) };
    expect(isOutdated(flow, transcriptRevision(demoTranscript))).toBe(false);
    const edited = structuredClone(demoTranscript);
    edited.segments.pop();
    expect(isOutdated(flow, transcriptRevision(edited))).toBe(true);
    expect(isOutdated(null, "anything")).toBe(false);
  });
});

describe("planChunks", () => {
  const lengths = (t: { segments: { source: string }[] }) =>
    t.segments.map((s) => s.source.length);
  const opts = { maxChars: 6000, maxSegments: 90, contextSegments: 4 };

  it("tiles the lecture with no gap and no overlap in owned ranges", () => {
    const plans = planChunks(lengths(makeLongTranscript()), opts);
    expect(plans.length).toBeGreaterThan(1);
    expect(plans[0].ownedFrom).toBe(0);
    expect(plans.at(-1)!.ownedTo).toBe(540);
    for (let i = 1; i < plans.length; i++) {
      expect(plans[i].ownedFrom).toBe(plans[i - 1].ownedTo);
    }
  });

  it("keeps every chunk inside both budgets", () => {
    const sizes = lengths(makeLongTranscript());
    for (const plan of planChunks(sizes, opts)) {
      const chars = sizes.slice(plan.ownedFrom, plan.ownedTo).reduce((a, b) => a + b, 0);
      const segments = plan.ownedTo - plan.ownedFrom;
      // One oversized segment may exceed the budget alone; more may not.
      if (segments > 1) expect(chars).toBeLessThanOrEqual(opts.maxChars);
      expect(segments).toBeLessThanOrEqual(opts.maxSegments);
    }
  });

  it("gives every chunk context that never escapes the lecture", () => {
    const plans = planChunks(lengths(makeLongTranscript()), opts);
    for (const plan of plans) {
      expect(plan.contextFrom).toBeGreaterThanOrEqual(0);
      expect(plan.contextTo).toBeLessThanOrEqual(540);
      expect(plan.contextFrom).toBeLessThanOrEqual(plan.ownedFrom);
      expect(plan.contextTo).toBeGreaterThanOrEqual(plan.ownedTo);
    }
  });

  it("reaches the final segment, so an assignment at the end is never dropped", () => {
    const long = makeLongTranscript();
    const plans = planChunks(lengths(long), opts);
    const owned = new Set<number>();
    for (const plan of plans) {
      for (let i = plan.ownedFrom; i < plan.ownedTo; i++) owned.add(i);
    }
    expect(owned.size).toBe(long.segments.length);
    expect(owned.has(long.segments.length - 1)).toBe(true);
    expect(long.segments.at(-1)!.source).toContain("提出期限");
  });

  it("never loses a segment longer than the whole budget", () => {
    const plans = planChunks([50, 99999, 50], { ...opts, maxChars: 100 });
    expect(plans.flatMap((p) => [p.ownedFrom, p.ownedTo])).toContain(2);
    expect(plans.at(-1)!.ownedTo).toBe(3);
  });

  it("returns nothing for an empty transcript", () => {
    expect(planChunks([], opts)).toEqual([]);
  });

  it("handles a lecture that fits in one request", () => {
    const plans = planChunks(lengths(demoTranscript), opts);
    expect(plans).toHaveLength(1);
    expect(plans[0]).toMatchObject({ ownedFrom: 0, ownedTo: 8, contextFrom: 0, contextTo: 8 });
  });
});

describe("resolveCitations", () => {
  const segments = demoTranscript.segments;

  it("resolves ids to positions and to a seek point", () => {
    const out = resolveCitations(["s4", "s5"], segments);
    expect(out.ids).toEqual(["s4", "s5"]);
    expect(out.seekSec).toBe(160);
    expect(out.unknown).toEqual([]);
  });

  it("keeps noncontiguous citations as separate ranges", () => {
    const out = resolveCitations(["s1", "s5", "s6"], segments);
    expect(out.ranges).toHaveLength(2);
    expect(out.ranges[0]).toMatchObject({ fromIndex: 0, toIndex: 0 });
    expect(out.ranges[1]).toMatchObject({ fromIndex: 4, toIndex: 5 });
  });

  it("merges a contiguous run into one range", () => {
    expect(resolveCitations(["s2", "s3", "s4"], segments).ranges).toHaveLength(1);
  });

  it("orders and deduplicates whatever order the model returned", () => {
    const out = resolveCitations(["s5", "s2", "s5"], segments);
    expect(out.ids).toEqual(["s2", "s5"]);
  });

  it("reports an out-of-range id instead of inventing a link", () => {
    const out = resolveCitations(["s9", "s99", "nonsense"], segments);
    expect(out.ids).toEqual([]);
    expect(out.unknown).toEqual(["s9", "s99", "nonsense"]);
    expect(out.seekSec).toBeNull();
  });
});

describe("validateFlow", () => {
  it("accepts the worked example from the specification", () => {
    const result = validateFlow(demoFlow, demoTranscript.segments);
    expect(result.errors).toEqual([]);
  });

  it("rejects a citation to a segment that does not exist", () => {
    const flow = copy(demoFlow);
    flow.sections[0].sourceSegmentIds = ["s99"];
    const { errors } = validateFlow(flow, demoTranscript.segments);
    expect(errors.some((e) => e.includes("s99"))).toBe(true);
  });

  it("rejects a transcript claim carrying no citation", () => {
    const flow = copy(demoFlow);
    flow.conclusion[0].sourceSegmentIds = [];
    const { errors } = validateFlow(flow, demoTranscript.segments);
    expect(errors.some((e) => e.includes("引用元がありません"))).toBe(true);
  });

  it("rejects a derived calculation carrying no citation", () => {
    const flow = copy(demoFlow);
    flow.sections[3].details[0].content.sourceSegmentIds = [];
    const { errors } = validateFlow(flow, demoTranscript.segments);
    expect(errors.some((e) => e.includes("derived_calculation"))).toBe(true);
  });

  it("allows an editorial connection with no citation", () => {
    const flow = copy(demoFlow);
    flow.sections[1].connectionFromPrevious = {
      text: "ここからは費用の話に移ります。",
      basis: "ai_explanation",
      sourceSegmentIds: [],
      uncertainty: null,
    };
    expect(validateFlow(flow, demoTranscript.segments).errors).toEqual([]);
  });

  it("rejects a chapter naming a section that does not exist", () => {
    const flow = copy(demoFlow);
    flow.chapters[0].sectionIds.push("secX");
    const { errors } = validateFlow(flow, demoTranscript.segments);
    expect(errors.some((e) => e.includes("secX"))).toBe(true);
  });

  it("rejects a section belonging to two chapters", () => {
    const flow = copy(demoFlow);
    flow.chapters[1].sectionIds.push("sec1");
    const { errors } = validateFlow(flow, demoTranscript.segments);
    expect(errors.some((e) => e.includes("ch1"))).toBe(true);
  });

  it("rejects a relationship pointing at a missing section", () => {
    const flow = copy(demoFlow);
    flow.relationships[0].toSectionId = "sec99";
    const { errors } = validateFlow(flow, demoTranscript.segments);
    expect(errors.some((e) => e.includes("sec99"))).toBe(true);
  });

  it("rejects coverage that skips a segment", () => {
    const flow = copy(demoFlow);
    flow.coverage.pop();
    const { errors } = validateFlow(flow, demoTranscript.segments);
    expect(errors.some((e) => e.includes("coverage"))).toBe(true);
  });

  it("rejects coverage that counts a segment twice", () => {
    const flow = copy(demoFlow);
    flow.coverage.push({ ...flow.coverage[0] });
    const { errors } = validateFlow(flow, demoTranscript.segments);
    expect(errors.some((e) => e.includes("2 回"))).toBe(true);
  });

  it("rejects a skipped segment dressed up as represented", () => {
    const flow = copy(demoFlow);
    flow.coverage[2] = {
      segmentId: "s3",
      status: "represented",
      sectionIds: [],
      reason: null,
    };
    const { errors } = validateFlow(flow, demoTranscript.segments);
    expect(errors.some((e) => e.includes("セクションがありません"))).toBe(true);
  });

  it("warns, but does not discard, when sections run backwards", () => {
    const flow = copy(demoFlow);
    [flow.sections[1], flow.sections[2]] = [flow.sections[2], flow.sections[1]];
    const { errors, warnings } = validateFlow(flow, demoTranscript.segments);
    expect(errors).toEqual([]);
    expect(warnings.some((w) => w.includes("順序"))).toBe(true);
  });

  it("refuses an empty transcript outright", () => {
    const { errors } = validateFlow(demoFlow, []);
    expect(errors.some((e) => e.includes("空"))).toBe(true);
  });
});

describe("arithmetic", () => {
  it("agrees with the worked example's numbers", () => {
    expect(checkArithmetic(demoFlow)).toEqual([]);
  });

  it("catches a sum that does not hold", () => {
    const flow = copy(demoFlow);
    flow.sections[4].details[0].content.text = "(450 − 300) × 700 − 100,000 ＝ 50,000";
    const problems = checkArithmetic(flow);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("5000");
  });

  it("ignores prose that merely contains an equals sign", () => {
    const flow = copy(demoFlow);
    flow.sections[3].details[0].content.text = "限界利益 ＝ 一個売って残る金額";
    expect(checkArithmetic(flow)).toEqual([]);
  });

  it("treats a definition with a number as a definition, not a sum", () => {
    const flow = copy(demoFlow);
    flow.sections[3].details[0].content.text = "限界利益 ＝ 200円";
    expect(checkArithmetic(flow)).toEqual([]);
  });

  it("checks an answer written with a unit attached", () => {
    const flow = copy(demoFlow);
    flow.sections[3].details[0].content.text = "500円 − 300円 ＝ 250円";
    expect(checkArithmetic(flow)).toHaveLength(1);
  });

  it("never flags text the lecturer actually said", () => {
    const flow = copy(demoFlow);
    flow.sections[3].details[0].content.basis = "transcript";
    flow.sections[3].details[0].content.text = "500 − 300 ＝ 999";
    expect(checkArithmetic(flow)).toEqual([]);
  });

  describe("evaluate", () => {
    it("handles full-width operators, commas and parentheses", () => {
      expect(evaluate("(450 − 300) × 700 − 100,000")).toBe(5000);
      expect(evaluate("100,000 ÷ 200")).toBe(500);
      expect(evaluate("１０ ＋ ５")).toBe(15);
    });

    it("reads through units, which these lectures are full of", () => {
      expect(evaluate("500円 − 300円")).toBe(200);
      expect(evaluate("5 個 + 3 個")).toBe(8);
    });

    it("accepts a bare number, because that is what an answer looks like", () => {
      expect(evaluate("5,000")).toBe(5000);
      expect(evaluate("200円")).toBe(200);
    });

    it("returns null for anything that is not arithmetic", () => {
      for (const bad of ["限界利益", "", "500 − ", "1 / 0", "a + b", "価格 500 数量 600"]) {
        expect(evaluate(bad)).toBeNull();
      }
    });
  });
});

describe("auditCoverage", () => {
  it("recomputes coverage from what the sections really cite", () => {
    const entries = auditCoverage(demoFlow, demoTranscript.segments.length);
    expect(entries).toHaveLength(8);
    expect(entries.every((e) => e.status === "represented")).toBe(true);
    expect(entries[3].sectionIds).toEqual(["sec4", "sec5"]);
  });

  it("does not take the model's word that a segment was explained", () => {
    const flow = copy(demoFlow);
    // The model claims s3 is covered, but no section cites it.
    flow.sections = flow.sections.filter((s) => s.id !== "sec3");
    flow.chapters[0].sectionIds = ["sec1", "sec2"];
    const entries = auditCoverage(flow, demoTranscript.segments.length);
    const s3 = entries.find((e) => e.segmentId === "s3")!;
    expect(s3.status).toBe("unresolved");
    expect(s3.sectionIds).toEqual([]);
    expect(s3.reason).toBeTruthy();
  });

  it("keeps a stated non-instructional reason", () => {
    const flow = copy(demoFlow);
    flow.sections = flow.sections.filter((s) => s.id !== "sec1");
    flow.chapters[0].sectionIds = ["sec2", "sec3"];
    flow.coverage[0] = {
      segmentId: "s1",
      status: "non_instructional",
      sectionIds: [],
      reason: "あいさつのみ",
    };
    const entry = auditCoverage(flow, 8).find((e) => e.segmentId === "s1")!;
    expect(entry).toMatchObject({ status: "non_instructional", reason: "あいさつのみ" });
  });

  it("counts a citation made only inside a detail", () => {
    const flow = copy(demoFlow);
    flow.sections[0].sourceSegmentIds = ["s1"];
    flow.sections[0].details = [
      {
        kind: "reasoning",
        label: "補足",
        content: { text: "後半の前提にもつながります。", basis: "transcript", sourceSegmentIds: ["s7"], uncertainty: null },
      },
    ];
    const entry = auditCoverage(flow, 8).find((e) => e.segmentId === "s7")!;
    expect(entry.sectionIds).toContain("sec1");
  });
});

describe("mergeOutlineTopics", () => {
  const topic = (id: string, title: string, ids: string[], unresolved = "") => ({
    id,
    title,
    segmentIds: ids,
    summary: `${title}の説明`,
    notes: [],
    unresolved,
  });

  it("joins a topic that a chunk boundary cut in half", () => {
    // Acceptance check 3: a definition in one chunk, its example in the next.
    const merged = mergeOutlineTopics(
      [
        topic("c0_t1", "固定費と変動費", ["s10", "s11"], "例は次の区間で示される"),
        topic("c1_t1", "固定費と変動費の例", ["s12", "s13"]),
        topic("c1_t2", "損益分岐点", ["s14"]),
      ],
      new Map([
        ["c0_t1", 0],
        ["c1_t1", 1],
        ["c1_t2", 1],
      ]),
    );
    expect(merged).toHaveLength(2);
    expect(merged[0].segmentIds).toEqual(["s10", "s11", "s12", "s13"]);
    expect(merged[0].id).toBe("t1");
    expect(merged[1].title).toBe("損益分岐点");
  });

  it("joins two halves of the same topic by title when neither flagged it", () => {
    const merged = mergeOutlineTopics(
      [
        topic("c0_t1", "需要曲線の傾き", ["s10"]),
        topic("c1_t1", "需要曲線の傾き", ["s11"]),
      ],
      new Map([
        ["c0_t1", 0],
        ["c1_t1", 1],
      ]),
    );
    expect(merged).toHaveLength(1);
  });

  it("never merges two topics from the same chunk", () => {
    const merged = mergeOutlineTopics(
      [
        topic("c0_t1", "需要曲線", ["s1"], "続きあり"),
        topic("c0_t2", "需要曲線", ["s2"]),
      ],
      new Map([
        ["c0_t1", 0],
        ["c0_t2", 0],
      ]),
    );
    expect(merged).toHaveLength(2);
  });

  it("keeps unrelated neighbours apart across a boundary", () => {
    const merged = mergeOutlineTopics(
      [
        topic("c0_t1", "需要曲線", ["s10"]),
        topic("c1_t1", "公共財と外部性", ["s11"]),
      ],
      new Map([
        ["c0_t1", 0],
        ["c1_t1", 1],
      ]),
    );
    expect(merged).toHaveLength(2);
  });

  it("numbers what survives in order", () => {
    const merged = mergeOutlineTopics(
      [topic("c0_t1", "A", ["s1"]), topic("c1_t9", "B", ["s2"])],
      new Map([
        ["c0_t1", 0],
        ["c1_t9", 1],
      ]),
    );
    expect(merged.map((t) => t.id)).toEqual(["t1", "t2"]);
  });
});

describe("markdown export", () => {
  const lecture = {
    id: "demo",
    courseId: "c1",
    number: 3,
    title: "",
    date: "2026-09-24",
    language: "ja" as const,
    status: "done" as const,
    createdAt: 0,
    updatedAt: 0,
    durationSec: 435,
    masterBytes: 1000,
    audioMime: "audio/webm",
  };
  const md = buildMarkdown({
    lecture,
    transcript: demoTranscript,
    notes: null,
    highlights: null,
    flashcards: null,
    flow: demoFlow,
  });

  it("writes the flow with its chapters and cards", () => {
    expect(md).toContain("## 講義の流れ");
    expect(md).toContain("### 売上が増えても、利益が減るのはなぜ？");
    expect(md).toContain("#### 1. 最初の問い：売れれば利益も増える？");
    expect(md).toContain("#### 8. 結論と課題");
  });

  it("keeps a calculation labelled as a calculation, not as a quotation", () => {
    expect(md).toContain("(450 − 300) × 700 − 100,000 ＝ 5,000 ［講義の数値からの計算 / s4, s5］");
  });

  it("marks an AI-written connection as AI-written", () => {
    expect(md).toContain("［AI による補足");
  });

  it("leaves a relative deadline unresolved rather than inventing a date", () => {
    expect(md).toContain("提出期限:「次回の授業」（この録音だけでは日付を特定できません）");
    expect(md).not.toMatch(/提出期限.*20\d\d-\d\d-\d\d/);
  });

  it("refuses to claim the lecture was fully understood", () => {
    expect(md).toContain("説明が正しいことや録音が講義全体を捉えていることを示すものではありません");
    expect(md).not.toContain("100%");
  });

  it("says plainly when there is no conclusion", () => {
    const withoutEnding = structuredClone(demoFlow);
    withoutEnding.conclusion = [];
    const out = buildMarkdown({
      lecture,
      transcript: demoTranscript,
      notes: null,
      highlights: null,
      flashcards: null,
      flow: withoutEnding,
    });
    expect(out).toContain("明示的な結論はありませんでした");
  });

  it("omits the whole section when no flow was generated", () => {
    const out = buildMarkdown({
      lecture,
      transcript: demoTranscript,
      notes: null,
      highlights: null,
      flashcards: null,
      flow: null,
    });
    expect(out).not.toContain("## 講義の流れ");
    // The rest of the export is untouched.
    expect(out).toContain("## 全文");
  });
});
