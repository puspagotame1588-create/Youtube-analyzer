import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { TranslateRequestSchema } from "@/lib/analysis-schema";
import { demoTranslate } from "@/lib/demo";
import { hasAnthropic, TRANSLATE_MODEL } from "@/lib/server/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SYSTEM = `You are a live interpreter for a university lecture in Japan. The audio is being transcribed in ~10 second chunks and you translate each chunk from Japanese into natural, clear English for an international student.

Rules:
- Output ONLY the English translation of the chunk. No preface, no notes, no quotes.
- Chunks are fragments cut mid-sentence. Translate what is there; do not invent an ending and do not repeat the previous chunk.
- Keep academic and technical terms precise. For an important Japanese term you may add the original in parentheses once, e.g. "perceived value (知覚価値)".
- Keep names, numbers, dates and deadlines exactly.
- If the chunk is filler only (えー, あの, うん), output a single hyphen "-".`;

/**
 * POST { ja, prevJa?, prevEn? } → { en }
 */
export async function POST(req: Request) {
  const parsed = TranslateRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { ja, prevJa, prevEn } = parsed.data;

  if (!hasAnthropic()) {
    return NextResponse.json({ en: demoTranslate(ja), demo: true });
  }

  const context =
    prevJa || prevEn
      ? `Previous chunk (for context only, already translated):\nJA: ${prevJa}\nEN: ${prevEn}\n\n`
      : "";

  try {
    const client = new Anthropic();
    const response = await client.beta.messages.create({
      model: TRANSLATE_MODEL,
      max_tokens: 1024,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      output_config: { effort: "low" },
      messages: [
        {
          role: "user",
          content: `${context}Translate this chunk:\nJA: ${ja}`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "Translation was declined" }, { status: 422 });
    }
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return NextResponse.json({ en: text === "-" ? "" : text });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Rate limited, retry shortly" }, { status: 429 });
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "Invalid Anthropic API key" }, { status: 401 });
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Translation failed: ${err.message}` },
        { status: err.status ?? 502 },
      );
    }
    const message = err instanceof Error ? err.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
