import { z } from "zod";
import { failFrom, ok } from "@/lib/server/http";
import { finalizeLecture } from "@/lib/server/pipeline";
import { patchLecture } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const StopSchema = z.object({
  durationSec: z.number().nonnegative(),
  autoFinalize: z.boolean().default(true),
});

/** Marks the recording finished and kicks off the accurate pass in the background. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const parsed = StopSchema.safeParse(await req.json().catch(() => ({})));
    const durationSec = parsed.success ? parsed.data.durationSec : 0;
    const autoFinalize = parsed.success ? parsed.data.autoFinalize : true;

    await patchLecture(id, { status: "recorded", durationSec, progress: null });
    if (autoFinalize) {
      // Runs in this same local server process; the page can be closed.
      void finalizeLecture(id);
    }
    return ok({ stopped: true, finalizing: autoFinalize });
  } catch (err) {
    return failFrom(err);
  }
}
