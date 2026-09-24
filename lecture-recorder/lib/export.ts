import { CATEGORY_LABEL, CATEGORY_ORDER } from "./highlight";
import type {
  Course,
  Flashcards,
  Highlights,
  Lecture,
  LectureFlow,
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
  flow: LectureFlow | null;
}

/** One self-contained text file per lecture, in Japanese. */
export function buildMarkdown({
  lecture,
  course,
  transcript,
  notes,
  highlights,
  flashcards,
  flow,
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

  if (flow) out.push(...flowSection(flow));

  out.push("## 全文");
  out.push("");
  if (!transcript || transcript.segments.length === 0) {
    out.push("（書き起こしがありません）");
  } else {
    for (const s of transcript.segments) {
      out.push(`**[${fmtSec(s.startSec)}]** ${s.source}`);
      out.push("");
    }
  }
  return out.join("\n");
}

function cell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n+/g, " ");
}

/**
 * The flow as text.
 *
 * Every line keeps the marks that make it readable as evidence: where it came
 * from, and whether it was said, calculated or added to join the lecture up.
 */
function flowSection(flow: LectureFlow): string[] {
  const out: string[] = [];
  const mark = (e: { basis: string; sourceSegmentIds: string[]; uncertainty: string | null }) => {
    const parts: string[] = [];
    if (e.basis === "derived_calculation") parts.push("講義の数値からの計算");
    if (e.basis === "ai_explanation") parts.push("AI による補足");
    if (e.sourceSegmentIds.length > 0) parts.push(e.sourceSegmentIds.join(", "));
    const note = parts.length ? ` ［${parts.join(" / ")}］` : "";
    return e.uncertainty ? `${note}（※ ${e.uncertainty}）` : note;
  };
  const line = (e: { text: string; basis: string; sourceSegmentIds: string[]; uncertainty: string | null }) =>
    `${e.text}${mark(e)}`;

  out.push("## 講義の流れ");
  out.push("");
  if (flow.availability === "partial") {
    out.push("> 一部の区間を処理できていません。末尾の「取りこぼしの確認」をご覧ください。");
    out.push("");
  }
  out.push(`### ${flow.title}`);
  out.push("");

  if (flow.mainQuestions.length > 0) {
    out.push("**講義の中心となる問い**");
    out.push("");
    flow.mainQuestions.forEach((q) => out.push(`- ${line(q)}`));
    out.push("");
  }
  if (flow.overview.length > 0) {
    out.push("**講義全体の説明**");
    out.push("");
    flow.overview.forEach((o) => out.push(line(o)));
    out.push("");
  }
  if (flow.sections.length > 0) {
    out.push(`**流れの一覧**: ${flow.sections.map((s) => s.title).join(" → ")}`);
    out.push("");
    out.push("> 矢印は説明の順序です。因果関係ではありません。");
    out.push("");
  }

  for (const chapter of flow.chapters) {
    out.push(`### ${chapter.title}`);
    out.push("");
    for (const sectionId of chapter.sectionIds) {
      const section = flow.sections.find((s) => s.id === sectionId);
      if (!section) continue;
      const number = flow.sections.indexOf(section) + 1;
      out.push(`#### ${number}. ${section.title}`);
      out.push("");
      out.push(`- 説明していること: ${line(section.purpose)}`);
      section.explanation.forEach((e) => out.push(`- ${line(e)}`));
      if (section.connectionFromPrevious) {
        out.push(`- ここに来る理由: ${line(section.connectionFromPrevious)}`);
      }
      for (const detail of section.details) {
        out.push(`- ${detail.label}: ${line(detail.content)}`);
      }
      if (section.connectionToNext) {
        out.push(`- 次につながる理由: ${line(section.connectionToNext)}`);
      }
      out.push("");
    }
  }

  out.push("### 講義の結び");
  out.push("");
  if (flow.conclusion.length === 0) {
    out.push("この書き起こしの範囲には、明示的な結論はありませんでした。");
  } else {
    flow.conclusion.forEach((c) => out.push(`- ${line(c)}`));
  }
  out.push("");

  if (flow.unresolvedQuestions.length > 0) {
    out.push("**残された論点**");
    out.push("");
    flow.unresolvedQuestions.forEach((q) => out.push(`- ${line(q)}`));
    out.push("");
  }
  if (flow.assignments.length > 0) {
    out.push("**課題**");
    out.push("");
    for (const a of flow.assignments) {
      out.push(`- ${line(a.task)}`);
      if (a.deadlineOriginal) {
        const resolved = a.deadlineISO
          ? `（${a.deadlineISO}）`
          : "（この録音だけでは日付を特定できません）";
        out.push(`  - 提出期限:「${a.deadlineOriginal}」${resolved}`);
      }
    }
    out.push("");
  }
  if (flow.examMentions.length > 0) {
    out.push("**試験に関する言及**");
    out.push("");
    flow.examMentions.forEach((e) => out.push(`- ${line(e)}`));
    out.push("");
  }

  const problems = flow.coverage.filter((c) => c.status !== "represented");
  out.push("**取りこぼしの確認**");
  out.push("");
  out.push(
    `- 説明に含まれた区間: ${flow.coverage.length - problems.length} / ${flow.coverage.length}`,
  );
  for (const entry of problems) {
    const label = entry.status === "non_instructional" ? "指導内容なし" : "未整理";
    out.push(`- ${entry.segmentId}: ${label}${entry.reason ? ` — ${entry.reason}` : ""}`);
  }
  flow.warnings.forEach((w) => out.push(`- 注意: ${w}`));
  out.push(
    "- これは区間の集計であり、説明が正しいことや録音が講義全体を捉えていることを示すものではありません。",
  );
  out.push("");
  return out;
}
