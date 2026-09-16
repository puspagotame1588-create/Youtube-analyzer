"use client";

/**
 * The last resort, for a failure in the root layout itself. It must render its
 * own html and body, and cannot rely on the app's styles being loaded.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body
        style={{
          fontFamily: "system-ui, 'Yu Gothic UI', 'Hiragino Sans', sans-serif",
          margin: 0,
          padding: "40px 20px",
          background: "#f4f5f7",
          color: "#14161a",
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h1 style={{ fontSize: 20 }}>アプリの表示に失敗しました</h1>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: "#596074" }}>
            録音した音声とノートはパソコンに保存されています。再読み込みしても直らない場合は、
            下の内容を伝えてください。
          </p>
          <pre
            style={{
              background: "#eceef2",
              border: "1px solid #dfe2e8",
              borderRadius: 8,
              padding: 12,
              fontSize: 12,
              whiteSpace: "pre-wrap",
              overflowX: "auto",
            }}
          >
            {error.message || "（メッセージなし）"}
            {error.digest ? `\n\ndigest: ${error.digest}` : ""}
          </pre>
          <button
            onClick={() => reset()}
            style={{
              background: "#4338ca",
              color: "#fff",
              border: 0,
              borderRadius: 8,
              padding: "10px 16px",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            再読み込み
          </button>
        </div>
      </body>
    </html>
  );
}
