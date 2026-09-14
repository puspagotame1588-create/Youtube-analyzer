import type { Course, Lecture, Segment } from "./types";

/** 65 -> "1:05", 3725 -> "1:02:05" */
export function fmtTime(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

/** 90 -> "1h 30m", 45 -> "45m", 30 -> "0m" */
export function fmtDuration(totalSec: number): string {
  const m = Math.round(totalSec / 60);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
}

export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Phrases that speech-to-text models are known to invent on silence or noise
 * (YouTube-style sign-offs). When the chunk was quiet and the output is one of
 * these, we treat the chunk as silent rather than storing junk.
 */
export const HALLUCINATION_PHRASES = [
  "ご視聴ありがとうございました",
  "ご視聴ありがとうございます",
  "チャンネル登録",
  "おやすみなさい",
  "字幕",
  "最後までご覧いただき",
  "Thank you for watching",
  "Thanks for watching",
];

export const QUIET_PEAK = 0.05;

export function isLikelyHallucination(text: string, peak: number): boolean {
  const t = text.trim();
  if (!t) return true;
  if (peak >= QUIET_PEAK) return false;
  return HALLUCINATION_PHRASES.some((p) =>
    t.toLowerCase().includes(p.toLowerCase()),
  );
}

export function spokenSegments(segments: Segment[]): Segment[] {
  return segments.filter((s) => s.status !== "silent" && s.ja.trim().length > 0);
}

/** Markdown export of a whole lecture (metadata, summary, main points, transcript). */
export function lectureToMarkdown(lecture: Lecture, course?: Course): string {
  const lines: string[] = [];
  const courseName = course?.name ?? "";
  lines.push(`# ${courseName} 第${lecture.number}回 — ${lecture.title}`);
  lines.push("");
  lines.push(`- 日付 / Date: ${lecture.date}`);
  if (course?.teacher) lines.push(`- 担当 / Teacher: ${course.teacher}`);
  lines.push(`- 長さ / Duration: ${fmtDuration(lecture.durationSec)}`);
  lines.push("");

  const a = lecture.analysis;
  if (a) {
    lines.push("## 要約 / Summary");
    lines.push("");
    lines.push("### 日本語");
    lines.push(a.summary.ja);
    lines.push("");
    lines.push("### English");
    lines.push(a.summary.en);
    lines.push("");
    lines.push("## 主なポイント / Main points");
    lines.push("");
    a.mainPoints.forEach((p, i) => {
      lines.push(`${i + 1}. ${p.ja}`);
      lines.push(`   - ${p.en}`);
    });
    lines.push("");
    if (a.topics.length) {
      lines.push("## トピック / Topics");
      lines.push("");
      a.topics.forEach((t) => {
        lines.push(`### ${t.heading.ja} / ${t.heading.en}`);
        lines.push(t.detail.ja);
        lines.push("");
        lines.push(t.detail.en);
        lines.push("");
      });
    }
  }

  lines.push("## 全文 / Full transcript");
  lines.push("");
  for (const s of spokenSegments(lecture.segments)) {
    lines.push(`**[${fmtTime(s.startSec)}]** ${s.ja}`);
    if (s.en) lines.push(`> ${s.en}`);
    lines.push("");
  }
  return lines.join("\n");
}

export function safeFileName(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]+/g, "_").trim();
  return /[^_\s]/.test(cleaned) ? cleaned : "lecture";
}
