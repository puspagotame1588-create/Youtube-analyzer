import { Suspense } from "react";
import Recorder from "@/components/Recorder";

export const dynamic = "force-dynamic";

export default function RecordPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-soft">読み込み中…</p>}>
      <Recorder />
    </Suspense>
  );
}
