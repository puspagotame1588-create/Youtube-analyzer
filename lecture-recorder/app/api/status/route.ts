import { NextResponse } from "next/server";
import { hasAnthropic, hasOpenAI, ANALYSIS_MODEL, TRANSCRIBE_MODEL, TRANSLATE_MODEL } from "@/lib/server/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const openai = hasOpenAI();
  const anthropic = hasAnthropic();
  return NextResponse.json({
    openai,
    anthropic,
    demo: !openai || !anthropic,
    models: {
      transcribe: TRANSCRIBE_MODEL,
      translate: TRANSLATE_MODEL,
      analysis: ANALYSIS_MODEL,
    },
  });
}
