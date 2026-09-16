import { promises as fs } from "fs";
import { CONFIG } from "./config";
import { llmJson, llmText } from "./llm";
import { materialsContext } from "./materials";
import {
  CHAT_SYSTEM,
  FLASHCARDS_SYSTEM,
  LIVE_TRANSLATE_SYSTEM,
  NOTES_SYSTEM,
  PROOFREAD_SYSTEM,
} from "./prompts";
import {
  appendLiveSegment,
  listChunks,
  patchLecture,
  readCourses,
  readLecture,
  readLiveSegments,
  readNotes,
  readPassIndex,
  readTranscript,
  removeWorkingChunks,
  writeFlashcards,
  writeNotes,
  writeTranscript,
} from "./store";
import { isFiller, transcribeFile, type RawSegment } from "./transcribe";
import { describe } from "./openai";
import {
  ChatAnswerSchema,
  FlashcardsSchema,
  NotesSchema,
  ProofreadSchema,
  TranslateSchema,
  type ChatAnswer,
} from "@/lib/schemas";
import type {
  Course,
  Flashcards,
  LiveSegment,
  Notes,
  TranscriptSegment,
} from "@/lib/types";

async function courseOf(courseId: string): Promise<Course | undefined> {
  const courses = await readCourses();
  return courses.find((c) => c.id === courseId);
}

/* ------------------------------------------------------------ live pass --- */

/**
 * Live captions run one chunk at a time so that chunk N's text can steer the
 * recognition of chunk N+1. The queue lives only in memory: audio is already on
 * disk, so a crash costs captions, never the recording.
 */
const liveQueues = new Map<string, Promise<void>>();
const lastText = new Map<string, { source: string; translation: string }>();
const waiting = new Map<string, number>();

/**
 * When more than this many chunks are waiting, the captions are falling behind
 * the lecture. Translation is dropped for those chunks so the Japanese column,
 * which matters most, catches back up. The full translation is produced after
 * the lecture anyway.
 */
const BEHIND_THRESHOLD = 3;

export function enqueueLiveChunk(input: {
  lectureId: string;
  idx: number;
  file: string;
  startSec: number;
  endSec: number;
}): void {
  const { lectureId } = input;
  waiting.set(lectureId, (waiting.get(lectureId) ?? 0) + 1);
  const previous = liveQueues.get(lectureId) ?? Promise.resolve();
  const next = previous
    .then(() => processLiveChunk(input, (waiting.get(lectureId) ?? 1) - 1))
    .catch(() => undefined)
    .finally(() => {
      waiting.set(lectureId, Math.max(0, (waiting.get(lectureId) ?? 1) - 1));
    });
  liveQueues.set(lectureId, next);
}

async function processLiveChunk(
  input: {
    lectureId: string;
    idx: number;
    file: string;
    startSec: number;
    endSec: number;
  },
  queueDepth: number,
): Promise<void> {
  const { lectureId, idx, file, startSec, endSec } = input;
  const lecture = await readLecture(lectureId);
  if (!lecture) return;
  const course = await courseOf(lecture.courseId);
  const carry = lastText.get(lectureId) ?? { source: "", translation: "" };

  const write = (seg: Omit<LiveSegment, "idx" | "startSec" | "endSec">) =>
    appendLiveSegment(lectureId, { idx, startSec, endSec, ...seg });

  try {
    const { text } = await transcribeFile(file, {
      model: CONFIG.liveTranscribeModel,
      language: lecture.language,
      keywords: course?.keywords ?? [],
      previousText: carry.source,
      offsetSec: startSec,
      timestamps: false,
    });
    if (!text || isFiller(text)) {
      await write({ source: "", translation: "", status: "silent" });
      return;
    }
    await write({ source: text, translation: "", status: "pending" });

    let translation = "";
    if (queueDepth > BEHIND_THRESHOLD) {
      lastText.set(lectureId, { source: text, translation: "" });
      await write({ source: text, translation: "", status: "done" });
      return;
    }
    try {
      const out = await llmText({
        model: CONFIG.fastModel,
        instructions: LIVE_TRANSLATE_SYSTEM(lecture.language),
        input: `直前の断片（文脈用、訳出済み）:\n${carry.source}\n→ ${carry.translation}\n\n今回の断片:\n${text}`,
        maxOutputTokens: 800,
        effort: "none",
        label: "ライブ翻訳",
      });
      translation = out === "-" ? "" : out;
    } catch {
      // A failed translation must not lose the recognised text.
      translation = "";
    }

    lastText.set(lectureId, { source: text, translation });
    await write({ source: text, translation, status: "done" });
  } catch (err) {
    await write({ source: "", translation: "", status: "error", error: describe(err) });
    await patchLecture(lectureId, (l) => ({
      pendingChunks: (l.pendingChunks ?? 0) + 1,
    })).catch(() => undefined);
  }
}

