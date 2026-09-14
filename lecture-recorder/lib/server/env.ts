/** Server-only helpers for reading configuration. */

export function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function hasAnthropic(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export const TRANSCRIBE_MODEL =
  process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-transcribe";
export const ANALYSIS_MODEL =
  process.env.ANTHROPIC_ANALYSIS_MODEL || "claude-opus-5";
export const TRANSLATE_MODEL =
  process.env.ANTHROPIC_TRANSLATE_MODEL || "claude-opus-5";
