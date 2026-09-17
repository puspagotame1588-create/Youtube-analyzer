import { promises as fs } from "fs";
import path from "path";
import { toFile } from "openai";
import { CONFIG } from "./config";
import OpenAI from "openai";
import { openai, withRetry } from "./openai";
import { speechPrompt } from "./prompts";
import type { LectureLanguage } from "@/lib/types";

export interface RawSegment {
  startSec: number;
  endSec: number;
  text: string;
}

export interface TranscribeResult {
  text: string;
  segments: RawSegment[];
  /** True when the configured model was unavailable and Whisper was used. */
  fallback: boolean;
}

/** Available on every account, and the safety net when a newer model is not. */
export const FALLBACK_MODEL = "whisper-1";

const MIME_BY_EXT: Record<string, string> = {
  webm: "audio/webm",
  ogg: "audio/ogg",
  mp4: "audio/mp4",
  m4a: "audio/m4a",
  wav: "audio/wav",
  mp3: "audio/mpeg",
};

/**
 * Speech-to-text models invent stock phrases when handed silence or noise.
 * A chunk whose text is only one of these is treated as silence.
 */
const FILLER_OUTPUTS = [
  "ご視聴ありがとうございました",
  "ご視聴ありがとうございます",
  "最後までご覧いただきありがとうございました",
  "チャンネル登録お願いします",
  "おやすみなさい",
  "字幕視聴ありがとうございました",
  "thank you for watching",
  "thanks for watching",
  "please subscribe",
  "you",
];

export function isFiller(text: string): boolean {
  const t = text.trim().replace(/[。.!！?？\s]+$/u, "").toLowerCase();
  if (!t) return true;
  if (t.length > 40) return false;
  return FILLER_OUTPUTS.some((p) => t === p.toLowerCase() || t.replace(/\s/g, "") === p.replace(/\s/g, "").toLowerCase());
}

interface TranscribeOptions {
  model: string;
  language: LectureLanguage;
  keywords: string[];
  /** Added to every timestamp, so chunk times become lecture times. */
  offsetSec: number;
  /** Ask for per-line timestamps. Only used by the accurate pass. */
  timestamps: boolean;
}

/**
 * One request shape to try. Optional parameters are the usual reason a model
 * rejects a request, so they are dropped one group at a time rather than
 * resent unchanged.
 */
export interface Attempt {
  model: string;
  /** Ask for verbose_json with per-segment timestamps. */
  verbose: boolean;
  /** Send the course terminology as recognition hints. */
  keywords: boolean;
}

const KEYWORD_MODELS = /^gpt-transcribe/;
const VERBOSE_MODELS = /^(whisper-1|gpt-transcribe)/;

/**
 * The ladder of requests to try, most capable first. Every rung after the first
 * gives something up, so a model that rejects one option still produces a
 * transcript rather than costing the lecture.
 */
