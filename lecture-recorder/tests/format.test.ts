import { describe, expect, it } from "vitest";
import {
  fmtDuration,
  fmtTime,
  isLikelyHallucination,
  lectureToMarkdown,
  safeFileName,
  spokenSegments,
} from "@/lib/format";
import type { Course, Lecture } from "@/lib/types";

describe("fmtTime", () => {
  it("formats minutes and seconds", () => {
    expect(fmtTime(0)).toBe("0:00");
    expect(fmtTime(65)).toBe("1:05");
    expect(fmtTime(599.9)).toBe("9:59");
  });
  it("formats hours", () => {
    expect(fmtTime(3725)).toBe("1:02:05");
  });
});

describe("fmtDuration", () => {
  it("rounds to minutes and shows hours when needed", () => {
    expect(fmtDuration(30)).toBe("1m");
    expect(fmtDuration(45 * 60)).toBe("45m");
    expect(fmtDuration(90 * 60)).toBe("1h 30m");
  });
});

describe("isLikelyHallucination", () => {
  it("drops known sign-off phrases on quiet chunks", () => {
    expect(isLikelyHallucination("ご視聴ありがとうございました", 0.01)).toBe(true);
    expect(isLikelyHallucination("Thanks for watching!", 0.01)).toBe(true);
  });
  it("keeps the same phrase when the chunk was loud", () => {
    expect(isLikelyHallucination("ご視聴ありがとうございました", 0.3)).toBe(false);
  });
  it("keeps ordinary lecture speech on quiet chunks", () => {
    expect(isLikelyHallucination("今日は4Pについて説明します", 0.01)).toBe(false);
  });
  it("treats empty text as hallucination", () => {
    expect(isLikelyHallucination("   ", 0.5)).toBe(true);
  });
});

const course: Course = {
  id: "c1",
  name: "マーケティング論",
  teacher: "田中先生",
  color: "#000",
  createdAt: 0,
};

const lecture: Lecture = {
  id: "l1",
  courseId: "c1",
  number: 3,
  title: "4Pの基礎",
  date: "2026-09-14",
  createdAt: 0,
  durationSec: 5400,
  status: "done",
  segments: [
    { idx: 0, startSec: 0, endSec: 10, ja: "今日は4Pです。", en: "Today is the 4Ps.", status: "done" },
    { idx: 1, startSec: 10, endSec: 20, ja: "", en: "", status: "silent" },
    { idx: 2, startSec: 20, endSec: 30, ja: "価格は重要です。", en: "Price matters.", status: "done" },
  ],
  analysis: {
    title: { ja: "4Pの基礎", en: "Basics of the 4Ps" },
    summary: { ja: "要約です。", en: "This is the summary." },
    mainPoints: [{ ja: "4Pは製品・価格・流通・販促。", en: "The 4Ps are product, price, place, promotion." }],
    topics: [
      { heading: { ja: "導入", en: "Introduction" }, detail: { ja: "概要。", en: "Overview." } },
    ],
  },
};

describe("spokenSegments", () => {
  it("removes silent and empty segments", () => {
    expect(spokenSegments(lecture.segments).map((s) => s.idx)).toEqual([0, 2]);
  });
});

describe("lectureToMarkdown", () => {
  it("includes metadata, summary, points and timestamped transcript", () => {
    const md = lectureToMarkdown(lecture, course);
    expect(md).toContain("# マーケティング論 第3回 — 4Pの基礎");
    expect(md).toContain("田中先生");
    expect(md).toContain("1h 30m");
    expect(md).toContain("## 要約 / Summary");
    expect(md).toContain("1. 4Pは製品・価格・流通・販促。");
    expect(md).toContain("**[0:00]** 今日は4Pです。");
    expect(md).toContain("**[0:20]** 価格は重要です。");
    expect(md).not.toContain("[0:10]");
  });
});

describe("safeFileName", () => {
  it("strips characters that are illegal in file names", () => {
    expect(safeFileName('経営学: 第1回 / "intro"')).toBe("経営学_ 第1回 _ _intro_");
    expect(safeFileName("///")).toBe("lecture");
  });
});
