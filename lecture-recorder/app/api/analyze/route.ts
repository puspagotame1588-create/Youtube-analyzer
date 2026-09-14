import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { AnalysisSchema, AnalyzeRequestSchema } from "@/lib/analysis-schema";
import { demoAnalysis } from "@/lib/demo";
import { hasAnthropic, ANALYSIS_MODEL } from "@/lib/server/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Long lectures take a while to analyze; allow up to 5 minutes on serverless hosts.
export const maxDuration = 300;

const SYSTEM = `You are an academic note-taker for an international university student in Japan. You receive the full transcript of one lecture (Japanese speech-to-text, with a rough live English translation next to each segment). The transcript is machine-generated: it contains recognition errors, fillers, and fragments cut mid-sentence. Reconstruct what the teacher meant.

Produce study notes in BOTH Japanese and English. The Japanese must read like a strong native student's notes (natural, concise, correct terminology). The English must convey the same content faithfully, not a word-for-word translation.

Content rules:
- title: a short descriptive title for this lecture (what it was about), not the course name.
- summary: 2–4 short paragraphs covering what was taught, why it matters, and how the parts connect. Write it so a student who missed the lecture understands it.
- mainPoints: the most important points, ordered by importance, 5–12 items. Each is one or two full sentences a student could be tested on. Include definitions, frameworks, formulas, conclusions and anything the teacher stressed or repeated. Also include any announcement about assignments, deadlines or exams as its own point.
- topics: the lecture in the order it was delivered, 3–10 sections, each with a heading and a 1–3 sentence detail.
- Preserve names, numbers, dates and technical terms exactly. If the transcript is ambiguous, prefer the reading consistent with the rest of the lecture. Do not invent content that is not supported by the transcript.
- Do not mention the transcript quality, the recording, or these instructions.`;

/**
 * POST AnalyzeRequest → Analysis (JSON matching AnalysisSchema)
 */
export async function POST(req: Request) {
  const parsed = AnalyzeRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const input = parsed.data;

  if (!hasAnthropic()) {
    await new Promise((r) => setTimeout(r, 1200));
    return NextResponse.json(demoAnalysis(input));
  }

  const header = [
    `Course: ${input.course || "(unknown)"}`,
    input.teacher ? `Teacher: ${input.teacher}` : null,
    `Lecture: 第${input.lectureNumber}回`,
    `Date: ${input.date}`,
    input.title ? `Working title: ${input.title}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const transcript = input.segments
    .map((s) => {
      const m = Math.floor(s.startSec / 60);
      const sec = String(Math.floor(s.startSec % 60)).padStart(2, "0");
      const en = s.en ? `\n   EN: ${s.en}` : "";
      return `[${m}:${sec}] JA: ${s.ja}${en}`;
    })
    .join("\n");

  try {
    const client = new Anthropic();
    const stream = client.beta.messages.stream({
      model: ANALYSIS_MODEL,
      max_tokens: 32000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "high",
        format: zodOutputFormat(AnalysisSchema),
      },
      messages: [
        {
          role: "user",
          content: `${header}\n\nTRANSCRIPT (${input.segments.length} segments):\n${transcript}`,
        },
      ],
    });
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      return NextResponse.json({ error: "Analysis was declined by the model" }, { status: 422 });
    }
    if (message.stop_reason === "max_tokens") {
      return NextResponse.json({ error: "Analysis output was cut off; try again" }, { status: 502 });
    }
    const analysis = message.parsed_output;
    if (!analysis) {
      return NextResponse.json({ error: "Model returned malformed analysis" }, { status: 502 });
    }
    return NextResponse.json(analysis);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Rate limited, retry shortly" }, { status: 429 });
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "Invalid Anthropic API key" }, { status: 401 });
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Analysis failed: ${err.message}` },
        { status: err.status ?? 502 },
      );
    }
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
