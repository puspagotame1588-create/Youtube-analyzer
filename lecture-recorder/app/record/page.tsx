import { Suspense } from "react";
import ClientOnly from "@/components/ClientOnly";
import LiveRecorder from "@/components/LiveRecorder";

export default function RecordPage() {
  return (
    <ClientOnly fallback={<p className="text-sm text-ink-soft">読み込み中… / Loading…</p>}>
      <Suspense fallback={null}>
        <LiveRecorder />
      </Suspense>
    </ClientOnly>
  );
}
