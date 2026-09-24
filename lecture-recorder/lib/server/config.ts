/** Model and runtime configuration, all overridable from .env.local. */

export const CONFIG = {
  /**
   * Speech model for the live caption chunks.
   *
   * gpt-transcribe, not the mini variant: Japanese from the back of a lecture
   * hall is the hardest case this app has, and mini gets kanji, technical terms
   * and homophones wrong often enough to make the captions useless. It is also
   * the only family that accepts `keywords`, so the course terminology can be
   * fed in on the live pass too.
   */
  liveTranscribeModel: process.env.OPENAI_LIVE_TRANSCRIBE_MODEL || "gpt-transcribe",
  /** Speech model for the accurate pass after the lecture. */
  transcribeModel: process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-transcribe",
  /** Writing model for notes, proofreading and chat. */
  llmModel: process.env.OPENAI_LLM_MODEL || "gpt-5.6-terra",

  /**
   * Seconds of audio per live caption chunk. Japanese puts the verb last, so a
   * chunk that stops mid-sentence hands the model a clause with no predicate.
   * Longer chunks are noticeably more accurate; this is the longest that still
   * feels live.
   */
  liveChunkSec: Number(process.env.LIVE_CHUNK_SEC || 15),
  /** Seconds of audio per accurate-pass chunk. Must stay under the API duration cap. */
  passChunkSec: Number(process.env.PASS_CHUNK_SEC || 600),
  /**
   * Opus bitrate for every recorder. 32 kbps is transparent for a close voice,
   * but a lecturer 10 m away arrives quiet and mixed with room noise, and the
   * codec spends its bits on the noise. 64 kbps keeps the consonants that tell
   * Japanese syllables apart, and still leaves a 10-minute chunk around 5 MB.
   */
  audioBitsPerSecond: Number(process.env.AUDIO_BITRATE || 64000),

  /**
   * Lecture Flow. The transcript is fed to the model in chunks measured in
   * characters, because a segment can be five characters or five hundred.
   * These are deliberately well inside the model's context: a smaller window
   * is read more carefully than a larger one.
   */
  flowChunkChars: Number(process.env.FLOW_CHUNK_CHARS || 6000),
  flowChunkSegments: Number(process.env.FLOW_CHUNK_SEGMENTS || 90),
  /** Neighbouring segments sent for context, so transitions make sense. */
  flowContextSegments: Number(process.env.FLOW_CONTEXT_SEGMENTS || 4),
  /** Sections written per request. Batched so a long lecture is not truncated. */
  flowSectionsPerCall: Number(process.env.FLOW_SECTIONS_PER_CALL || 4),

  /** Hard limits of the transcription endpoint, used to pick a safe strategy. */
  maxUploadBytes: 24 * 1024 * 1024,
  maxAudioSeconds: 1350,

  /** Retry policy for calls that leave this computer. */
  maxAttempts: Number(process.env.OPENAI_MAX_ATTEMPTS || 6),
} as const;

export function hasKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
