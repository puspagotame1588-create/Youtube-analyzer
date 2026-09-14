"use client";

import { useEffect, useState } from "react";

interface Status {
  openai: boolean;
  anthropic: boolean;
  demo: boolean;
}

export default function StatusBanner() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((s: Status | null) => {
        if (!cancelled && s) setStatus(s);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!status || !status.demo) return null;

  const missing = [
    !status.openai ? "OPENAI_API_KEY (文字起こし / transcription)" : null,
    !status.anthropic ? "ANTHROPIC_API_KEY (翻訳・要約 / translation & summary)" : null,
  ].filter(Boolean);

  return (
    <div className="border-b border-warn/30 bg-warn-soft px-4 py-2 text-xs text-ink">
      <div className="mx-auto max-w-5xl">
        <strong>デモモード / Demo mode:</strong> サンプルの文字起こしが表示されます。実際に使うには{" "}
        <code>lecture-recorder/.env.local</code> に {missing.join(" と ")} を設定してください。
      </div>
    </div>
  );
}
