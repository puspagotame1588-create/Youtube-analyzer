"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, newId, nextLectureNumber } from "@/lib/db";
import { analyzeLecture } from "@/lib/analyze-client";
import { fmtTime, isLikelyHallucination, todayISO } from "@/lib/format";
import {
  ChunkedRecorder,
  extensionFor,
  isRecordingSupported,
  type ChunkInfo,
} from "@/lib/recorder";
import type { Segment } from "@/lib/types";

type Phase = "idle" | "starting" | "recording" | "stopping" | "analyzing";

/** Chunks quieter than this are treated as silence and not sent to the API. */
const SILENCE_PEAK = 0.015;

const CHUNK_OPTIONS = [8, 10, 15];

export default function LiveRecorder() {
  const router = useRouter();
  const params = useSearchParams();
  const initialCourse = params.get("courseId") ?? "";

  const courses = useLiveQuery(() => db.courses.orderBy("name").toArray(), []);
  const [courseId, setCourseId] = useState(initialCourse);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayISO());
  const [chunkSec, setChunkSec] = useState(10);

  const [phase, setPhase] = useState<Phase>("idle");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  const recRef = useRef<ChunkedRecorder | null>(null);
  const lectureIdRef = useRef("");
  const segsRef = useRef<Segment[]>([]);
  const inflight = useRef(new Set<Promise<void>>());
  const lastJaRef = useRef("");
  const lastEnRef = useRef("");
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const listEndRef = useRef<HTMLDivElement | null>(null);

  const nextNumber = useLiveQuery(
    async () => (courseId ? nextLectureNumber(courseId) : 1),
    [courseId],
  );

  useEffect(() => {
    setSupported(isRecordingSupported());
  }, []);

  // Pick the first course automatically when none was given.
  useEffect(() => {
    if (!courseId && courses && courses.length > 0) setCourseId(courses[0].id);
  }, [courses, courseId]);

  // Elapsed-time ticker.
  useEffect(() => {
    if (phase !== "recording") return;
    const id = window.setInterval(() => {
      setElapsed(recRef.current?.elapsed() ?? 0);
    }, 500);
    return () => window.clearInterval(id);
  }, [phase]);

  // Warn before leaving the page mid-recording.
  useEffect(() => {
    if (phase === "idle") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  // Keep the newest segment visible.
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [segments.length]);

  const persistSegments = useCallback(() => {
    if (!lectureIdRef.current) return;
    void db.lectures.update(lectureIdRef.current, { segments: segsRef.current });
  }, []);

  const updateSegment = useCallback(
    (idx: number, patch: Partial<Segment>) => {
      segsRef.current = segsRef.current.map((s) => (s.idx === idx ? { ...s, ...patch } : s));
      setSegments(segsRef.current);
      persistSegments();
    },
    [persistSegments],
  );

  const handleChunk = useCallback(
    (chunk: ChunkInfo) => {
      const idx = segsRef.current.length;
      const seg: Segment = {
        idx,
        startSec: chunk.startSec,
        endSec: chunk.endSec,
        ja: "",
        en: "",
        status: "pending",
      };
      segsRef.current = [...segsRef.current, seg];
      setSegments(segsRef.current);

      if (chunk.peak < SILENCE_PEAK) {
        updateSegment(idx, { status: "silent" });
        return;
      }

      const job = (async () => {
        const fd = new FormData();
        fd.append("file", chunk.blob, `chunk-${idx}.${extensionFor(chunk.mime)}`);
        fd.append("prompt", lastJaRef.current);
        const tr = await fetch("/api/transcribe", { method: "POST", body: fd });
        if (!tr.ok) throw new Error((await tr.json().catch(() => ({}))).error ?? `Transcription failed (${tr.status})`);
        const { text } = (await tr.json()) as { text: string };
        const ja = (text ?? "").trim();
        if (!ja || isLikelyHallucination(ja, chunk.peak)) {
          updateSegment(idx, { status: "silent" });
          return;
        }
        updateSegment(idx, { ja });
        const prevJa = lastJaRef.current;
        const prevEn = lastEnRef.current;
        lastJaRef.current = ja;

        const tl = await fetch("/api/translate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ja, prevJa, prevEn }),
        });
        if (!tl.ok) throw new Error((await tl.json().catch(() => ({}))).error ?? `Translation failed (${tl.status})`);
        const { en } = (await tl.json()) as { en: string };
        lastEnRef.current = en ?? "";
        updateSegment(idx, { en: en ?? "", status: "done" });
      })().catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        // Keep whatever Japanese we got; mark the segment so it can be retried later.
        updateSegment(idx, { status: "error" });
      });

      inflight.current.add(job);
      void job.finally(() => inflight.current.delete(job));
    },
    [updateSegment],
  );

  async function requestWakeLock() {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch {
      // Not critical.
    }
  }

  async function start() {
    if (!courseId) {
      setError("先に科目を選択してください / Choose a course first.");
      return;
    }
    setError(null);
    setPhase("starting");
    try {
      const number = await nextLectureNumber(courseId);
      const id = newId();
      await db.lectures.add({
        id,
        courseId,
        number,
        title: title.trim() || `第${number}回`,
        date,
        createdAt: Date.now(),
        durationSec: 0,
        status: "recording",
        segments: [],
      });
      lectureIdRef.current = id;
      segsRef.current = [];
      setSegments([]);
      lastJaRef.current = "";
      lastEnRef.current = "";

      const rec = new ChunkedRecorder({
        chunkMs: chunkSec * 1000,
        onChunk: handleChunk,
        onLevel: setLevel,
        onError: (e) => setError(e.message),
      });
      await rec.start();
      recRef.current = rec;
      await requestWakeLock();
      setPhase("recording");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(
        message.includes("Permission") || message.includes("NotAllowed")
          ? "マイクの使用が許可されていません。ブラウザの設定でマイクを許可してください。 / Microphone access was denied."
          : message,
      );
      if (lectureIdRef.current) {
        await db.lectures.delete(lectureIdRef.current);
        lectureIdRef.current = "";
      }
      setPhase("idle");
    }
  }

  async function stop() {
    const rec = recRef.current;
    const id = lectureIdRef.current;
    if (!rec || !id) return;
    setPhase("stopping");
    try {
      const { blob, mime, durationSec } = await rec.stop();
      recRef.current = null;
      wakeLockRef.current?.release().catch(() => undefined);
      wakeLockRef.current = null;

      await db.audio.put({ lectureId: id, blob, mime });
      await db.lectures.update(id, { durationSec, audioMime: mime, status: "recorded" });

      // Wait for the last transcription/translation requests to land.
      await Promise.allSettled([...inflight.current]);
      await db.lectures.update(id, { segments: segsRef.current });

      setPhase("analyzing");
      try {
        await analyzeLecture(id);
      } catch {
        // The lecture page shows the error and offers a retry.
      }
      router.push(`/lecture/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("idle");
    }
  }

  const spoken = segments.filter((s) => s.status !== "silent");
  const pendingCount = segments.filter((s) => s.status === "pending").length;
  const course = courses?.find((c) => c.id === courseId);

  if (!supported) {
    return (
      <div className="card p-6">
        <p className="font-medium">このブラウザは録音に対応していません。</p>
        <p className="text-sm text-ink-soft">
          Please use Chrome, Edge, or Safari 14.1+ on a phone or laptop.
        </p>
      </div>
    );
  }

  if (courses && courses.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="font-medium">まず科目を作成してください</p>
        <p className="text-sm text-ink-soft">Create a course before recording.</p>
        <Link href="/" className="btn-primary mt-3">
          ライブラリへ / Go to library
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Setup bar */}
      <div className="card grid gap-3 p-4 md:grid-cols-[1.2fr_1fr_auto_auto]">
        <label className="grid gap-1 text-xs text-ink-soft">
          科目 / Course
          <select
            className="input"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            disabled={phase !== "idle"}
          >
            {(courses ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.teacher ? ` — ${c.teacher}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-ink-soft">
          タイトル（任意） / Title (optional)
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`第${nextNumber ?? 1}回`}
            disabled={phase !== "idle"}
          />
        </label>
        <label className="grid gap-1 text-xs text-ink-soft">
          日付 / Date
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={phase !== "idle"}
          />
        </label>
        <label className="grid gap-1 text-xs text-ink-soft">
          更新間隔 / Chunk
          <select
            className="input"
            value={chunkSec}
            onChange={(e) => setChunkSec(Number(e.target.value))}
            disabled={phase !== "idle"}
          >
            {CHUNK_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}秒
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Control bar */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          {phase === "recording" ? (
            <span className="flex items-center gap-2 text-sm font-medium text-rec">
              <span className="rec-dot inline-block h-3 w-3 rounded-full bg-rec" /> 録音中 REC
            </span>
          ) : (
            <span className="text-sm text-ink-soft">
              {phase === "idle" && "準備完了 / Ready"}
              {phase === "starting" && "マイクを準備中… / Starting…"}
              {phase === "stopping" && "保存中… / Saving…"}
              {phase === "analyzing" && "要約を作成中… / Creating summary…"}
            </span>
          )}
          <span className="font-mono text-2xl tabular-nums">{fmtTime(elapsed)}</span>
          <LevelMeter level={level} active={phase === "recording"} />
        </div>
        <div className="flex items-center gap-3">
          {course && (
            <span className="hidden text-xs text-ink-soft sm:inline">
              {course.name} 第{nextNumber ?? 1}回 · {date}
            </span>
          )}
          {phase === "idle" || phase === "starting" ? (
            <button className="btn-primary" onClick={start} disabled={phase === "starting" || !courseId}>
              ● 録音開始 / Start
            </button>
          ) : (
            <button className="btn-danger" onClick={stop} disabled={phase !== "recording"}>
              ■ 停止して要約 / Stop &amp; summarize
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/40 bg-danger-soft px-4 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      {phase === "analyzing" && (
        <div className="rounded-lg border border-accent/40 bg-accent-soft px-4 py-3 text-sm">
          録音を保存しました。全文から要約・主なポイントを作成しています。長い講義では1〜2分かかります。
          <br />
          Saved. Building the summary and main points from the full transcript; long lectures take a minute or two.
        </div>
      )}

      {/* Live two-column transcript */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-2 border-b border-line text-xs font-semibold">
          <div className="bg-ja-soft px-4 py-2 text-ja">日本語（先生の言葉）</div>
          <div className="bg-en-soft px-4 py-2 text-en">English (live translation)</div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {spoken.length === 0 ? (
            <p className="p-6 text-center text-sm text-ink-soft">
              {phase === "recording"
                ? `最初の${chunkSec}秒を聞いています… / Listening to the first ${chunkSec} seconds…`
                : "録音を開始すると、ここに日本語と英語が同時に表示されます。 / Japanese and English appear here side by side while recording."}
            </p>
          ) : (
            spoken.map((s) => (
              <div key={s.idx} className="grid grid-cols-2 border-b border-line/60 last:border-b-0">
                <div className="px-4 py-2 text-sm leading-relaxed">
                  <span className="mr-2 font-mono text-[11px] text-ink-soft">{fmtTime(s.startSec)}</span>
                  {s.status === "pending" && !s.ja ? (
                    <span className="text-ink-soft">…</span>
                  ) : (
                    s.ja
                  )}
                </div>
                <div className="border-l border-line/60 px-4 py-2 text-sm leading-relaxed">
                  {s.en ? (
                    s.en
                  ) : s.status === "error" ? (
                    <span className="text-danger">翻訳エラー / translation error</span>
                  ) : (
                    <span className="text-ink-soft">…</span>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={listEndRef} />
        </div>
        {pendingCount > 0 && (
          <div className="border-t border-line px-4 py-1.5 text-xs text-ink-soft">
            処理中 {pendingCount} 件 / {pendingCount} chunk{pendingCount > 1 ? "s" : ""} processing
          </div>
        )}
      </div>

      {phase === "recording" && (
        <p className="text-xs text-ink-soft">
          ヒント: 画面を消すと録音が止まることがあります。録音中は画面をつけたままにしてください。
          Tip: locking the phone screen can pause recording; keep the screen on.
        </p>
      )}
    </div>
  );
}

function LevelMeter({ level, active }: { level: number; active: boolean }) {
  const pct = Math.min(100, Math.round(level * 250));
  return (
    <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-2" aria-hidden>
      <div
        className={`h-full rounded-full transition-[width] duration-75 ${active ? "bg-ja" : "bg-line"}`}
        style={{ width: `${active ? pct : 0}%` }}
      />
    </div>
  );
}
