/** Model and runtime configuration, all overridable from .env.local. */

export const CONFIG = {
  /** Speech model for the 8–15 second live caption chunks: chosen for latency. */
  liveTranscribeModel:
    process.env.OPENAI_LIVE_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe",
  /**
   * Speech model for the accurate pass after the lecture. gpt-transcribe accepts
   * `keywords`, which is what makes course terminology come out right.
   */
  transcribeModel: process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-transcribe",
  /** Writing model for notes, proofreading and chat. */
  llmModel: process.env.OPENAI_LLM_MODEL || "gpt-5.6-terra",
  /** Cheap, fast model for live translation of each caption. */
  fastModel: process.env.OPENAI_FAST_LLM_MODEL || "gpt-5.6-luna",

  /** Seconds of audio per live caption chunk. */
  liveChunkSec: Number(process.env.LIVE_CHUNK_SEC || 10),
  /** Seconds of audio per accurate-pass chunk. Must stay under the API duration cap. */
  passChunkSec: Number(process.env.PASS_CHUNK_SEC || 600),
  /** Opus bitrate for every recorder. 32 kbps mono is transparent for speech. */
  audioBitsPerSecond: Number(process.env.AUDIO_BITRATE || 32000),

  /** Hard limits of the transcription endpoint, used to pick a safe strategy. */
  maxUploadBytes: 24 * 1024 * 1024,
  maxAudioSeconds: 1350,

  /** Retry policy for calls that leave this computer. */
  maxAttempts: Number(process.env.OPENAI_MAX_ATTEMPTS || 6),
} as const;

export function hasKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