export function liveQueueDepth(lectureId: string): Promise<void> | undefined {
  return liveQueues.get(lectureId);
}

/** Waits for every queued live chunk of a lecture to finish. */
export async function drainLiveQueue(lectureId: string): Promise<void> {
  let pending = liveQueues.get(lectureId);
  while (pending) {
    await pending.catch(() => undefined);
    const current = liveQueues.get(lectureId);
    pending = current === pending ? undefined : current;
  }
  lastText.delete(lectureId);
  waiting.delete(lectureId);
}

/* -------------------------------------------------------- accurate pass --- */

const running = new Set<string>();

export function isFinalizing(lectureId: string): boolean {
  return running.has(lectureId);
}

/**
 * Runs after the lecture ends: re-transcribes the long chunks (far fewer cut
 * points than the live ones), proofreads, translates, then writes the notes.
 */
export async function finalizeLecture(lectureId: string): Promise<void> {
  if (running.has(lectureId)) return;
  running.add(lectureId);
  try {
    await runFinalize(lectureId);
  } catch (err) {
    await patchLecture(lectureId, { status: "error", error: describe(err), progress: null }).catch(
      () => undefined,
    );
  } finally {
    running.delete(lectureId);
  }
}

async function runFinalize(lectureId: string): Promise<void> {
  const lecture = await readLecture(lectureId);
  if (!lecture) throw new Error("Lecture not found");
  const course = await courseOf(lecture.courseId);
  const keywords = course?.keywords ?? [];

  await drainLiveQueue(lectureId);

  const progress = (step: string, done: number, total: number) =>
    patchLecture(lectureId, { progress: { step, done, total }, error: null });

  /* 1. Re-transcribe the long chunks. */
  await patchLecture(lectureId, { status: "transcribing" });
  const passFiles = await listChunks(lectureId, "pass");
  let segments: TranscriptSegment[] = [];
  let refined = false;

  let usedFallbackModel = false;
  if (passFiles.length > 0) {
    const raw: RawSegment[] = [];
    const passIndex = await readPassIndex(lectureId);
    let carry = "";
    for (let i = 0; i < passFiles.length; i++) {
      await progress("音声を精密に文字起こし中", i, passFiles.length);
      const entry = passIndex.find((e) => e.idx === i);
      const offsetSec = entry ? entry.startSec : i * CONFIG.passChunkSec;
      const result = await transcribeFile(passFiles[i], {
        model: CONFIG.transcribeModel,
        language: lecture.language,
        keywords,
        previousText: carry,
        offsetSec,
        timestamps: true,
      });
      if (result.segments.length > 0) {
        raw.push(...result.segments);
      } else if (result.text && !isFiller(result.text)) {
        // Model returned no timestamps: keep the text against the chunk window.
        raw.push({
          startSec: offsetSec,
          endSec: entry ? entry.endSec : offsetSec + CONFIG.passChunkSec,
          text: result.text,
        });
      }
      carry = result.text.slice(-200);
      if (result.fallback) usedFallbackModel = true;
    }
    segments = raw.map((s) => ({
      startSec: Math.round(s.startSec * 10) / 10,
      endSec: Math.round(s.endSec * 10) / 10,
      source: s.text,
      translation: "",
    }));
    refined = segments.length > 0;
  }

  if (!refined) {
    // Nothing to re-transcribe (interrupted recording): keep the live captions
    // so the lecture is never lost, and say so in the UI.
    const live = await readLiveSegments(lectureId);
    segments = live
      .filter((s) => s.status !== "silent" && s.source.trim())
      .map((s) => ({
        startSec: s.startSec,
        endSec: s.endSec,
        source: s.source,
        translation: s.translation,
      }));
  }

  if (segments.length === 0) {
    throw new Error(
      "音声から文字を認識できませんでした。マイクの入力レベルと選択したデバイスを確認してください。",
    );
  }

  /* 2. Proofread in batches. */
  if (refined) {
    segments = await proofread(lectureId, segments, lecture.language, keywords, progress);
  }
  await writeTranscript(lectureId, {
    language: lecture.language,
    segments,
    refined,
    createdAt: Date.now(),
  });

  /* 3. Translate into the other language. */
  segments = await translate(lectureId, segments, lecture.language, progress);
  await writeTranscript(lectureId, {
    language: lecture.language,
    segments,
    refined,
    createdAt: Date.now(),
  });

  /* 4. Notes. */
  await patchLecture(lectureId, { status: "analyzing" });
  await progress("ノートを作成中", 0, 1);
  const notes = await buildNotes(lectureId, segments, lecture.language, keywords, {
    course: course?.name ?? "",
    teacher: course?.teacher ?? "",
    number: lecture.number,
    date: lecture.date,
  });
  await writeNotes(lectureId, notes);

  /* 5. The working chunks have served their purpose; the master stays. */
  if (refined) await removeWorkingChunks(lectureId).catch(() => undefined);

  await patchLecture(lectureId, {
    status: "done",
    progress: null,
    error: null,
    note: usedFallbackModel
      ? "設定されたモデルが使えなかったため、whisper-1 で文字起こししました。設定画面のモデル名をご確認ください。"
      : null,
    title: lecture.title.trim() || notes.title,
  });
}

