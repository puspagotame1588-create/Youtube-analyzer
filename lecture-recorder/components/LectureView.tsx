"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, type LectureBundle } from "@/lib/api";
import { fmtDuration, fmtSec } from "@/lib/export";
import type { ChatTurn, Flashcards, MaterialFile } from "@/lib/types";
import { Empty, Field, Notice, Spinner, StatusPill } from "./ui";

type Tab =
  | "summary"
  | "points"
  | "terms"
  | "exam"
  | "transcript"
  | "cards"
  | "chat"
  | "materials";

const TABS: [Tab, string][] = [
  ["summary", "概要・要約"],
  ["points", "要点"],
  ["terms", "用語"],
  ["exam", "課題・試験"],
  ["transcript", "全文"],
  ["cards", "フラッシュカード"],
  ["chat", "質問する"],
  ["materials", "資料"],
];

export default function LectureView({ id }: { id: string }) {
  const router = useRouter();
  const [data, setData] = useState<LectureBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("summary");
  const [busy, setBusy] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api.lecture(id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  // While the pipeline is running the page follows its progress.
  const working =
    data?.lecture.status === "transcribing" || data?.lecture.status === "analyzing";
  useEffect(() => {
    if (!working) return;
    const timer = window.setInterval(() => void load(), 3000);
    return () => window.clearInterval(timer);
  }, [working, load]);

  if (error && !data) return <Notice tone="error">{error}</Notice>;
  if (!data) {
    return (
      <p className="flex items-center gap-2 text-sm text-ink-soft">
        <Spinner /> 読み込み中…
      </p>
    );
  }

  const { lecture, transcript, notes, materials } = data;

  const seek = (sec: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = sec;
    void el.play().catch(() => undefined);
  };

  async function rerun(force = false) {
    setBusy(true);
    try {
      await api.finalize(id, force);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("この講義（音声・書き起こし・ノート）を削除します。元に戻せません。")) return;
    await api.deleteLecture(id);
    router.push("/");
  }

  return (
    <div className="space-y-4">
      <header className="card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-ink-soft">
              <Link href="/" className="hover:underline">
                ライブラリ
              </Link>{" "}
              / 第{lecture.number}回
            </p>
            <TitleEditor
              id={id}
              title={lecture.title || notes?.title || `第${lecture.number}回`}
              onSaved={load}
            />
            <p className="mt-1 text-xs text-ink-soft">
              {lecture.date} ・ {fmtDuration(lecture.durationSec)} ・{" "}
              {lecture.language === "ja" ? "日本語の講義" : "英語の講義"}
              {transcript ? ` ・ ${transcript.segments.length} 区間` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={lecture.status} />
            <a className="btn-ghost px-3 py-1.5 text-xs" href={`/api/lectures/${id}/export`}>
              テキストで保存
            </a>
            <button
              className="btn-ghost px-3 py-1.5 text-xs"
              onClick={() => rerun(false)}
              disabled={busy || working || lecture.status === "recording"}
            >
              {busy && <Spinner />} {notes ? "作り直す" : "文字起こしを実行"}
            </button>
            <button className="btn-quiet px-2 py-1.5 text-xs" onClick={remove}>
              削除
            </button>
          </div>
        </div>

        {lecture.masterBytes > 0 && (
          <audio
            ref={audioRef}
            controls
            preload="metadata"
            src={`/api/lectures/${id}/audio`}
            className="mt-3 w-full"
          />
        )}

        {working && lecture.progress && (
          <div className="mt-3">
            <Notice tone="info">
              {lecture.progress.step}（{lecture.progress.done + 1}/{lecture.progress.total}）…
              このまま閉じても処理は続きます。
            </Notice>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full bg-accent transition-[width]"
                style={{
                  width: `${Math.min(100, Math.round(((lecture.progress.done + 1) / Math.max(1, lecture.progress.total)) * 100))}%`,
                }}
              />
            </div>
          </div>
        )}
        {lecture.status === "recording" && !working && (
          <div className="mt-3 space-y-2">
            <Notice tone="warn">
              この講義は「録音中」のままです。録音タブを閉じたか、パソコンが停止した可能性があります。
              ここまでの音声はディスクに保存されているので、そこから書き起こせます。
            </Notice>
            <button className="btn-primary text-xs" onClick={() => rerun(true)} disabled={busy}>
              {busy && <Spinner />} 録音を復旧して書き起こす
            </button>
          </div>
        )}
        {lecture.status === "error" && lecture.error && (
          <div className="mt-3">
            <Notice tone="error">{lecture.error}</Notice>
          </div>
        )}
        {transcript && !transcript.refined && lecture.status === "done" && (
          <div className="mt-3">
            <Notice tone="warn">
              精密文字起こし用の音声が見つからなかったため、ライブ字幕をもとに作成しています。
            </Notice>
          </div>
        )}
      </header>

      <nav className="flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              tab === key ? "bg-accent text-accent-ink" : "text-ink-soft hover:bg-surface-2"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "summary" &&
        (notes ? (
          <div className="space-y-4">
            <Panel title="概要">
              <p className="whitespace-pre-wrap leading-relaxed">{notes.overview}</p>
            </Panel>
            <Panel title="詳細要約">
              <div className="space-y-3 leading-relaxed">
                {notes.detailed.split(/\n{2,}|\n/).filter(Boolean).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </Panel>
            {notes.unclear.length > 0 && (
              <Panel title="聞き取れなかった箇所（AI が確認できなかった部分）">
                <ul className="list-disc space-y-1 pl-5 text-sm text-ink-soft">
                  {notes.unclear.map((u, i) => (
                    <li key={i}>{u}</li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>
        ) : (
          <NotYet status={lecture.status} />
        ))}

      {tab === "points" &&
        (notes ? (
          <div className="space-y-3">
            {notes.topics.map((topic, i) => (
              <Panel
                key={i}
                title={`${i + 1}. ${topic.heading}`}
                action={
                  topic.startSec !== null && lecture.masterBytes > 0 ? (
                    <button
                      className="btn-quiet px-2 py-1 font-mono text-xs"
                      onClick={() => seek(topic.startSec ?? 0)}
                    >
                      ▶ {fmtSec(topic.startSec)}
                    </button>
                  ) : null
                }
              >
                <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
                  {topic.points.map((p, j) => (
                    <li key={j}>{p}</li>
                  ))}
                </ul>
              </Panel>
            ))}
            {notes.reviewQuestions.length > 0 && (
              <Panel title="復習問題">
                <ol className="space-y-3">
                  {notes.reviewQuestions.map((q, i) => (
                    <li key={i}>
                      <p className="font-medium">
                        {i + 1}. {q.question}
                      </p>
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs text-accent">答えを見る</summary>
                        <p className="mt-1 text-sm text-ink-soft">{q.answer}</p>
                      </details>
                    </li>
                  ))}
                </ol>
              </Panel>
            )}
          </div>
        ) : (
          <NotYet status={lecture.status} />
        ))}

      {tab === "terms" &&
        (notes ? (
          notes.terms.length === 0 ? (
            <Empty title="用語は見つかりませんでした" body="この回では専門用語の説明がなかったようです。" />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-line bg-surface-2/60 text-left text-xs text-ink-soft">
                  <tr>
                    <th className="px-4 py-2 font-medium">用語</th>
                    <th className="px-4 py-2 font-medium">読み</th>
                    <th className="px-4 py-2 font-medium">意味</th>
                    <th className="px-4 py-2 font-medium">講義での使われ方</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {notes.terms.map((t, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5 font-medium">{t.term}</td>
                      <td className="px-4 py-2.5 text-ink-soft">{t.reading}</td>
                      <td className="px-4 py-2.5">{t.meaning}</td>
                      <td className="px-4 py-2.5 text-ink-soft">{t.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <NotYet status={lecture.status} />
        ))}

      {tab === "exam" &&
        (notes ? (
          <div className="space-y-4">
            <Panel title="課題・締切">
              {notes.assignments.length === 0 ? (
                <p className="text-sm text-ink-soft">この回では課題の指示はありませんでした。</p>
              ) : (
                <ul className="space-y-3">
                  {notes.assignments.map((a, i) => (
                    <li key={i} className="border-l-2 border-warn pl-3">
                      <p className="font-medium">{a.what}</p>
                      <p className="text-sm">
                        締切: <span className="font-medium">{a.due || "明示なし"}</span>
                      </p>
                      {a.quote && (
                        <p className="mt-1 text-xs text-ink-soft">先生の発言:「{a.quote}」</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="試験に出そうな項目（先生が明言）">
              <ExamList items={notes.examTopics.filter((t) => t.basis === "teacher")} showQuote />
            </Panel>
            <Panel title="試験に出そうな項目（AI の推測 — 先生の発言ではありません）">
              <ExamList items={notes.examTopics.filter((t) => t.basis === "inferred")} />
            </Panel>
          </div>
        ) : (
          <NotYet status={lecture.status} />
        ))}

      {tab === "transcript" && (
        <TranscriptPanel
          segments={transcript?.segments ?? []}
          language={lecture.language}
          canSeek={lecture.masterBytes > 0}
          onSeek={seek}
        />
      )}

      {tab === "cards" && <CardsPanel id={id} ready={Boolean(transcript?.segments.length)} />}

      {tab === "chat" && <ChatPanel id={id} ready={Boolean(transcript?.segments.length)} onSeek={seek} />}

      {tab === "materials" && <MaterialsPanel id={id} files={materials} onChanged={load} />}
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="section-title">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function NotYet({ status }: { status: string }) {
  return (
    <Empty
      title={
        status === "transcribing" || status === "analyzing"
          ? "作成中です"
          : "まだノートがありません"
      }
      body={
        status === "transcribing" || status === "analyzing"
          ? "処理が終わると自動で表示されます。"
          : "上の「文字起こしを実行」を押すと作成されます。"
      }
    />
  );
}

function ExamList({
  items,
  showQuote = false,
}: {
  items: { topic: string; quote: string }[];
  showQuote?: boolean;
}) {
  if (items.length === 0) return <p className="text-sm text-ink-soft">該当なし。</p>;
  return (
    <ul className="space-y-2">
      {items.map((t, i) => (
        <li key={i}>
          <p>{t.topic}</p>
          {showQuote && t.quote && (
            <p className="text-xs text-ink-soft">発言:「{t.quote}」</p>
          )}
        </li>
      ))}
    </ul>
  );
}

function TitleEditor({
  id,
  title,
  onSaved,
}: {
  id: string;
  title: string;
  onSaved: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  if (!editing) {
    return (
      <h1 className="mt-1 text-xl font-semibold leading-tight">
        {title}
        <button
          className="ml-2 align-middle text-xs font-normal text-ink-soft hover:text-ink"
          onClick={() => {
            setDraft(title);
            setEditing(true);
          }}
        >
          編集
        </button>
      </h1>
    );
  }
  return (
    <form
      className="mt-1 flex items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (draft.trim()) await api.updateLecture(id, { title: draft.trim() });
        setEditing(false);
        await onSaved();
      }}
    >
      <input
        className="input max-w-md"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        autoFocus
      />
      <button className="btn-primary px-3 py-1.5 text-xs">保存</button>
      <button type="button" className="btn-quiet px-2 py-1.5 text-xs" onClick={() => setEditing(false)}>
        取消
      </button>
    </form>
  );
}

function TranscriptPanel({
  segments,
  language,
  canSeek,
  onSeek,
}: {
  segments: { startSec: number; source: string; translation: string }[];
  language: "ja" | "en";
  canSeek: boolean;
  onSeek: (sec: number) => void;
}) {
  const [mode, setMode] = useState<"both" | "source" | "translation">("both");
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? segments.filter(
        (s) => s.source.includes(query.trim()) || s.translation.includes(query.trim()),
      )
    : segments;

  if (segments.length === 0) {
    return <Empty title="全文がまだありません" body="録音を終えると、ここに全文が表示されます。" />;
  }

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-3">
        <input
          className="input max-w-xs"
          placeholder="全文を検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex gap-1 rounded-lg border border-line p-1 text-xs">
          {(
            [
              ["both", "両方"],
              ["source", language === "ja" ? "日本語のみ" : "英語のみ"],
              ["translation", language === "ja" ? "英語のみ" : "日本語のみ"],
            ] as [typeof mode, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`rounded-md px-2.5 py-1 ${mode === key ? "bg-surface-2 font-medium" : "text-ink-soft"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <ul className="divide-y divide-line/60">
        {filtered.map((s, i) => (
          <li key={i} className="grid gap-1 px-4 py-3 sm:grid-cols-[auto_1fr] sm:gap-3">
            <button
              className="text-left font-mono text-[11px] text-ink-soft hover:text-accent disabled:hover:text-ink-soft sm:pt-1"
              onClick={() => onSeek(s.startSec)}
              disabled={!canSeek}
            >
              {canSeek ? "▶ " : ""}
              {fmtSec(s.startSec)}
            </button>
            <div className={mode === "both" ? "grid gap-1.5 lg:grid-cols-2 lg:gap-4" : ""}>
              {mode !== "translation" && <p className="text-sm leading-relaxed">{s.source}</p>}
              {mode !== "source" && (
                <p className="text-sm leading-relaxed text-ink-soft">{s.translation}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CardsPanel({ id, ready }: { id: string; ready: boolean }) {
  const [cards, setCards] = useState<Flashcards | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  useEffect(() => {
    void api.flashcards(id).then(setCards).catch(() => undefined);
  }, [id]);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      setCards(await api.makeFlashcards(id));
      setRevealed(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-soft">
          ボタンを押したときだけ作成します。講義の内容だけからカードを作ります。
        </p>
        <button className="btn-primary" onClick={generate} disabled={busy || !ready}>
          {busy && <Spinner />} {cards ? "作り直す" : "フラッシュカードを作る"}
        </button>
      </div>
      {!ready && <Notice tone="warn">先に文字起こしを完了してください。</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      {cards && (
        <div className="grid gap-3 md:grid-cols-2">
          {cards.cards.map((card, i) => {
            const open = revealed.has(i);
            return (
              <button
                key={i}
                onClick={() =>
                  setRevealed((prev) => {
                    const next = new Set(prev);
                    if (next.has(i)) next.delete(i);
                    else next.add(i);
                    return next;
                  })
                }
                className="card p-4 text-left transition hover:border-accent"
              >
                <p className="text-xs text-ink-soft">カード {i + 1}</p>
                <p className="mt-1 font-medium">{card.front}</p>
                {open ? (
                  <p className="mt-2 border-t border-line pt-2 text-sm">{card.back}</p>
                ) : (
                  <p className="mt-2 text-xs text-accent">
                    {card.hint ? `ヒント: ${card.hint} ・ ` : ""}タップして答えを見る
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChatPanel({
  id,
  ready,
  onSeek,
}: {
  id: string;
  ready: boolean;
  onSeek: (sec: number) => void;
}) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.chat(id).then(setTurns).catch(() => undefined);
  }, [id]);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const text = question.trim();
    if (!text) return;
    setBusy(true);
    setError(null);
    setQuestion("");
    setTurns((prev) => [...prev, { role: "user", content: text, at: Date.now() }]);
    try {
      const { turn } = await api.ask(id, text);
      setTurns((prev) => [...prev, turn]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {!ready && <Notice tone="warn">先に文字起こしを完了してください。</Notice>}
      <div className="card min-h-40 space-y-3 p-4">
        {turns.length === 0 && (
          <p className="text-sm text-ink-soft">
            この講義の内容について質問できます。例:「4P のうち価格の説明をもう一度」「締切はいつ？」
            <br />
            講義で触れられていないことは、はっきり「触れられていません」と答えます。
          </p>
        )}
        {turns.map((turn, i) => (
          <div
            key={i}
            className={turn.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                turn.role === "user" ? "bg-accent text-accent-ink" : "bg-surface-2"
              }`}
            >
              <p className="whitespace-pre-wrap">{turn.content}</p>
              {turn.citations && turn.citations.length > 0 && (
                <p className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] opacity-80">
                  根拠:
                  {turn.citations.map((sec) => (
                    <button
                      key={sec}
                      className="font-mono underline"
                      onClick={() => onSeek(sec)}
                    >
                      {fmtSec(sec)}
                    </button>
                  ))}
                </p>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <p className="flex items-center gap-2 text-sm text-ink-soft">
            <Spinner /> 書き起こしを確認しています…
          </p>
        )}
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <form onSubmit={ask} className="flex gap-2">
        <input
          className="input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="講義について質問する"
          disabled={!ready || busy}
        />
        <button className="btn-primary" disabled={!ready || busy || !question.trim()}>
          送信
        </button>
      </form>
    </div>
  );
}

function MaterialsPanel({
  id,
  files,
  onChanged,
}: {
  id: string;
  files: MaterialFile[];
  onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(list: FileList | null) {
    if (!list || list.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(list)) {
        await api.uploadMaterial(id, file);
      }
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <Notice tone="info">
        スライドや教科書の PDF、メモのテキストを追加すると、要約・用語・質問応答の根拠として使われます。
        画像だけの PDF は文字を読み取れません。
      </Notice>
      <Field label="ファイルを追加（PDF / .txt / .md）">
        <input
          type="file"
          className="input"
          multiple
          accept=".pdf,.txt,.md,.csv"
          onChange={(e) => upload(e.target.files)}
          disabled={busy}
        />
      </Field>
      {busy && (
        <p className="flex items-center gap-2 text-sm text-ink-soft">
          <Spinner /> 読み込んでいます…
        </p>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {files.length === 0 ? (
        <Empty title="資料はまだありません" body="講義スライドを PDF で追加すると精度が上がります。" />
      ) : (
        <ul className="card divide-y divide-line">
          {files.map((file) => (
            <li key={file.storedAs} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-ink-soft">
                  {(file.bytes / 1024).toFixed(0)} KB ・ 読み取れた文字数 {file.chars.toLocaleString()}
                </p>
              </div>
              <button
                className="btn-quiet px-2 py-1 text-xs"
                onClick={async () => {
                  await api.deleteMaterial(id, file.storedAs);
                  await onChanged();
                }}
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
