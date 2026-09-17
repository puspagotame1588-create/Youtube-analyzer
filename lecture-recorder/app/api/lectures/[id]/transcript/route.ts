import { failFrom, ok } from "@/lib/server/http";
import { readLiveSegments, readTranscript } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const transcript = await readTranscript(id);
    if (transcript) return ok(transcript);
    // Before the accurate pass finishes, show the live captions instead.
    const live = await readLiveSegments(id);
    return ok({
      language: "ja",
      refined: false,
      createdAt: 0,
      segments: live
        .filter((s) => s.status !== "silent" && s.source.trim())
        .map((s) => ({
          startSec: s.startSec,
          endSec: s.endSec,
          source: s.source,
        })),
    });
  } catch (err) {
    return failFrom(err);
  }
}
