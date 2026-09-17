"use client";

/**
 * Captures the microphone into three recorders that share one input stream:
 *
 *   master — one continuous recording, flushed to disk every few seconds. This
 *            is the permanent archive and the only one that is gapless.
 *   live   — restarted every ~15 s; each stop yields a standalone file that can
 *            be transcribed immediately for live captions.
 *   pass   — restarted every ~10 min; standalone files for the accurate pass
 *            after the lecture, where long context means far better Japanese.
 *
 * MediaRecorder's own timeslice cannot be used for the standalone files: only
 * the first slice carries the container header, so later slices are not
 * decodable alone. Restarting the recorder is what makes each file complete.
 */

export interface ChunkPayload {
  blob: Blob;
  idx: number;
  startSec: number;
  endSec: number;
  peak: number;
}

export interface RecorderCallbacks {
  onMaster: (bytes: Blob, elapsedSec: number) => void;
  onLiveChunk: (chunk: ChunkPayload) => void;
  onPassChunk: (chunk: ChunkPayload) => void;
  onLevel: (level: number) => void;
  onError: (error: Error) => void;
}

export interface RecorderSettings {
  deviceId?: string;
  liveChunkSec: number;
  passChunkSec: number;
  audioBitsPerSecond: number;
  /** Browser voice processing. Off by default: it is tuned for phone calls and
   *  can swallow a lecturer speaking from across a large hall. */
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
}

export const DEFAULT_SETTINGS: RecorderSettings = {
  liveChunkSec: 15,
  passChunkSec: 600,
  audioBitsPerSecond: 64000,
  noiseSuppression: false,
  echoCancellation: false,
  autoGainControl: true,
};

const CANDIDATE_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];

export function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  return CANDIDATE_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

export function extensionFor(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4")) return "mp4";
  return "webm";
}

export function isSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined"
  );
}

export async function listMicrophones(): Promise<MediaDeviceInfo[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === "audioinput");
}

/**
 * Absolute floor below which a chunk carries no speech at all. Deliberately
 * very low: a microphone at the back of a lecture hall produces a weak signal,
 * and skipping real speech to save an API call is the worst trade available.
 */
export const SILENCE_FLOOR = 0.004;

/**
 * A chunk is also skipped if it is far quieter than the loudest audio heard so
 * far this lecture, which adapts to the room and the microphone instead of
 * assuming a level.
 */
export const SILENCE_RATIO = 0.06;

/** Whether a chunk is quiet enough to skip, given the loudest audio so far. */
export function isSilent(peak: number, sessionPeak: number): boolean {
  return peak < Math.max(SILENCE_FLOOR, sessionPeak * SILENCE_RATIO);
}

export class LectureRecorder {
  private stream: MediaStream | null = null;
  private master: MediaRecorder | null = null;
  private live: MediaRecorder | null = null;
  private pass: MediaRecorder | null = null;
  private liveTimer: number | null = null;
  private passTimer: number | null = null;
  private running = false;
  private startedAt = 0;
  private liveIdx = 0;
  private passIdx = 0;

  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private raf: number | null = null;
  private livePeak = 0;
  private passPeak = 0;
  private lastLevelAt = 0;

  mime = "";

  constructor(
    private readonly cb: RecorderCallbacks,
    private readonly settings: RecorderSettings,
  ) {}

  elapsed(): number {
    return this.startedAt ? (performance.now() - this.startedAt) / 1000 : 0;
  }

