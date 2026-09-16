import { fail, failFrom, ok } from "@/lib/server/http";
import { hasKey } from "@/lib/server/config";
import { finalizeLecture, isFinalizing } from "@/lib/server/pipeline";
import { patchLecture, readLecture } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Runs (or re-runs) transcription, proofreading, translation and the notes. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as { force?: boolean };
    if (!hasKey()) {
      return fail("OPENAI_API_KEY が設定されていません。設定画面をご確認ください。", 503);
    }
    const lecture = await readLecture(id);
    if (!lecture) return fail("講義が見つかりません", 404);
    if (lecture.status === "recording") {
      if (!body.force) return fail("録音中は実行できません");
      // Interrupted recording: finish with whatever reached the disk.
      await patchLecture(id, { status: "recorded" });
    }
    if (isFinalizing(id)) return ok({ started: false, running: true });
    void finalizeLecture(id);
    return ok({ started: true });
  } catch (err) {
    return failFrom(err);
  }
}
