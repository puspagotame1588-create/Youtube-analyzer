"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  IMPORT_ACCEPT,
  IMPORT_CHUNK_SEC,
  IMPORT_SAMPLE_RATE,
  chunkRanges,
  decodeToMono,
  encodeWav,
  peakLevel,
} from "@/lib/audio-import";
import type { Course } from "@/lib/types";
import { Field, Notice, Spinner } from "./ui";

type Phase = "idle" | "working" | "done" | "error";

/** A recording made too quietly to read back reliably. */
const QUIET_PEAK = 0.05;

export default function ImportAudio() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  const [file, setFile] = useState<File | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState("");
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [lectureId, setLectureId] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .courses()
      .then((list) => {
        setCourses(list);
        if (list.length > 0) {
          setCourseId(list[0].id);
          setLanguage(list[0].language);
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  // Closing the tab mid-upload leaves a half-imported lecture behind.
  useEffect(() => {
    if (phase !== "working") return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase]);

  const start = async () => {
    if (!file || !courseId) return;
    setPhase("working");
    setError("");
    setWarning("");
    setDone(0);
    setTotal(0);

    try {
      setStep("音声を読み込んでいます…");
      // Decoding is synchronous inside the browser once it starts, so let the
      // message paint before the tab goes busy.
      await new Promise((r) => setTimeout(r, 30));
      const audio = await decodeToMono(file);
      if (audio.durationSec < 1) {
        throw new Error("音声が短すぎます。ファイルを確認してください。");
      }
      if (peakLevel(audio.samples) < QUIET_PEAK) {
        setWarning(
          "録音の音量がかなり小さいようです。文字起こしの精度が落ちる可能性があります。次回は録音機を先生に近づけてください。",
        );
      }

      setStep("講義を作成しています…");
      const lecture = await api.createLecture({
        courseId,
        title,
        date,
        language,
        audioMime: file.type || "audio/mpeg",
      });
      setLectureId(lecture.id);

      // The original file becomes the permanent recording, exactly as a live
      // recording's master would, so the audio player and the archive work.
      setStep("音声を保存しています…");
      const saved = await fetch(`/api/lectures/${lecture.id}/master`, {
        method: "POST",
        headers: {
          "content-type": "application/octet-stream",
          "x-elapsed-sec": String(Math.round(audio.durationSec)),
        },
        body: await file.arrayBuffer(),
      });
      if (!saved.ok) throw new Error("音声の保存に失敗しました。");

      const ranges = chunkRanges(audio.samples.length, audio.sampleRate, IMPORT_CHUNK_SEC);
      setTotal(ranges.length);
      for (const range of ranges) {
        setStep("音声を分割して送信しています…");
        // One chunk is encoded at a time; holding every WAV at once would cost
        // a hundred megabytes for a long lecture.
        const wav = encodeWav(audio.samples.subarray(range.from, range.to), audio.sampleRate);
        const form = new FormData();
        form.append("file", wav, `${range.idx}.wav`);
        form.append("idx", String(range.idx));
        form.append("startSec", String(range.startSec));
        form.append("endSec", String(range.endSec));
        const res = await fetch(`/api/lectures/${lecture.id}/pass`, {
          method: "POST",
          body: form,
        });
        if (!res.ok) throw new Error(`音声の送信に失敗しました (${res.status})`);
        setDone(range.idx + 1);
      }

      setStep("文字起こしを開始しています…");
      await api.stop(lecture.id, Math.round(audio.durationSec));
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("error");
    }
  };

  if (courses.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">音声ファイルから作る</h1>
        <Notice tone="warn">
          先に科目を作成してください。
          <Link href="/" className="ml-1 underline">
            ライブラリへ
          </Link>
        </Notice>
      </div>
    );
  }

  const busy = phase === "working";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">音声ファイルから作る</h1>
        <p className="mt-1 text-sm text-ink-soft">
          スマホのボイスメモや IC レコーダーで録った音声を読み込み、録音したときと同じように
          全文・要約・要点・重要ポイントまで作ります。ライブ字幕はありません。
        </p>
      </div>

      <Notice tone="info">
        ノートパソコンの内蔵マイクより、スマホを先生に近い席の机に置いて録音したほうが、
        日本語の聞き取りははっきりします。授業中はパソコンでいつもどおり録音しておき、
        うまく聞き取れなかったときだけスマホの音声をここから読み込む、という使い方もできます。
      </Notice>

      <section className="card p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="科目">
            <select
              className="select"
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                const found = courses.find((c) => c.id === e.target.value);
                if (found) setLanguage(found.language);
              }}
              disabled={busy}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.teacher ? ` — ${c.teacher}` : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="タイトル（任意）">
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="未入力なら AI が付けます"
              disabled={busy}
            />
          </Field>
          <Field label="講義の日付">
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={busy}
            />
          </Field>
          <Field label="講義の言語">
            <select
              className="select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as "ja" | "en")}
              disabled={busy}
            >
              <option value="ja">日本語</option>
              <option value="en">英語</option>
            </select>
          </Field>
        </div>

        <div className="mt-4">
          <Field
            label="音声ファイル"
            hint="m4a・mp3・wav・aac など。スマホのボイスメモをそのまま読み込めます。"
          >
            <input
              ref={input}
              type="file"
              className="input"
              accept={IMPORT_ACCEPT}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={busy}
            />
          </Field>
          {file && (
            <p className="mt-2 text-sm text-ink-soft">
              {file.name}（{(file.size / 1024 / 1024).toFixed(1)} MB）
            </p>
          )}
        </div>

        <button
          className="btn-primary mt-4"
          onClick={start}
          disabled={busy || !file || !courseId}
        >
          {busy ? "処理中…" : "読み込んで文字起こしする"}
        </button>
      </section>

      {busy && (
        <section className="card p-5">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Spinner />
            {step}
          </p>
          {total > 0 && (
            <>
              <p className="mt-2 text-sm text-ink-soft">
                {done} / {total} 区間
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${total ? (done / total) * 100 : 0}%` }}
                />
              </div>
            </>
          )}
          <p className="mt-3 text-xs text-ink-soft">
            この画面は閉じないでください。送信が終われば、あとは閉じても処理は続きます。
          </p>
        </section>
      )}

      {warning && <Notice tone="warn">{warning}</Notice>}

      {phase === "done" && (
        <Notice tone="ok">
          読み込みが完了しました。文字起こしとノートの作成はこのパソコンの中で続きます。
          <button
            className="ml-2 underline"
            onClick={() => router.push(`/lecture/${lectureId}`)}
          >
            講義のページを開く
          </button>
        </Notice>
      )}

      {phase === "error" && <Notice tone="warn">{error}</Notice>}

      <p className="text-xs text-ink-soft">
        音声は {IMPORT_SAMPLE_RATE / 1000} kHz のモノラルに変換し、
        {IMPORT_CHUNK_SEC / 60} 分ずつに区切って文字起こしします。元のファイルは
        そのまま保存され、講義のページで再生できます。
      </p>
    </div>
  );
}