type ProgressFn = (step: string, done: number, total: number) => Promise<unknown>;

const BATCH = 40;

async function proofread(
  lectureId: string,
  segments: TranscriptSegment[],
  language: "ja" | "en",
  keywords: string[],
  progress: ProgressFn,
): Promise<TranscriptSegment[]> {
  const out = [...segments];
  const batches = Math.ceil(segments.length / BATCH);
  for (let b = 0; b < batches; b++) {
    await progress("書き起こしを校正中", b, batches);
    const start = b * BATCH;
    const slice = segments.slice(start, start + BATCH);
    const context = start > 0 ? segments[start - 1].source : "";
    const input = [
      context ? `直前の行（文脈用、修正対象外）: ${context}` : "",
      "以下の行を校正してください。",
      ...slice.map((s, i) => `${start + i}\t${s.source}`),
    ]
      .filter(Boolean)
      .join("\n");
    try {
      const result = await llmJson(ProofreadSchema, {
        instructions: PROOFREAD_SYSTEM(language, keywords),
        input,
        schemaName: "proofread",
        maxOutputTokens: 8000,
        effort: "low",
        label: "校正",
      });
      for (const line of result.lines) {
        const target = out[line.i];
        if (target && line.text.trim()) target.source = line.text.trim();
      }
    } catch {
      // Proofreading is an improvement, not a requirement: keep the raw text.
    }
  }
  return out;
}

async function translate(
  lectureId: string,
  segments: TranscriptSegment[],
  language: "ja" | "en",
  progress: ProgressFn,
): Promise<TranscriptSegment[]> {
  const out = [...segments];
  const batches = Math.ceil(segments.length / BATCH);
  const target = language === "ja" ? "英語" : "日本語";
  for (let b = 0; b < batches; b++) {
    await progress(`全文を${target}に翻訳中`, b, batches);
    const start = b * BATCH;
    const slice = segments.slice(start, start + BATCH);
    const input = [
      `次の各行を${target}に翻訳してください。行番号 i はそのまま返すこと。行を結合・分割しないこと。訳文のみを返し、注釈は付けないこと。`,
      ...slice.map((s, i) => `${start + i}\t${s.source}`),
    ].join("\n");
    try {
      const result = await llmJson(TranslateSchema, {
        instructions: `あなたは大学講義の翻訳者です。原文の意味と専門用語を正確に保ち、自然な${target}に訳します。内容を追加・省略しないこと。`,
        input,
        schemaName: "translation",
        maxOutputTokens: 8000,
        effort: "low",
        label: "翻訳",
      });
      for (const line of result.lines) {
        const item = out[line.i];
        if (item) item.translation = line.text.trim();
      }
    } catch {
      // Translation is secondary to the source transcript.
    }
  }
  return out;
}

