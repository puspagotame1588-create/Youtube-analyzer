import { z } from "zod";
import { hasKey } from "@/lib/server/config";
import { fail, failFrom, ok } from "@/lib/server/http";
import { cancelFlow, readFlowState, startFlow } from "@/lib/server/flow";
import { readLecture } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Ctx = { params: Promise<{ id: string }> };

const StartSchema = z.object({ outputLanguage: z.enum(["ja", "en"]).optional() });

/** The stored flow, plus whether it is current and whether a run is going. */
export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    return ok(await readFlowState(id));
  } catch (err) {
    return failFrom(err);
  }
}

/**
 * Starts a generation and returns at once: a long lecture takes minutes, far
 * longer than a request should be held open. Progress is read back from GET.
 */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    if (!hasKey()) {
      return fail("OPENAI_API_KEY が設定されていません。設定画面をご確認ください。", 503);
    }
    const lecture = await readLecture(id);
    if (!lecture) return fail("講義が見つかりません", 404);

    const state = await readFlowState(id);
    if (!state.hasTranscript) {
      return fail("先に文字起こしを完了してください。");
    }
    const body = StartSchema.safeParse(await req.json().catch(() => ({})));
    const outputLanguage =
      (body.success ? body.data.outputLanguage : undefined) ?? lecture.language;
    return ok(await startFlow(id, outputLanguage));
  } catch (err) {
    return failFrom(err);
  }
}

/** Cancels a run. The last good flow is left exactly as it was. */
export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    return ok({ cancelled: cancelFlow(id) });
  } catch (err) {
    return failFrom(err);
  }
}
