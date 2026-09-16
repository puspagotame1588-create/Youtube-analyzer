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
  previousText: string;
  /** Added to every timestamp, so chunk times become lecture times. */
  offsetSec: number;
  /** Ask for per-line timestamps. Only used by the accurate pass. */
  timestamps: boolean;
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

  let usedFallback = false;
  const supportsKeywords = opts.model.startsWith("gpt-transcribe");
  const supportsVerbose = opts.model === "whisper-1" || supportsKeywords;
  const wantVerbose = opts.timestamps && supportsVerbose;

  const body: Record<string, unknown> = {
    file: uploadable,
    model: opts.model,
    language: opts.language,
    prompt: speechPrompt(opts.language, opts.keywords, opts.previousText),
    response_format: wantVerbose ? "verbose_json" : "json",
  };
  if (wantVerbose) body.timestamp_granularities = ["segment"];
  if (supportsKeywords && opts.keywords.length) {
    body.keywords = opts.keywords.slice(0, 100);
  }
  // Loudness normalisation plus voice-activity chunking. This is what makes a
  // microphone in the middle of a 300-seat hall usable.
  if (opts.timestamps) body.chunking_strategy = "auto";

  const run = async (model: string, verbose: boolean) => {
    const client = openai();
    const attemptBody = { ...body, model } as Record<string, unknown>;
    if (!verbose) {
      attemptBody.response_format = "json";
      delete attemptBody.timestamp_granularities;
    }
    if (!model.startsWith("gpt-transcribe")) delete attemptBody.keywords;
    // The SDK overloads are keyed to a literal response_format, which is chosen
    // at runtime here, so the request is assembled untyped and narrowed after.
    return (await client.audio.transcriptions.create(
      attemptBody as never,
    )) as unknown as {
      text?: string;
      segments?: { start: number; end: number; text: string }[];
    };
  };

  const result = await withRetry(`文字起こし (${path.basename(file)})`, async () => {
    try {
      return await run(opts.model, wantVerbose);
    } catch (err) {
      // A model the account cannot use, or a response format it rejects, must
      // not cost the lecture: retry on the long-standing Whisper endpoint.
      const status = err instanceof OpenAI.APIError ? err.status : undefined;
      if (status === 400 || status === 403 || status === 404) {
        usedFallback = true;
        return run(FALLBACK_MODEL, opts.timestamps);
      }
      throw err;
    }
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
