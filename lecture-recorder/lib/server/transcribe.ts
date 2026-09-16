import { promises as fs } from "fs";
import path from "path";
import { toFile } from "openai";
import { CONFIG } from "./config";
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
}

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

  const result = await withRetry(`文字起こし (${path.basename(file)})`, async () => {
    // The SDK's overloads are keyed to a literal response_format, which we pick
    // at runtime, so the request object is assembled untyped and narrowed here.
    const client = openai();
    return (await client.audio.transcriptions.create(
      body as never,
    )) as unknown as {
      text?: string;
      segments?: { start: number; end: number; text: string }[];
    };
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

  return { text, segments };
}
