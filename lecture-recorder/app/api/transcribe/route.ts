import { NextResponse } from "next/server";
import OpenAI from "openai";
import { demoTranscribe } from "@/lib/demo";
import { hasOpenAI, TRANSCRIBE_MODEL } from "@/lib/server/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DOMAIN_PROMPT = "大学の講義の録音です。日本語で話しています。";

/**
 * POST multipart/form-data { file: audio chunk, prompt?: previous Japanese text }
 * → { text: string } Japanese transcript of the chunk.
 */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
  }
  const previous = String(form.get("prompt") ?? "").slice(-200);

  if (!hasOpenAI()) {
    // Demo mode: pretend it took a moment, then return sample Japanese.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ text: demoTranscribe(), demo: true });
  }

  try {
    const client = new OpenAI();
    const result = await client.audio.transcriptions.create({
      file,
      model: TRANSCRIBE_MODEL,
      language: "ja",
      prompt: previous ? `${DOMAIN_PROMPT} ${previous}` : DOMAIN_PROMPT,
      response_format: "json",
    });
    return NextResponse.json({ text: (result.text ?? "").trim() });
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `Transcription failed: ${err.message}` },
        { status: err.status ?? 502 },
      );
    }
    const message = err instanceof Error ? err.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
