"use client";

import { useEffect } from "react";

/**
 * Shown when a screen throws. Next.js's own message says only that "a
 * client-side exception has occurred", which leaves nothing to act on. This
 * shows what actually failed, and keeps the rest of the app reachable.
 *
 * Recordings are never at risk here: audio and transcripts live in files on
 * this computer, not in the page.
 */
export default function ErrorScreen({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("画面の表示に失敗しました / screen failed to render:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 py-10">
      <h1 className="text-xl font-semibold">画面の表示に失敗しました</h1>
      <p className="text-sm leading-relaxed text-ink-soft">
        録音した音声・書き起こし・ノートは、このパソコンのフォルダに保存されているので無事です。
        まず「再読み込み」を押してください。直らないときは、下の内容をそのまま伝えてください。
      </p>

      <pre className="overflow-x-auto rounded-lg border border-line bg-surface-2 p-3 text-xs leading-relaxed whitespace-pre-wrap">
        {error.message || "（メッセージなし）"}
        {error.digest ? `\n\ndigest: ${error.digest}` : ""}
      </pre>

      <div className="flex flex-wrap gap-2">
        {/* A full reload, not a client-side retry: a tree that failed to
            hydrate stays broken until the page is fetched again. */}
        <button className="btn-primary" onClick={() => window.location.reload()}>
          再読み込み
        </button>
        <button className="btn-ghost" onClick={() => reset()}>
          この画面だけやり直す
        </button>
        <button
          className="btn-ghost"
          onClick={() => window.location.assign("/")}
        >
          ライブラリへ
        </button>
        <button
          className="btn-ghost"
          onClick={() => {
            void navigator.clipboard
              .writeText(`${error.message}\n${error.digest ?? ""}`)
              .catch(() => undefined);
          }}
        >
          エラーをコピー
        </button>
      </div>

      <p className="text-xs text-ink-soft">
        ページの自動翻訳をオンにしていると、表示が崩れることがあります。アドレスバーの翻訳アイコンから
        「元の言語で表示」を選ぶと安定します。
      </p>
    </div>
  );
}
