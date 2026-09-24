import { describe, expect, it } from "vitest";
import { buildMarkdown, fmtDuration, fmtSec, todayISO } from "@/lib/export";
import type {
  Course,
  Flashcards,
  Highlights,
  Lecture,
  Notes,
  TranscriptFile,
} from "@/lib/types";

const course: Course = {
  id: "c1",
  name: "マーケティング論",
  teacher: "田中先生",
  color: "#000",
  language: "ja",
  keywords: ["知覚価値"],
  createdAt: 0,
};

const lecture: Lecture = {
  id: "l1",
  courseId: "c1",
  number: 3,
  title: "4Pの基礎",
  date: "2026-09-16",
  language: "ja",
  status: "done",
  createdAt: 0,
  updatedAt: 0,
  durationSec: 5400,
  masterBytes: 1024,
  audioMime: "audio/webm",
};

const transcript: TranscriptFile = {
  language: "ja",
  refined: true,
  createdAt: 0,
  segments: [
    { startSec: 0, endSec: 8, source: "今日は4Pを扱います。" },
    { startSec: 620, endSec: 630, source: "価格は知覚価値で決まります。" },
  ],
};

const notes: Notes = {
  title: "4Pの基礎",
  overview: "概要です。",
  detailed: "詳細1。\n\n詳細2。",
  topics: [{ heading: "導入", points: ["4Pとは何か"], startSec: 0 }],
  terms: [{ term: "知覚価値", reading: "ちかくかち", meaning: "顧客が感じる価値", example: "価格設定の話で登場" }],
  assignments: [{ what: "レポート提出", due: "来週金曜", quote: "締め切りは来週の金曜です" }],
  examTopics: [
    { topic: "4Pの定義", basis: "teacher", quote: "ここは試験に出します" },
    { topic: "STPとの関係", basis: "inferred", quote: "" },
  ],
  reviewQuestions: [{ question: "4Pとは？", answer: "製品・価格・流通・販促" }],
  unclear: ["12:30 付近の数式が聞き取れていない"],
  createdAt: 0,
  model: "test",
};

const flashcards: Flashcards = {
  cards: [{ front: "知覚価値とは？", back: "顧客が感じる価値", hint: "価格の話" }],
  createdAt: 0,
  model: "test",
};

const highlights: Highlights = {
  items: [
    {
      startSec: 620,
      endSec: 630,
      quote: "ここは試験に出します",
      cue: "試験",
      category: "exam",
      point: "4Pのうち価格の決まり方（知覚価値との関係）が試験範囲です。",
    },
    {
      startSec: 900,
      endSec: 910,
      quote: "締め切りは来週の金曜です",
      cue: "締切",
      category: "assignment",
      point: "レポートの締切は来週金曜日です。",
    },
  ],
  scanned: 7,
  createdAt: 0,
  model: "test",
};

describe("fmtSec", () => {
  it("formats minutes and hours", () => {
    expect(fmtSec(0)).toBe("0:00");
    expect(fmtSec(65)).toBe("1:05");
    expect(fmtSec(3725)).toBe("1:02:05");
  });
});

describe("fmtDuration", () => {
  it("reads as Japanese duration", () => {
    expect(fmtDuration(45 * 60)).toBe("45分");
    expect(fmtDuration(90 * 60)).toBe("1時間30分");
  });
});

describe("todayISO", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(todayISO(new Date(2026, 8, 3))).toBe("2026-09-03");
  });
});

describe("buildMarkdown", () => {
  const md = buildMarkdown({ lecture, course, transcript, notes, highlights, flashcards, flow: null });

  it("includes the lecture heading and metadata", () => {
    expect(md).toContain("# マーケティング論 第3回 4Pの基礎");
    expect(md).toContain("- 担当: 田中先生");
    expect(md).toContain("1時間30分");
  });

  it("keeps the teacher's own exam statements apart from AI guesses", () => {
    const saidAt = md.indexOf("### 先生が明言したもの");
    const guessAt = md.indexOf("### AI の推測");
    expect(saidAt).toBeGreaterThan(-1);
    expect(guessAt).toBeGreaterThan(saidAt);
    expect(md.slice(saidAt, guessAt)).toContain("4Pの定義");
    expect(md.slice(saidAt, guessAt)).not.toContain("STPとの関係");
    expect(md.slice(guessAt)).toContain("STPとの関係");
  });

  it("carries assignments, terms, unclear parts and the timestamped transcript", () => {
    expect(md).toContain("**レポート提出** — 締切: 来週金曜");
    expect(md).toContain("| 知覚価値 | ちかくかち |");
    expect(md).toContain("聞き取れなかった箇所");
    expect(md).toContain("**[0:00]** 今日は4Pを扱います。");
    expect(md).toContain("**[10:20]** 価格は知覚価値で決まります。");
  });

  it("warns when only live captions were available", () => {
    const rough = buildMarkdown({
      lecture,
      course,
      transcript: { ...transcript, refined: false },
      notes: null,
      highlights: null,
      flashcards: null,
      flow: null,
    });
    expect(rough).toContain("精密文字起こしが未完了");
  });

  it("writes the flagged passages with their timestamps and the teacher's words", () => {
    expect(md).toContain("## 重要ポイント（先生が強調した箇所）");
    expect(md).toContain("### 試験に出る");
    expect(md).toContain("**[10:20]** 4Pのうち価格の決まり方");
    expect(md).toContain("先生の発言:「ここは試験に出します」");
    expect(md).toContain("### 課題・締切");
  });

  it("omits the section entirely when nothing was flagged", () => {
    const none = buildMarkdown({
      lecture,
      course,
      transcript,
      notes,
      highlights: { items: [], scanned: 3, createdAt: 0, model: "t" },
      flashcards: null,
      flow: null,
    });
    expect(none).not.toContain("重要ポイント（先生が強調した箇所）");
  });

  it("escapes a pipe so the term table stays valid", () => {
    const md2 = buildMarkdown({
      lecture,
      course,
      transcript,
      notes: { ...notes, terms: [{ term: "A|B", reading: "", meaning: "", example: "" }] },
      highlights: null,
      flashcards: null,
      flow: null,
    });
    expect(md2).toContain("| A\\|B |");
  });
});
