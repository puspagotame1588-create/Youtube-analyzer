import { CONFIG } from "@/lib/server/config";
import { fail, failFrom, ok } from "@/lib/server/http";
import { recordPassChunk, saveChunk } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Receives one long (about 10 minute) self-contained chunk. These are what the
 * accurate pass re-transcribes after the lecture: fewer cut points than the
 * live chunks means fewer words mangled at a boundary.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const form = await req.formData();
    const file = form.get("file");
    const idx = Number(form.get("idx"));
    if (!(file instanceof File) || file.size === 0) return fail("音声がありません");
    if (!Number.isInteger(idx) || idx < 0) return fail("idx が不正です");
    const ext = file.name.split(".").pop()?.toLowerCase() || "webm";
    await saveChunk(id, "pass", idx, Buffer.from(await file.arrayBuffer()), ext);

    // Where this chunk actually starts, measured by the recorder rather than
    // assumed from the configured chunk length.
    const startSec = Number(form.get("startSec"));
    const endSec = Number(form.get("endSec"));
    await recordPassChunk(id, {
      idx,
      startSec: Number.isFinite(startSec) ? startSec : idx * CONFIG.passChunkSec,
      endSec: Number.isFinite(endSec) ? endSec : (idx + 1) * CONFIG.passChunkSec,
    });
    return ok({ saved: true });
  } catch (err) {
    return failFrom(err);
  }
}