export function transcriptText(segments: TranscriptSegment[]): string {
  return segments
    .map((s) => `[${formatSec(s.startSec)}] ${s.source}`)
    .join("\n");
}

export function formatSec(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rest = String(s % 60).padStart(2, "0");
  return `${m}:${rest}`;
}

async function buildNotes(
  lectureId: string,
  segments: TranscriptSegment[],
  language: "ja" | "en",
  keywords: string[],
  meta: { course: string; teacher: string; number: number; date: string },
): Promise<Notes> {
  const materials = await materialsContext(lectureId, 24000);
  const header = [
    `科目: ${meta.course || "(未設定)"}`,
    meta.teacher ? `担当: ${meta.teacher}` : "",
    `回: 第${meta.number}回`,
    `日付: ${meta.date}`,
    `講義の言語: ${language === "ja" ? "日本語" : "英語"}`,
  ]
    .filter(Boolean)
    .join("\n");

  const input = [
    header,
    materials
      ? `\n===== 配布資料（補助。矛盾する場合は書き起こしを優先）=====\n${materials}`
      : "",
    `\n===== 書き起こし（[分:秒] 付き、${segments.length} 行）=====\n${transcriptText(segments)}`,
  ].join("\n");

  const result = await llmJson(NotesSchema, {
    instructions: NOTES_SYSTEM(language, keywords),
    input,
    schemaName: "lecture_notes",
    maxOutputTokens: 24000,
    effort: "medium",
    label: "ノート作成",
  });

  return { ...result, createdAt: Date.now(), model: CONFIG.llmModel };
}

/* ------------------------------------------------------- on-demand tools -- */

export async function generateFlashcards(lectureId: string): Promise<Flashcards> {
  const transcript = await readTranscript(lectureId);
  if (!transcript) throw new Error("先に文字起こしを完了してください。");
  const notes = await readNotes(lectureId);
  const input = [
    notes ? `===== ノート =====\n${JSON.stringify(notes, null, 1).slice(0, 12000)}` : "",
    `===== 書き起こし =====\n${transcriptText(transcript.segments).slice(0, 60000)}`,
    "この講義の復習用フラッシュカードを 15〜30 枚作ってください。",
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = await llmJson(FlashcardsSchema, {
    instructions: FLASHCARDS_SYSTEM,
    input,
    schemaName: "flashcards",
    maxOutputTokens: 12000,
    effort: "low",
    label: "フラッシュカード作成",
  });
  const cards: Flashcards = { ...result, createdAt: Date.now(), model: CONFIG.llmModel };
  await writeFlashcards(lectureId, cards);
  return cards;
}

export async function answerQuestion(
  lectureId: string,
  question: string,
  history: { role: "user" | "assistant"; content: string }[],
): Promise<ChatAnswer> {
  const transcript = await readTranscript(lectureId);
  if (!transcript) throw new Error("先に文字起こしを完了してください。");
  const materials = await materialsContext(lectureId, 20000);
  const recent = history
    .slice(-6)
    .map((t) => `${t.role === "user" ? "学生" : "アシスタント"}: ${t.content}`)
    .join("\n");

  const input = [
    `===== 講義の書き起こし（[分:秒] 付き）=====\n${transcriptText(transcript.segments).slice(0, 120000)}`,
    materials ? `===== 配布資料 =====\n${materials}` : "",
    recent ? `===== これまでのやり取り =====\n${recent}` : "",
    `===== 学生の質問 =====\n${question}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return llmJson(ChatAnswerSchema, {
    instructions: CHAT_SYSTEM,
    input,
    schemaName: "lecture_answer",
    maxOutputTokens: 6000,
    effort: "low",
    label: "質問への回答",
  });
}

/** Frees the audio chunk files if the user abandons a recording. */
export async function discardWorkingChunks(lectureId: string): Promise<void> {
  await removeWorkingChunks(lectureId).catch(() => undefined);
}

export async function masterExists(file: string): Promise<boolean> {
  try {
    const stat = await fs.stat(file);
    return stat.size > 0;
  } catch {
    return false;
  }
}
