import { failFrom, ok } from "@/lib/server/http";
import { readNotes } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    return ok(await readNotes(id));
  } catch (err) {
    return failFrom(err);
  }
}
