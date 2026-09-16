import { fail, failFrom, ok } from "@/lib/server/http";
import { enqueueLiveChunk } from "@/lib/server/pipeline";
import { appendLiveSegment, readLecture, readLiveSegments, saveChunk } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Ctx = { params: Promise<{ id: string }> };

/** Receives one short chunk and queues it for captioning. Returns immediately. */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const form = await req.formData();
    const file = form.get("file");
    const idx = Number(form.get("idx"));
    const startSec = Number(form.get("startSec"));
    const endSec = Number(form.get("endSec"));
    const silent = String(form.get("silent") ?? "") === "1";
    if (!Number.isInteger(idx) || idx < 0) return fail("idx が不正です");

    if (silent) {
      // The level meter saw nothing but room noise: no call, no cost.
      await appendLiveSegment(id, {
        idx,
        startSec,
        endSec,
        source: "",
        translation: "",
        status: "silent",
      });
      return ok({ queued: false, silent: true });
    }

    if (!(file instanceof File) || file.size === 0) return fail("音声がありません");
    const ext = file.name.split(".").pop()?.toLowerCase() || "webm";
    const saved = await saveChunk(id, "live", idx, Buffer.from(await file.arrayBuffer()), ext);
    enqueueLiveChunk({ lectureId: id, idx, file: saved, startSec, endSec });
    return ok({ queued: true });
  } catch (err) {
    return failFrom(err);
  }
}

/** Live captions produced so far. `after` returns only newer indexes. */
export async function GET(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const lecture = await readLecture(id);
    if (!lecture) return fail("講義が見つかりません", 404);
    const after = Number(new URL(req.url).searchParams.get("after") ?? -1);
    const all = await readLiveSegments(id);
    const segments = Number.isFinite(after) ? all.filter((s) => s.idx > after) : all;
    return ok({
      segments,
      status: lecture.status,
      pendingChunks: lecture.pendingChunks ?? 0,
      durationSec: lecture.durationSec,
    });
  } catch (err) {
    return failFrom(err);
  }
}