export function attemptLadder(
  model: string,
  opts: { timestamps: boolean; hasKeywords: boolean },
): Attempt[] {
  const verbose = opts.timestamps && VERBOSE_MODELS.test(model);
  const ladder: Attempt[] = [
    { model, verbose, keywords: opts.hasKeywords && KEYWORD_MODELS.test(model) },
    // Terminology hints are the cheapest thing to lose. Timestamps are not:
    // without them a whole chunk collapses into one undivided block, so they
    // are given up only after the hints have already gone.
    { model, verbose, keywords: false },
    // Same model, nothing optional attached.
    { model, verbose: false, keywords: false },
    // Whisper still returns segment timestamps, which the accurate pass wants.
    { model: FALLBACK_MODEL, verbose: opts.timestamps, keywords: false },
    { model: FALLBACK_MODEL, verbose: false, keywords: false },
  ];

  const seen = new Set<string>();
  return ladder.filter((a) => {
    const key = `${a.model}|${a.verbose}|${a.keywords}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * How much two lines share, 0 to 1, by longest common subsequence.
 *
 * Used to catch a speech model repeating itself: consecutive lines that are
 * near-identical are an artefact, not a lecturer saying the same sentence
 * twice in a row.
 */
export function similarity(a: string, b: string): number {
  const x = a.replace(/[\s、。,.!?！？]/gu, "");
  const y = b.replace(/[\s、。,.!?！？]/gu, "");
  if (!x || !y) return 0;
  if (x === y) return 1;
  // Guard against pathological input; real captions are far shorter.
  if (x.length > 600 || y.length > 600) return x.slice(0, 600) === y.slice(0, 600) ? 1 : 0;

  let previous = new Array<number>(y.length + 1).fill(0);
  let current = new Array<number>(y.length + 1).fill(0);
  for (let i = 1; i <= x.length; i++) {
    for (let j = 1; j <= y.length; j++) {
      current[j] =
        x[i - 1] === y[j - 1] ? previous[j - 1] + 1 : Math.max(previous[j], current[j - 1]);
    }
    [previous, current] = [current, previous];
    current.fill(0);
  }
  return previous[y.length] / Math.max(x.length, y.length);
}

/** True when a line is effectively a repeat of the one before it. */
export function isRepeat(text: string, previous: string): boolean {
  if (!previous.trim() || !text.trim()) return false;
  return similarity(text, previous) >= 0.85;
}

/** A rejection of the request itself, where a simpler request may still work. */
function rejectsRequest(err: unknown): boolean {
  if (!(err instanceof OpenAI.APIError)) return false;
  const status = err.status ?? 0;
  return status === 400 || status === 403 || status === 404 || status === 422;
}

/** Transcribes one audio file on disk. */
export async function transcribeFile(
  file: string,
  opts: TranscribeOptions,
): Promise<TranscribeResult> {
  const bytes = await fs.readFile(file);
  if (bytes.byteLength > CONFIG.maxUploadBytes) {
    throw new Error(
      `音声が大きすぎます (${(bytes.byteLength / 1024 / 1024).toFixed(1)}MB)。ビットレートを下げるか分割してください。`,
    );
  }
  const ext = path.extname(file).replace(".", "").toLowerCase() || "webm";
  const uploadable = await toFile(bytes, path.basename(file), {
    type: MIME_BY_EXT[ext] ?? "application/octet-stream",
  });
  const prompt = speechPrompt(opts.language, opts.keywords);

  const ladder = attemptLadder(opts.model, {
    timestamps: opts.timestamps,
    hasKeywords: opts.keywords.length > 0,
  });
  let usedFallback = false;

  const run = async (attempt: Attempt) => {
    const body: Record<string, unknown> = {
      file: uploadable,
      model: attempt.model,
      language: opts.language,
      prompt,
      response_format: attempt.verbose ? "verbose_json" : "json",
    };
    if (attempt.verbose) body.timestamp_granularities = ["segment"];
    if (attempt.keywords) body.keywords = opts.keywords.slice(0, 100);

    // The SDK overloads are keyed to a literal response_format, which is chosen
    // at runtime here, so the request is assembled untyped and narrowed after.
    const client = openai();
    return (await client.audio.transcriptions.create(body as never)) as unknown as {
      text?: string;
      segments?: { start: number; end: number; text: string }[];
    };
  };

  const result = await withRetry(`文字起こし (${path.basename(file)})`, async () => {
    let lastError: unknown;
    for (const attempt of ladder) {
      try {
        const response = await run(attempt);
        usedFallback = attempt.model !== opts.model;
        return response;
      } catch (err) {
        lastError = err;
        // A network or rate-limit failure is worth waiting out, so hand it back
        // to the retry wrapper instead of degrading the request.
        if (!rejectsRequest(err)) throw err;
      }
    }
    throw lastError;
  });

  const text = (result.text ?? "").trim();
  const rawSegments = result.segments ?? [];
  const segments: RawSegment[] = rawSegments
    .map((s) => ({
      startSec: opts.offsetSec + (s.start ?? 0),
      endSec: opts.offsetSec + (s.end ?? 0),
      text: (s.text ?? "").trim(),
    }))
    .filter((s) => s.text.length > 0 && !isFiller(s.text));

  return { text, segments, fallback: usedFallback };
}
