import { CATEGORY_LABEL, CATEGORY_ORDER } from "./highlight";
import type {
  Course,
  Flashcards,
  Highlights,
  Lecture,
  Notes,
  TranscriptFile,
} from "./types";

export function fmtSec(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = String(s % 60).padStart(2, "0");
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${rest}`
    : `${m}:${rest}`;
}

export function fmtDuration(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}秒`;
  const m = Math.round(sec / 60);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}時間${m % 60}分` : `${m}分`;
}

export function fmtBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function todayISO(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface ExportInput {
  lecture: Lecture;
  course?: Course;
  transcript: TranscriptFile | null;
  notes: Notes | null;
  highlights: Highlights | null;
  flashcards: Flashcards | null;
}

/** One self-contained text file per lecture, in Japanese. */
export function buildMarkdown({
  lecture,
  course,
  transcript,
  notes,
  highlights,
  flashcards,
}: ExportInput): string {
  const out: string[] = [];
  const title = lecture.title || notes?.title || `第${lecture.number}回`;
  out.push(`# ${course?.name ?? ""} 第${lecture.number}回 ${title}`.trim());
  out.push("");
  out.push(`- 日付: ${lecture.date}`);
  if (course?.teacher) out.push(`- 担当: ${course.teacher}`);
  out.push(`- 長さ: ${fmtDuration(lecture.durationSec)}`);
  out.push(`- 講義の言語: ${lecture.language === "ja" ? "日本語" : "英語"}`);
  if (transcript && !transcript.refined) {
    out.push("- 注意: 精密文字起こしが未完了のため、ライブ字幕をそのまま収録しています。");
  }
  out.push("");

  if (highlights && highlights.items.length > 0) {
    out.push("## 重要ポイント（先生が強調した箇所）");
    out.push("");
    for (const category of CATEGORY_ORDER) {
      const items = highlights.items.filter((i) => i.category === category);
      if (items.length === 0) continue;
      out.push(`### ${CATEGORY_LABEL[category]}`);
      out.push("");
      for (const item of items) {
        out.push(`- **[${fmtSec(item.startSec)}]** ${item.point}`);
        out.push(`  - 先生の発言:「${item.quote}」`);
      }
      out.push("");
    }
  }

  if (notes) {
    out.push("## 概要");
    out.push("");
    out.push(notes.overview);
    out.push("");
    out.push("## 詳細要約");
    out.push("");
    out.push(notes.detailed);
    out.push("");

    if (notes.topics.length) {
      out.push("## トピック別の要点");
      out.push("");
      notes.topics.forEach((t, i) => {
        const at = t.startSec === null ? "" : `（${fmtSec(t.startSec)}〜）`;
        out.push(`### ${i + 1}. ${t.heading} ${at}`.trim());
        t.points.forEach((p) => out.push(`- ${p}`));
        out.push("");
      });
    }
    if (notes.terms.length) {
      out.push("## 用語集");
      out.push("");
      out.push("| 用語 | 読み | 意味 | 講義での使われ方 |");
      out.push("| --- | --- | --- | --- |");
      notes.terms.forEach((t) =>
        out.push(
          `| ${cell(t.term)} | ${cell(t.reading)} | ${cell(t.meaning)} | ${cell(t.example)} |`,
        ),
      );
      out.push("");
    }
    if (notes.assignments.length) {
      out.push("## 課題・締切");
      out.push("");
      notes.assignments.forEach((a) => {
        out.push(`- **${a.what}** — 締切: ${a.due || "明示なし"}`);
        if (a.quote) out.push(`  - 先生の発言: 「${a.quote}」`);
      });
      out.push("");
    }
    if (notes.examTopics.length) {
      out.push("## 試験に出そうな項目");
      out.push("");
      out.push("### 先生が明言したもの");
      const said = notes.examTopics.filter((t) => t.basis === "teacher");
      if (said.length === 0) out.push("- （明言はありませんでした）");
      said.forEach((t) => {
        out.push(`- ${t.topic}`);
        if (t.quote) out.push(`  - 発言: 「${t.quote}」`);
      });
      out.push("");
      out.push("### AI の推測（先生の発言ではありません）");
      const guessed = notes.examTopics.filter((t) => t.basis === "inferred");
      if (guessed.length === 0) out.push("- （なし）");
      guessed.forEach((t) => out.push(`- ${t.topic}`));
      out.push("");
    }
    if (notes.reviewQuestions.length) {
      out.push("## 復習問題");
      out.push("");
      notes.reviewQuestions.forEach((q, i) => {
        out.push(`${i + 1}. ${q.question}`);
        out.push(`   - 答え: ${q.answer}`);
      });
      out.push("");
    }
    if (notes.unclear.length) {
      out.push("## 聞き取れなかった箇所");
      out.push("");
      notes.unclear.forEach((u) => out.push(`- ${u}`));
      out.push("");
    }
  }

  if (flashcards?.cards.length) {
    out.push("## フラッシュカード");
    out.push("");
    flashcards.cards.forEach((c, i) => {
      out.push(`${i + 1}. 表: ${c.front}`);
      out.push(`   - 裏: ${c.back}`);
      if (c.hint) out.push(`   - ヒント: ${c.hint}`);
    });
    out.push("");
  }

  out.push("## 全文");
  out.push("");
  if (!transcript || transcript.segments.length === 0) {
    out.push("（書き起こしがありません）");
  } else {
    for (const s of transcript.segments) {
      out.push(`**[${fmtSec(s.startSec)}]** ${s.source}`);
      if (s.translation) out.push(`> ${s.translation}`);
      out.push("");
    }
  }
  return out.join("\n");
}

function cell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n+/g, " ");
}
