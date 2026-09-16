import { failFrom, ok } from "@/lib/server/http";
import { appendMaster, patchLecture } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Appends one slice of the continuous recording. The client sends these every
 * few seconds while recording, so the master file on disk is never more than a
 * few seconds behind the microphone even if the app or the laptop dies.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const bytes = Buffer.from(await req.arrayBuffer());
    if (bytes.byteLength === 0) return ok({ bytes: 0 });
    const size = await appendMaster(id, bytes);
    const durationSec = Number(req.headers.get("x-elapsed-sec") ?? 0);
    await patchLecture(id, {
      masterBytes: size,
      durationSec: Number.isFinite(durationSec) && durationSec > 0 ? durationSec : undefined,
    }).catch(() => undefined);
    return ok({ bytes: size });
  } catch (err) {
    return failFrom(err);
  }
}
