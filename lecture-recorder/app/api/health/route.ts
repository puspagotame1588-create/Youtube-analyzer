import { CONFIG, hasKey } from "@/lib/server/config";
import { dataDir } from "@/lib/server/paths";
import { ok } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return ok({
    ready: hasKey(),
    dataDir: dataDir(),
    models: {
      live: CONFIG.liveTranscribeModel,
      transcribe: CONFIG.transcribeModel,
      notes: CONFIG.llmModel,
      fast: CONFIG.fastModel,
    },
    recording: {
      liveChunkSec: CONFIG.liveChunkSec,
      passChunkSec: CONFIG.passChunkSec,
      audioBitsPerSecond: CONFIG.audioBitsPerSecond,
    },
  });
}