  async start(): Promise<void> {
    if (!isSupported()) {
      throw new Error(
        "このブラウザは録音に対応していません。Chrome または Edge をお使いください。",
      );
    }
    const { deviceId, noiseSuppression, echoCancellation, autoGainControl } = this.settings;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        channelCount: 1,
        noiseSuppression,
        echoCancellation,
        autoGainControl,
      },
    });
    this.mime = pickMimeType();
    this.running = true;
    this.startedAt = performance.now();

    this.master = this.makeRecorder();
    this.master.ondataavailable = (e) => {
      if (e.data.size > 0) this.cb.onMaster(e.data, this.elapsed());
    };
    this.master.onerror = () => this.cb.onError(new Error("録音エラーが発生しました"));
    // Flushed every 5 s, so a crash costs at most five seconds of audio.
    this.master.start(5000);

    this.setupMeter();
    this.cycle("live");
    this.cycle("pass");
  }

  private makeRecorder(): MediaRecorder {
    const options: MediaRecorderOptions = {
      audioBitsPerSecond: this.settings.audioBitsPerSecond,
    };
    if (this.mime) options.mimeType = this.mime;
    return new MediaRecorder(this.stream!, options);
  }

  /** Starts one standalone chunk and schedules its stop. */
  private cycle(kind: "live" | "pass"): void {
    if (!this.running || !this.stream) return;
    const rec = this.makeRecorder();
    const startSec = this.elapsed();
    const idx = kind === "live" ? this.liveIdx++ : this.passIdx++;
    const parts: Blob[] = [];
    if (kind === "live") this.livePeak = 0;
    else this.passPeak = 0;

    rec.ondataavailable = (e) => {
      if (e.data.size > 0) parts.push(e.data);
    };
    rec.onstop = () => {
      const endSec = this.elapsed();
      const blob = new Blob(parts, { type: rec.mimeType || this.mime || "audio/webm" });
      if (blob.size > 0) {
        const payload: ChunkPayload = {
          blob,
          idx,
          startSec,
          endSec,
          peak: kind === "live" ? this.livePeak : this.passPeak,
        };
        if (kind === "live") this.cb.onLiveChunk(payload);
        else this.cb.onPassChunk(payload);
      }
      this.cycle(kind);
    };
    rec.start();

    const ms =
      (kind === "live" ? this.settings.liveChunkSec : this.settings.passChunkSec) * 1000;
    const timer = window.setTimeout(() => {
      if (rec.state !== "inactive") rec.stop();
    }, ms);

    if (kind === "live") {
      this.live = rec;
      this.liveTimer = timer;
    } else {
      this.pass = rec;
      this.passTimer = timer;
    }
  }

  private setupMeter(): void {
    if (!this.stream || typeof AudioContext === "undefined") return;
    try {
      this.audioCtx = new AudioContext();
      const source = this.audioCtx.createMediaStreamSource(this.stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 1024;
      source.connect(this.analyser);
      const data = new Uint8Array(this.analyser.fftSize);
      const tick = () => {
        if (!this.analyser) return;
        this.analyser.getByteTimeDomainData(data);
        let max = 0;
        for (let i = 0; i < data.length; i++) {
          const v = Math.abs(data[i] - 128) / 128;
          if (v > max) max = v;
        }
        if (max > this.livePeak) this.livePeak = max;
        if (max > this.passPeak) this.passPeak = max;
        const now = performance.now();
        if (now - this.lastLevelAt > 80) {
          this.lastLevelAt = now;
          this.cb.onLevel(max);
        }
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    } catch {
      // The level meter is a convenience; recording works without it.
    }
  }

  /** Stops everything and resolves once the final chunks have been emitted. */
  async stop(): Promise<{ durationSec: number }> {
    this.running = false;
    if (this.liveTimer !== null) clearTimeout(this.liveTimer);
    if (this.passTimer !== null) clearTimeout(this.passTimer);
    this.liveTimer = null;
    this.passTimer = null;

    await Promise.all([this.finish(this.live), this.finish(this.pass)]);
    const durationSec = this.elapsed();
    await this.finish(this.master);

    this.teardown();
    return { durationSec };
  }

  private finish(rec: MediaRecorder | null): Promise<void> {
    return new Promise((resolve) => {
      if (!rec || rec.state === "inactive") {
        resolve();
        return;
      }
      const previous = rec.onstop;
      rec.onstop = (event) => {
        if (typeof previous === "function") previous.call(rec, event);
        resolve();
      };
      rec.stop();
    });
  }

  private teardown(): void {
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.analyser = null;
    void this.audioCtx?.close().catch(() => undefined);
    this.audioCtx = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.master = null;
    this.live = null;
    this.pass = null;
  }
}
