"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, type Health } from "@/lib/api";
import { fmtBytes, fmtSec, todayISO } from "@/lib/export";
import { findCues, CATEGORY_LABEL } from "@/lib/highlight";
import {
  DEFAULT_SETTINGS,
  LectureRecorder,
  SILENCE_PEAK,
  extensionFor,
  isSupported,
  listMicrophones,
  pickMimeType,
  type ChunkPayload,
  type RecorderSettings,
} from "@/lib/recorder";
import { Uploader } from "@/lib/uploader";
import type { Course, LiveSegment } from "@/lib/types";
import { Field, Meter, Notice, Spinner } from "./ui";

type Phase = "idle" | "starting" | "recording" | "stopping";

export default function Recorder() {
  const router = useRouter();
  const params = useSearchParams();

  const [health, setHealth] = useState<Health | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState(params.get("courseId") ?? "");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayISO());
  const [language, setLanguage] = useState<"ja" | "en">("ja");

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [settings, setSettings] = useState<RecorderSettings>(DEFAULT_SETTINGS);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [peakSeen, setPeakSeen] = useState(0);
  const [savedBytes, setSavedBytes] = useState(0);
  const [segments, setSegments] = useState<LiveSegment[]>([]);
  const [queued, setQueued] = useState(0);
  const [failures, setFailures] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const [scheduleAt, setScheduleAt] = useState("");
  const [autoStopMin, setAutoStopMin] = useState(95);

  const recorderRef = useRef<LectureRecorder | null>(null);
  const lectureIdRef = useRef("");
  const masterUp = useRef<Uploader | null>(null);
  const liveUp = useRef<Uploader | null>(null);
  const passUp = useRef<Uploader | null>(null);
  const lastIdxRef = useRef(-1);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const startRef = useRef<() => void>(() => undefined);

  /* --------------------------------------------------------------- setup -- */

  useEffect(() => {
    void api.health().then(setHealth).catch(() => undefined);
    void api
      .courses()
      .then((list) => {
        setCourses(list);
        setCourseId((current) => current || list[0]?.id || "");
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : String(err)),
      );
  }, []);

  useEffect(() => {
    const course = courses.find((c) => c.id === courseId);
    if (course) setLanguage(course.language);
  }, [courseId, courses]);

  useEffect(() => {
    if (!health) return;
    setSettings((s) => ({
      ...s,
      liveChunkSec: health.recording.liveChunkSec,
      passChunkSec: health.recording.passChunkSec,
      audioBitsPerSecond: health.recording.audioBitsPerSecond,
    }));
  }, [health]);

  const refreshDevices = useCallback(async () => {
    try {
      const list = await listMicrophones();
      setDevices(list);
      setDeviceId((current) => current || list[0]?.deviceId || "");
    } catch {
      /* permission not granted yet */
    }
  }, []);

  useEffect(() => {
    void refreshDevices();
    navigator.mediaDevices?.addEventListener?.("devicechange", refreshDevices);
    return () => navigator.mediaDevices?.removeEventListener?.("devicechange", refreshDevices);
  }, [refreshDevices]);

  /* ------------------------------------------------------------- runtime -- */

  useEffect(() => {
    if (phase !== "recording") return;
    const timer = window.setInterval(() => {
      setElapsed(recorderRef.current?.elapsed() ?? 0);
      setQueued(
        (masterUp.current?.pending ?? 0) +
          (liveUp.current?.pending ?? 0) +
          (passUp.current?.pending ?? 0),
      );
      setFailures(
        (masterUp.current?.failureCount ?? 0) +
          (liveUp.current?.failureCount ?? 0) +
          (passUp.current?.failureCount ?? 0),
      );
    }, 500);
    return () => window.clearInterval(timer);
  }, [phase]);

  // Poll the local server for captions produced from the uploaded chunks.
  useEffect(() => {
    if (phase !== "recording") return;
    let cancelled = false;
    const tick = async () => {
      const id = lectureIdRef.current;
      if (!id) return;
      try {
        const result = await api.liveSegments(id, lastIdxRef.current);
        if (cancelled || result.segments.length === 0) return;
        lastIdxRef.current = Math.max(
          lastIdxRef.current,
          ...result.segments.map((s) => s.idx),
        );
        setSegments((prev) => {
          const map = new Map(prev.map((s) => [s.idx, s]));
          for (const seg of result.segments) map.set(seg.idx, seg);
          return [...map.values()].sort((a, b) => a.idx - b.idx);
        });
      } catch {
        /* the next tick retries */
      }
    };
    const timer = window.setInterval(tick, 1200);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [phase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [segments.length]);

  // Guard against closing the page mid-lecture.
  useEffect(() => {
    if (phase === "idle") return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  // Windows dims and locks the screen on idle, which can suspend capture.
  const keepAwake = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch {
      /* not fatal */
    }
  }, []);

  useEffect(() => {
    if (phase !== "recording") return;
    void keepAwake();
    const onVisible = () => {
      if (document.visibilityState === "visible") void keepAwake();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [phase, keepAwake]);

  // Warn if the microphone has been near-silent for the first minute.
  useEffect(() => {
    if (phase !== "recording" || elapsed < 45) return;
    setWarning(
      peakSeen < 0.05
        ? "入力レベルがとても低いままです。Windows のサウンド設定で正しいマイクが選ばれているか、入力音量を確認してください。"
        : null,
    );
  }, [phase, elapsed, peakSeen]);

  /* ------------------------------------------------------------ controls -- */

  const start = useCallback(async () => {
    if (!courseId) {
      setError("先に科目を選択してください。");
      return;
    }
    setError(null);
    setWarning(null);
    setPhase("starting");
    try {
      const mime = pickMimeType();

      const lecture = await api.createLecture({
        courseId,
        title: title.trim(),
        date,
        language,
        audioMime: mime || "audio/webm",
      });
      lectureIdRef.current = lecture.id;
      lastIdxRef.current = -1;
      setSegments([]);
      setSavedBytes(0);
      setPeakSeen(0);

      const onFailure = (err: Error) => setError(err.message);
      masterUp.current = new Uploader(onFailure);
      liveUp.current = new Uploader(onFailure);
      passUp.current = new Uploader(onFailure);

      const id = lecture.id;
      const recorder = new LectureRecorder(
        {
          onMaster: (blob, elapsedSec) => {
            void masterUp.current?.send(async () => {
              const res = await fetch(`/api/lectures/${id}/master`, {
                method: "POST",
                headers: {
                  "content-type": "application/octet-stream",
                  "x-elapsed-sec": String(Math.round(elapsedSec)),
                },
                body: blob,
              });
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const body = (await res.json()) as { bytes: number };
              setSavedBytes(body.bytes);
            }, "音声");
          },
          onLiveChunk: (chunk) => {
            setPeakSeen((p) => Math.max(p, chunk.peak));
            void liveUp.current?.send(
              () => uploadChunk(id, "live", chunk, recorder.mime),
              "字幕用の音声",
            );
          },
          onPassChunk: (chunk) => {
            void passUp.current?.send(
              () => uploadChunk(id, "pass", chunk, recorder.mime),
              "精密文字起こし用の音声",
            );
          },
          onLevel: setLevel,
          onError: (err) => setError(err.message),
        },
        settings,
      );

      await recorder.start();
      recorderRef.current = recorder;
      setPhase("recording");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(
        /Permission|NotAllowed/i.test(message)
          ? "マイクの使用が許可されていません。ブラウザのアドレスバー左のアイコンからマイクを許可してください。"
          : message,
      );
      if (lectureIdRef.current) {
        await api.deleteLecture(lectureIdRef.current).catch(() => undefined);
        lectureIdRef.current = "";
      }
      setPhase("idle");
    }
  }, [courseId, date, language, settings, title]);

  startRef.current = () => void start();

  const stop = useCallback(async () => {
    const recorder = recorderRef.current;
    const id = lectureIdRef.current;
    if (!recorder || !id) return;
    setPhase("stopping");
    try {
      const { durationSec } = await recorder.stop();
      recorderRef.current = null;
      void wakeLockRef.current?.release().catch(() => undefined);
      wakeLockRef.current = null;

      await Promise.all([
        masterUp.current?.drain(),
        liveUp.current?.drain(),
        passUp.current?.drain(),
      ]);
      await api.stop(id, durationSec);
      router.push(`/lecture/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("idle");
    }
  }, [router]);

  // Scheduled start: fires while this page is open.
  useEffect(() => {
    if (!scheduleAt || phase !== "idle") return;
    const timer = window.setInterval(() => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (hhmm === scheduleAt) {
        setScheduleAt("");
        startRef.current();
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [scheduleAt, phase]);

  // Automatic stop, so a forgotten recording does not run all afternoon.
  useEffect(() => {
    if (phase !== "recording" || autoStopMin <= 0) return;
    if (elapsed >= autoStopMin * 60) void stop();
  }, [phase, elapsed, autoStopMin, stop]);

  /* ---------------------------------------------------------------- view -- */

  if (!isSupported()) {
    return (
      <Notice tone="error">
        このブラウザは録音に対応していません。Chrome または Edge で開いてください。
      </Notice>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="font-medium">先に科目を作成してください</p>
        <p className="mt-1 text-sm text-ink-soft">
          科目を作ると、録音が第1回・第2回…と自動で整理されます。
        </p>
        <Link href="/" className="btn-primary mt-4">
          ライブラリへ
        </Link>
      </div>
    );
  }

  const spoken = segments.filter((s) => s.status !== "silent");
  const idle = phase === "idle" || phase === "starting";
  const course = courses.find((c) => c.id === courseId);

  return (
    <div className="space-y-4">
      {health && !health.ready && (
        <Notice tone="warn">
          OPENAI_API_KEY が未設定です。録音と音声の保存はできますが、字幕とノートは作成されません。
          <Link href="/settings" className="ml-1 underline">
            設定はこちら
          </Link>
        </Notice>
      )}

      <section className="card p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="科目">
            <select
              className="select"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={!idle}
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
              disabled={!idle}
            />
          </Field>
          <Field label="日付">
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={!idle}
            />
          </Field>
          <Field label="講義の言語">
            <select
              className="select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as "ja" | "en")}
              disabled={!idle}
            >
              <option value="ja">日本語</option>
              <option value="en">英語</option>
            </select>
          </Field>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
          <Field label="マイク" hint="外部マイクを挿してから選び直してください。">
            <select
              className="select"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              disabled={!idle}
            >
              {devices.length === 0 && <option value="">（許可すると一覧が出ます）</option>}
              {devices.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `マイク ${i + 1}`}
                </option>
              ))}
            </select>
          </Field>
          <Field label="予約開始（任意）" hint="この画面を開いたままにしてください。">
            <input
              type="time"
              className="input"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              disabled={!idle}
            />
          </Field>
          <Field label="自動停止（分）">
            <input
              type="number"
              className="input"
              min={0}
              max={300}
              value={autoStopMin}
              onChange={(e) => setAutoStopMin(Number(e.target.value))}
            />
          </Field>
        </div>

        <button
          className="btn-quiet mt-2 px-2 py-1 text-xs"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          {showAdvanced ? "詳細設定を閉じる" : "詳細設定"}
        </button>

        {showAdvanced && (
          <div className="mt-2 grid gap-3 rounded-lg bg-surface-2/60 p-3 md:grid-cols-3">
            <Field label="字幕の更新間隔（秒）" hint="短いほど速く出ますが、精度はやや落ちます。">
              <input
                type="number"
                className="input"
                min={6}
                max={30}
                value={settings.liveChunkSec}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, liveChunkSec: Number(e.target.value) }))
                }
                disabled={!idle}
              />
            </Field>
            <div className="space-y-2 pt-5 text-sm">
              <Toggle
                label="ノイズ抑制"
                hint="通話向けの処理です。遠くの先生の声も削ることがあるため既定はオフ。"
                checked={settings.noiseSuppression}
                disabled={!idle}
                onChange={(v) => setSettings((s) => ({ ...s, noiseSuppression: v }))}
              />
              <Toggle
                label="自動音量調整"
                hint="後方の席や小さな声に有効。既定はオン。"
                checked={settings.autoGainControl}
                disabled={!idle}
                onChange={(v) => setSettings((s) => ({ ...s, autoGainControl: v }))}
              />
            </div>
            <Field label="音質（bps）" hint="32000 が音声には十分です。上げるとファイルが大きくなります。">
              <select
                className="select"
                value={settings.audioBitsPerSecond}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, audioBitsPerSecond: Number(e.target.value) }))
                }
                disabled={!idle}
              >
                <option value={24000}>24000（軽い）</option>
                <option value={32000}>32000（推奨）</option>
                <option value={48000}>48000（高音質）</option>
                <option value={64000}>64000（最高音質）</option>
              </select>
            </Field>
          </div>
        )}
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-4">
          {phase === "recording" ? (
            <span className="flex items-center gap-2 text-sm font-semibold text-rec">
              <span className="rec-dot h-3 w-3 rounded-full bg-rec" /> 録音中
            </span>
          ) : (
            <span className="text-sm text-ink-soft">
              {phase === "idle" && (scheduleAt ? `${scheduleAt} に自動開始します` : "待機中")}
              {phase === "starting" && "マイクを準備しています…"}
              {phase === "stopping" && "保存しています…"}
            </span>
          )}
          <span className="font-mono text-3xl tabular-nums">{fmtSec(elapsed)}</span>
          <Meter level={level} active={phase === "recording"} />
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden text-right text-xs text-ink-soft sm:block">
            <div>
              保存済み {fmtBytes(savedBytes)}
              {queued > 0 ? ` ・ 書き込み待ち ${queued}` : ""}
            </div>
            <div>
              {course?.name} ・ {date}
            </div>
          </div>
          {idle ? (
            <button className="btn-primary" onClick={start} disabled={phase === "starting"}>
              {phase === "starting" && <Spinner />} 録音を開始
            </button>
          ) : (
            <button className="btn-danger" onClick={stop} disabled={phase !== "recording"}>
              {phase === "stopping" && <Spinner />} 停止して書き起こす
            </button>
          )}
        </div>
      </section>

      {error && <Notice tone="error">{error}</Notice>}
      {warning && <Notice tone="warn">{warning}</Notice>}
      {failures > 0 && (
        <Notice tone="warn">
          {failures} 件の音声の保存に失敗しました。ディスクの空き容量を確認してください。
        </Notice>
      )}
      {phase === "recording" && (
        <Notice tone="info">
          ネットが切れても録音は続きます。音声はこのパソコンに保存され、字幕は接続が戻り次第まとめて追いつきます。
        </Notice>
      )}

      <section className="card overflow-hidden">
        <div className="grid grid-cols-2 border-b border-line text-xs font-semibold">
          <div className="bg-src-soft px-4 py-2 text-src">
            {language === "ja" ? "日本語（先生の言葉）" : "English (lecture)"}
          </div>
          <div className="bg-dst-soft px-4 py-2 text-dst">
            {language === "ja" ? "English（ライブ翻訳）" : "日本語（ライブ翻訳）"}
          </div>
        </div>
        <div className="max-h-[52vh] overflow-y-auto">
          {spoken.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink-soft">
              {phase === "recording"
                ? `最初の ${settings.liveChunkSec} 秒を聞き取っています…`
                : "録音を開始すると、ここに日本語と英語が同時に表示されます。"}
            </p>
          ) : (
            spoken.map((s) => {
              const cues = s.source ? findCues(s.source, language) : [];
              return (
              <div
                key={s.idx}
                className={`grid grid-cols-2 border-b border-line/60 last:border-0 ${
                  cues.length ? "bg-warn-soft/50" : ""
                }`}
              >
                <div className="px-4 py-2.5 text-sm leading-relaxed">
                  <span className="mr-2 font-mono text-[11px] text-ink-soft">
                    {fmtSec(s.startSec)}
                  </span>
                  {cues.length > 0 && (
                    <span
                      className="mr-1.5 align-middle text-warn"
                      title={`${cues.map((c) => CATEGORY_LABEL[c.category]).join("・")}（録音後に「重要ポイント」へ整理されます）`}
                    >
                      ★
                    </span>
                  )}
                  {s.status === "error" ? (
                    <span className="text-warn">
                      この区間は文字起こしできませんでした（音声は保存済み。終了後の精密処理で復元されます）
                    </span>
                  ) : (
                    s.source || <span className="text-ink-soft">…</span>
                  )}
                </div>
                <div className="border-l border-line/60 px-4 py-2.5 text-sm leading-relaxed text-ink-soft">
                  {s.translation || (s.status === "done" ? "" : "…")}
                </div>
              </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </section>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-[var(--accent)]"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="text-sm">{label}</span>
        <span className="block text-[11px] text-ink-soft">{hint}</span>
      </span>
    </label>
  );
}

async function uploadChunk(
  lectureId: string,
  kind: "live" | "pass",
  chunk: ChunkPayload,
  mime: string,
): Promise<void> {
  const form = new FormData();
  const silent = kind === "live" && chunk.peak < SILENCE_PEAK;
  if (!silent) {
    form.append("file", chunk.blob, `${chunk.idx}.${extensionFor(mime || chunk.blob.type)}`);
  }
  form.append("idx", String(chunk.idx));
  form.append("startSec", String(chunk.startSec));
  form.append("endSec", String(chunk.endSec));
  if (silent) form.append("silent", "1");
  const res = await fetch(`/api/lectures/${lectureId}/${kind}`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
