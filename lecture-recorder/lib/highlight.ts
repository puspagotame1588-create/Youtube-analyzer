import type { LectureLanguage } from "./types";

/**
 * Cue phrases a lecturer uses when flagging something worth studying.
 *
 * These only find candidates. Whether a candidate is genuinely worth keeping,
 * and what exactly it refers to, is decided afterwards by reading the
 * surrounding transcript: "ここは試験に出します" says nothing on its own.
 */
export const CUES: Record<HighlightCategory, { ja: string[]; en: string[] }> = {
  exam: {
    ja: [
      "試験", "テスト", "期末", "中間", "小テスト", "出題", "出します", "出ます",
      "出るよ", "問われ", "採点", "成績", "評価",
    ],
    en: ["exam", "test", "quiz", "midterm", "final", "graded", "assessment"],
  },
  important: {
    ja: ["重要", "大事", "大切", "ポイント", "肝心", "要点", "注目", "押さえ"],
    en: ["important", "key point", "crucial", "essential", "significant", "note this"],
  },
  memorize: {
    ja: ["覚え", "暗記", "記憶", "忘れないで", "頭に入れ", "線を引", "マーカー"],
    en: ["memorize", "remember", "learn by heart", "underline", "write this down"],
  },
  assignment: {
    ja: ["課題", "レポート", "提出", "締切", "締め切り", "期限", "宿題", "来週まで"],
    en: ["assignment", "homework", "submit", "deadline", "due", "hand in"],
  },
  caution: {
    ja: ["注意", "気をつけ", "間違えやすい", "よくある間違い", "混同", "勘違い", "引っかか"],
    en: ["careful", "common mistake", "confuse", "watch out", "pitfall", "tricky"],
  },
};

export type HighlightCategory =
  | "exam"
  | "important"
  | "memorize"
  | "assignment"
  | "caution";

export const CATEGORY_ORDER: HighlightCategory[] = [
  "exam",
  "assignment",
  "memorize",
  "important",
  "caution",
];

export const CATEGORY_LABEL: Record<HighlightCategory, string> = {
  exam: "試験に出る",
  assignment: "課題・締切",
  memorize: "覚える",
  important: "重要",
  caution: "間違えやすい",
};

/**
 * Cues found in one line. Returns every match, because a sentence can be both
 * an exam cue and a deadline ("試験範囲は来週までに確認してください").
 */
export function findCues(
  text: string,
  language: LectureLanguage,
): { category: HighlightCategory; cue: string }[] {
  const haystack = language === "en" ? text.toLowerCase() : text;
  const found: { category: HighlightCategory; cue: string }[] = [];
  for (const category of CATEGORY_ORDER) {
    const list = language === "en" ? CUES[category].en : CUES[category].ja;
    for (const cue of list) {
      const needle = language === "en" ? cue.toLowerCase() : cue;
      if (haystack.includes(needle)) {
        found.push({ category, cue });
        break; // one cue per category is enough to flag the line
      }
    }
  }
  return found;
}

/** Whether a line is worth showing to the AI at all. */
export function hasCue(text: string, language: LectureLanguage): boolean {
  return findCues(text, language).length > 0;
}

/**
 * Groups candidate line numbers into windows that carry enough surrounding
 * speech to tell what the teacher was pointing at. Overlapping windows merge,
 * so a burst of cues in one explanation is examined once rather than five times.
 */
export function contextWindows(
  candidates: number[],
  total: number,
  before = 3,
  after = 3,
): { start: number; end: number; cueLines: number[] }[] {
  const sorted = [...new Set(candidates)].sort((a, b) => a - b);
  const windows: { start: number; end: number; cueLines: number[] }[] = [];
  for (const index of sorted) {
    const start = Math.max(0, index - before);
    const end = Math.min(total - 1, index + after);
    const last = windows.at(-1);
    if (last && start <= last.end + 1) {
      last.end = Math.max(last.end, end);
      last.cueLines.push(index);
    } else {
      windows.push({ start, end, cueLines: [index] });
    }
  }
  return windows;
}

/** Collapses whitespace so a quote can be compared against the transcript. */
export function normalize(text: string): string {
  return text.replace(/\s+/gu, "").trim();
}
