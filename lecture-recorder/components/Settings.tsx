"use client";

import { useEffect, useState } from "react";
import { api, type Health } from "@/lib/api";
import { Notice, Spinner } from "./ui";

export default function Settings() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api
      .health()
      .then(setHealth)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!health) {
    return (
      <p className="flex items-center gap-2 text-sm text-ink-soft">
        <Spinner /> 読み込み中…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">設定</h1>

      {health.ready ? (
        <Notice tone="ok">OpenAI API キーを読み込みました。すべての機能が使えます。</Notice>
      ) : (
        <Notice tone="warn">
          OpenAI API キーが未設定です。録音と音声の保存はできますが、字幕・全文・ノートは作成されません。
        </Notice>
      )}

      {health.modelCheck.checked && health.modelCheck.missing.length > 0 && (
        <Notice tone="warn">
          このアカウントでは次のモデルが使えないようです:{" "}
          <span className="font-mono">{health.modelCheck.missing.join(", ")}</span>
          。そのまま使えますが、自動的に別のモデル（whisper-1 など）に切り替わります。
          .env.local で使えるモデル名を指定すると、切り替えなしで動きます。
        </Notice>
      )}

      <section className="card p-5">
        <h2 className="section-title mb-3">API キーの設定</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
          <li>
            アプリのフォルダにある <code className="rounded bg-surface-2 px-1">.env.local</code>{" "}
            をメモ帳で開きます（無ければ{" "}
            <code className="rounded bg-surface-2 px-1">.env.example</code> をコピーして作成）。
          </li>
          <li>
            <code className="rounded bg-surface-2 px-1">OPENAI_API_KEY=sk-...</code> の行に自分のキーを貼り付けて保存します。
          </li>
          <li>アプリのウィンドウ（黒い画面）を閉じて、もう一度 start.cmd を実行します。</li>
        </ol>
        <p className="mt-3 text-xs text-ink-soft">
          キーはこのパソコンのファイルにだけ保存されます。ブラウザには送られません。
        </p>
      </section>

      <section className="card p-5">
        <h2 className="section-title mb-3">保存場所</h2>
        <p className="break-all rounded-lg bg-surface-2 px-3 py-2 font-mono text-xs">
          {health.dataDir}
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          音声・全文・ノートはすべてこのフォルダに残ります。バックアップしたいときは、このフォルダごと
          OneDrive や外付けドライブにコピーしてください。保存先を変えるには{" "}
          <code className="rounded bg-surface-2 px-1">LECTURE_DATA_DIR</code> を .env.local に設定します。
        </p>
      </section>

      <section className="card p-5">
        <h2 className="section-title mb-3">使用中のモデル</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <Row label="ライブ字幕の文字起こし" value={health.models.live} />
          <Row label="精密文字起こし（録音後）" value={health.models.transcribe} />
          <Row label="ライブ翻訳" value={health.models.fast} />
          <Row label="要約・ノート・質問応答" value={health.models.notes} />
        </dl>
        <p className="mt-3 text-xs text-ink-soft">
          変更するには .env.local の OPENAI_TRANSCRIBE_MODEL / OPENAI_LLM_MODEL などを設定します。
        </p>
      </section>

      <section className="card p-5">
        <h2 className="section-title mb-3">長時間の録音を止めないために（Windows）</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
          <li>
            設定 → システム → 電源とバッテリー →「画面とスリープ」で、電源接続時のスリープを「なし」にします。
            画面が消えるだけなら録音は続きますが、スリープに入ると止まります。
          </li>
          <li>録音中は AC アダプターをつないでおきます。</li>
          <li>
            録音タブは開いたままにします（別のタブを見るのは問題ありません）。ブラウザは閉じないでください。
          </li>
          <li>外部マイクは録音を始める前に挿し、マイク欄で選び直してください。</li>
          <li>
            録音中に Wi-Fi が切れても録音は続きます。音声はパソコンに保存され、字幕だけが遅れて追いつきます。
          </li>
        </ul>
      </section>

      <section className="card p-5">
        <h2 className="section-title mb-3">録音の設定</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <Row label="字幕の更新間隔" value={`${health.recording.liveChunkSec} 秒`} />
          <Row label="精密文字起こしの区切り" value={`${health.recording.passChunkSec / 60} 分`} />
          <Row
            label="音質"
            value={`${health.recording.audioBitsPerSecond / 1000} kbps（90分で約 ${Math.round(
              (health.recording.audioBitsPerSecond * 90 * 60) / 8 / 1024 / 1024,
            )} MB）`}
          />
        </dl>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-lg bg-surface-2/60 px-3 py-2">
      <dt className="text-xs text-ink-soft">{label}</dt>
      <dd className="font-mono text-xs">{value}</dd>
    </div>
  );
}
