import { CONFIG, hasKey } from "@/lib/server/config";
import { dataDir } from "@/lib/server/paths";
import { ok } from "@/lib/server/http";
import { openai } from "@/lib/server/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Which of the configured models this account can actually use. Checked once
 * and cached: the answer only changes when the account changes.
 */
let modelCheck: Promise<{ missing: string[]; checked: boolean }> | null = null;

function checkModels() {
  if (!modelCheck) {
    modelCheck = (async () => {
      try {
        const available = new Set<string>();
        for await (const model of openai().models.list()) available.add(model.id);
        if (available.size === 0) return { missing: [], checked: false };
        const wanted = [
          CONFIG.liveTranscribeModel,
          CONFIG.transcribeModel,
          CONFIG.llmModel,
        ];
        return {
          missing: [...new Set(wanted)].filter((m) => !available.has(m)),
          checked: true,
        };
      } catch {
        // Offline or a restricted key: do not block the app on this.
        return { missing: [], checked: false };
      }
    })();
  }
  return modelCheck;
}

export async function GET() {
  const models = hasKey() ? await checkModels() : { missing: [], checked: false };
  return ok({
    modelCheck: models,
    ready: hasKey(),
    dataDir: dataDir(),
    models: {
      live: CONFIG.liveTranscribeModel,
      transcribe: CONFIG.transcribeModel,
      notes: CONFIG.llmModel,
    },
    recording: {
      liveChunkSec: CONFIG.liveChunkSec,
      passChunkSec: CONFIG.passChunkSec,
      audioBitsPerSecond: CONFIG.audioBitsPerSecond,
    },
  });
}
