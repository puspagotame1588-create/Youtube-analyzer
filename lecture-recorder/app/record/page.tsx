import { Suspense } from "react";
import { RecorderClient } from "@/components/ClientOnly";

export const dynamic = "force-dynamic";

export default function RecordPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-soft">読み込み中…</p>}>
      <RecorderClient />
    </Suspense>
  );
}
