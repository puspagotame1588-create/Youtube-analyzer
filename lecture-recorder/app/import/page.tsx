import { Suspense } from "react";
import { ImportAudioClient } from "@/components/ClientOnly";

export const dynamic = "force-dynamic";

export default function ImportPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-soft">読み込み中…</p>}>
      <ImportAudioClient />
    </Suspense>
  );
}
