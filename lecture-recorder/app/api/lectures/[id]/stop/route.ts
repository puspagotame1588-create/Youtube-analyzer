import { z } from "zod";
import { hasKey } from "@/lib/server/config";
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

    if (!hasKey()) {
      // The audio is safe on disk. Say why nothing further will happen, rather
      // than leaving the lecture sitting in "recorded" with no explanation.
      await patchLecture(id, {
        status: "error",
        error:
          "OPENAI_API_KEY が設定されていないため、文字起こしを実行できませんでした。録音した音声は保存されています。キーを設定してアプリを再起動し、「文字起こしを実行」を押してください。",
      });
      return ok({ stopped: true, finalizing: false });
    }

    if (autoFinalize) {
      // Runs in this same local server process; the page can be closed.
      void finalizeLecture(id);
    }
    return ok({ stopped: true, finalizing: autoFinalize });
  } catch (err) {
    return failFrom(err);
  }
}
