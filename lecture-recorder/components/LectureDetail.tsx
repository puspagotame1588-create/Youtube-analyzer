"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, deleteLecture } from "@/lib/db";
import { analyzeLecture } from "@/lib/analyze-client";
import { fmtDuration, fmtTime, lectureToMarkdown, safeFileName, spokenSegments } from "@/lib/format";
import type { Bilingual } from "@/lib/analysis-schema";
import StatusPill from "./StatusPill";

type Tab = "summary" | "points" | "transcript";
type Lang = "both" | "ja" | "en";

export default function LectureDetail({ id }: { id: string }) {
  const router = useRouter();
  const lecture = useLiveQuery(() => db.lectures.get(id), [id]);
  const course = useLiveQuery(
    async () => (lecture ? db.courses.get(lecture.courseId) : undefined),
    [lecture?.courseId],
  );
  const audio = useLiveQuery(() => db.audio.get(id), [id]);

  const [tab, setTab] = useState<Tab>("summary");
  const [lang, setLang] = useState<Lang>("both");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioUrl = useMemo(() => (audio?.blob ? URL.createObjectURL(audio.blob) : null), [audio]);
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  if (lecture === undefined) {
    return <p className="text-sm text-ink-soft">読み込み中… / Loading…</p>;
  }
  if (lecture === null) {
    return (
      <div className="card p-6">
        <p className="font-medium">講義が見つかりません / Lecture not found</p>
        <Link href="/" className="btn-ghost mt-3">
          ライブラリへ
        </Link>
      </div>
    );
  }

  const a = lecture.analysis;
  const spoken = spokenSegments(lecture.segments);

  async function reanalyze() {
    setBusy(true);
    setNotice(null);
    try {
      await analyzeLecture(id);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!lecture) return;
    const md = lectureToMarkdown(lecture, course ?? undefined);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeFileName(`${course?.name ?? "lecture"}_第${lecture.number}回_${lecture.date}`)}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function copy() {
    if (!lecture) return;
    try {
      await navigator.clipboard.writeText(lectureToMarkdown(lecture, course ?? undefined));
      setNotice("コピーしました / Copied to clipboard");
      setTimeout(() => setNotice(null), 2000);
    } catch {
      setNotice("コピーできませんでした / Could not copy");
    }
  }

  async function remove() {
    const ok = window.confirm(
      "この講義（音声・文字起こし・要約）を削除しますか？\nDelete this lecture, its audio, transcript and summary? This cannot be undone.",
    );
    if (!ok) return;
    await deleteLecture(id);
    router.push("/");
  }

  async function saveTitle() {
    const t = titleDraft.trim();
    if (t) await db.lectures.update(id, { title: t });
    setEditingTitle(false);
  }

  function seek(sec: number) {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = sec;
    void el.play().catch(() => undefined);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-ink-soft">
              <Link href="/" className="hover:underline">
                ライブラリ
              </Link>{" "}
              / {course?.name ?? "…"} / 第{lecture.number}回
            </p>
            {editingTitle ? (
              <form
                className="mt-1 flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveTitle();
                }}
              >
                <input
                  className="input max-w-md"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  autoFocus
                />
                <button className="btn-primary px-3 py-1.5" type="submit">
                  保存
                </button>
                <button className="btn-ghost px-3 py-1.5" type="button" onClick={() => setEditingTitle(false)}>
                  取消
                </button>
              </form>
            ) : (
              <h1 className="mt-1 text-xl font-semibold leading-tight">
                {lecture.title}{" "}
                <button
                  className="ml-1 text-xs font-normal text-ink-soft hover:text-ink"
                  onClick={() => {
                    setTitleDraft(lecture.title);
                    setEditingTitle(true);
                  }}
                >
                  編集
                </button>
              </h1>
            )}
            {a && lang !== "ja" && a.title.en && (
              <p className="text-sm text-ink-soft">{a.title.en}</p>
            )}
            <p className="mt-1 text-xs text-ink-soft">
              {lecture.date}
              {course?.teacher ? ` · ${course.teacher}` : ""} · {fmtDuration(lecture.durationSec)} ·{" "}
              {spoken.length} 区間
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={lecture.status} />
            <button className="btn-ghost px-3 py-1.5 text-xs" onClick={download}>
              ⤓ Markdown
            </button>
            <button className="btn-ghost px-3 py-1.5 text-xs" onClick={copy}>
              コピー
            </button>
            <button
              className="btn-ghost px-3 py-1.5 text-xs"
              onClick={reanalyze}
              disabled={busy || lecture.status === "analyzing" || lecture.status === "recording"}
            >
              {busy || lecture.status === "analyzing" ? "分析中…" : a ? "再分析" : "要約を作成"}
            </button>
            <button className="text-xs text-ink-soft hover:text-danger" onClick={remove}>
              削除
            </button>
          </div>
        </div>

        {audioUrl && (
          <audio ref={audioRef} controls src={audioUrl} className="mt-3 w-full" preload="metadata" />
        )}
        {notice && <p className="mt-2 text-xs text-ink-soft">{notice}</p>}
        {lecture.status === "error" && lecture.analysisError && (
          <div className="mt-3 rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger">
            {lecture.analysisError}
          </div>
        )}
        {lecture.status === "analyzing" && (
          <div className="mt-3 rounded-lg border border-accent/40 bg-accent-soft px-3 py-2 text-sm">
            要約を作成中… / Building the summary. This page updates automatically.
          </div>
        )}
      </div>

      {/* Tabs + language switch */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg border border-line bg-surface p-1">
          {(
            [
              ["summary", "要約 / Summary"],
              ["points", "主なポイント / Main points"],
              ["transcript", "全文 / Transcript"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-md px-3 py-1.5 text-sm ${tab === key ? "bg-accent text-accent-ink" : "text-ink-soft hover:bg-surface-2"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg border border-line bg-surface p-1 text-xs">
          {(
            [
              ["both", "日英"],
              ["ja", "日本語"],
              ["en", "English"],
            ] as [Lang, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setLang(key)}
              className={`rounded-md px-2.5 py-1 ${lang === key ? "bg-surface-2 font-medium" : "text-ink-soft"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "summary" && (
        <section className="space-y-4">
          {!a ? (
            <EmptyAnalysis status={lecture.status} />
          ) : (
            <>
              <div className="card p-5">
                <h2 className="mb-3 text-sm font-semibold text-ink-soft">要約 / Summary</h2>
                <BiText text={a.summary} lang={lang} paragraphs />
              </div>
              {a.topics.length > 0 && (
                <div className="card p-5">
                  <h2 className="mb-3 text-sm font-semibold text-ink-soft">
                    講義の流れ / Topics in order
                  </h2>
                  <ol className="space-y-4">
                    {a.topics.map((t, i) => (
                      <li key={i} className="grid gap-1 border-l-2 border-accent/40 pl-3">
                        <div className="font-medium">
                          <span className="mr-2 text-ink-soft">{i + 1}.</span>
                          <BiInline text={t.heading} lang={lang} />
                        </div>
                        <BiText text={t.detail} lang={lang} small />
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {tab === "points" && (
        <section className="card p-5">
          {!a ? (
            <EmptyAnalysis status={lecture.status} />
          ) : (
            <ol className="space-y-3">
              {a.mainPoints.map((p, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                    {i + 1}
                  </span>
                  <div className="grid gap-0.5">
                    <BiText text={p} lang={lang} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {tab === "transcript" && (
        <section className="card overflow-hidden">
          {spoken.length === 0 ? (
            <p className="p-6 text-center text-sm text-ink-soft">
              文字起こしがありません / No transcript.
            </p>
          ) : (
            <ul className="divide-y divide-line/60">
              {spoken.map((s) => (
                <li key={s.idx} className="grid gap-1 px-4 py-3 sm:grid-cols-[auto_1fr]">
                  <button
                    className="font-mono text-[11px] text-ink-soft hover:text-accent sm:pt-1"
                    onClick={() => seek(s.startSec)}
                    title="Play from here"
                  >
                    ▶ {fmtTime(s.startSec)}
                  </button>
                  <div className={lang === "both" ? "grid gap-2 md:grid-cols-2" : ""}>
                    {lang !== "en" && <p className="text-sm leading-relaxed">{s.ja}</p>}
                    {lang !== "ja" && (
                      <p className="text-sm leading-relaxed text-ink-soft">
                        {s.en || (s.status === "error" ? "（翻訳エラー）" : "")}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function EmptyAnalysis({ status }: { status: string }) {
  return (
    <div className="card p-6 text-center text-sm text-ink-soft">
      {status === "analyzing"
        ? "要約を作成中です… / The summary is being generated…"
        : "まだ要約がありません。「要約を作成」を押してください。 / No summary yet. Press 要約を作成 above."}
    </div>
  );
}

function BiText({
  text,
  lang,
  paragraphs = false,
  small = false,
}: {
  text: Bilingual;
  lang: Lang;
  paragraphs?: boolean;
  small?: boolean;
}) {
  const cls = `${small ? "text-sm" : "text-[15px]"} leading-relaxed`;
  const render = (s: string, muted: boolean) =>
    paragraphs ? (
      s
        .split(/\n{2,}|\n/)
        .filter((p) => p.trim())
        .map((p, i) => (
          <p key={i} className={`${cls} ${muted ? "text-ink-soft" : ""}`}>
            {p}
          </p>
        ))
    ) : (
      <p className={`${cls} ${muted ? "text-ink-soft" : ""}`}>{s}</p>
    );
  return (
    <div className="grid gap-2">
      {lang !== "en" && <div className="grid gap-2">{render(text.ja, false)}</div>}
      {lang !== "ja" && <div className="grid gap-2">{render(text.en, lang === "both")}</div>}
    </div>
  );
}

function BiInline({ text, lang }: { text: Bilingual; lang: Lang }) {
  if (lang === "ja") return <>{text.ja}</>;
  if (lang === "en") return <>{text.en}</>;
  return (
    <>
      {text.ja} <span className="font-normal text-ink-soft">/ {text.en}</span>
    </>
  );
}
