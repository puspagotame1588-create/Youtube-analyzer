import { failFrom, ok } from "@/lib/server/http";
import { rebuildHighlights } from "@/lib/server/pipeline";
import { readHighlights } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    return ok(await readHighlights(id));
  } catch (err) {
    return failFrom(err);
  }
}

/** Rebuilds the study list from the transcript already on disk. */
export async function POST(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    return ok(await rebuildHighlights(id));
  } catch (err) {
    return failFrom(err);
  }
}
