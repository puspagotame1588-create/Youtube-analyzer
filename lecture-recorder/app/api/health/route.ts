import { promises as fs } from "fs";
import path from "path";
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

/**
 * Which build this is. Read from the VERSION file that ships with the app, so
 * "am I on the latest version?" is answerable from the settings screen instead
 * of by reading the code. Installs come from a ZIP with no git metadata, which
 * is why the answer is a committed file rather than a commit hash.
 */
async function readVersion(): Promise<{ label: string; note: string }> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "VERSION"), "utf8");
    const [label = "", ...rest] = raw.trim().split("\n");
    return { label: label.trim(), note: rest.join(" ").trim() };
  } catch {
    // An older install has no VERSION file, which is itself the answer.
    return { label: "不明（旧版）", note: "update.cmd で最新版に更新できます。" };
  }
}

export async function GET() {
  const models = hasKey() ? await checkModels() : { missing: [], checked: false };
  return ok({
    version: await readVersion(),
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
