"use client";

/**
 * ChunkedRecorder
 *
 * Captures the microphone into two MediaRecorders on the same stream:
 *   1. `full`   — one continuous recording, kept for playback after the lecture.
 *   2. `chunker` — restarted every `chunkMs`; each stop yields a standalone,
 *      independently decodable audio file that can be sent for transcription
 *      while the lecture is still going on.
 *
 * MediaRecorder's own `timeslice` cannot be used for the live chunks because
 * only the first slice carries the container header; the later slices are not
 * decodable on their own. Restarting the recorder is the reliable way to get
 * self-contained chunks in every browser.
 *
 * A lightweight level meter (Web Audio AnalyserNode) runs alongside so the UI
 * can show input level and so near-silent chunks can be skipped.
 */

export interface ChunkInfo {
  blob: Blob;
  mime: string;
  startSec: number;
  endSec: number;
  /** Peak input amplitude during the chunk, 0..1 */
  peak: number;
}

export interface RecorderOptions {
  chunkMs: number;
  onChunk: (chunk: ChunkInfo) => void;
  onLevel?: (level: number) => void;
  onError?: (error: Error) => void;
}

const CANDIDATE_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

export function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  return CANDIDATE_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

export function extensionFor(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  return "webm";
}

export function isRecordingSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined"
  );
}

export class ChunkedRecorder {
  readonly opts: RecorderOptions;
  mime = "";

  private stream: MediaStream | null = null;
  private full: MediaRecorder | null = null;
  private fullParts: Blob[] = [];
  private chunker: MediaRecorder | null = null;
  private chunkTimer: number | null = null;
  private running = false;
  private startedAt = 0;

  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private meterRaf: number | null = null;
  private peak = 0;
  private lastLevelEmit = 0;

  constructor(opts: RecorderOptions) {
    this.opts = opts;
  }

  /** Seconds since start() */
  elapsed(): number {
    if (!this.startedAt) return 0;
    return (performance.now() - this.startedAt) / 1000;
  }

  async start(): Promise<void> {
    if (!isRecordingSupported()) {
      throw new Error("This browser cannot record audio. Use Chrome, Edge or Safari 14.1+.");
    }
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    this.mime = pickMimeType();
    const recOpts = this.mime ? { mimeType: this.mime } : undefined;

    this.full = new MediaRecorder(this.stream, recOpts);
    this.full.ondataavailable = (e) => {
      if (e.data.size > 0) this.fullParts.push(e.data);
    };
    this.full.onerror = () => this.opts.onError?.(new Error("Recording error"));
    // Flush the continuous recording every second so a crash loses at most 1s.
    this.full.start(1000);

    this.running = true;
    this.startedAt = performance.now();
    this.setupMeter();
    this.startChunker();
  }

  private startChunker(): void {
    if (!this.running || !this.stream) return;
    const rec = new MediaRecorder(
      this.stream,
      this.mime ? { mimeType: this.mime } : undefined,
    );
    const startSec = this.elapsed();
    const parts: Blob[] = [];
    this.peak = 0;

    rec.ondataavailable = (e) => {
      if (e.data.size > 0) parts.push(e.data);
    };
    rec.onstop = () => {
      const endSec = this.elapsed();
      const type = rec.mimeType || this.mime || "audio/webm";
      const blob = new Blob(parts, { type });
      if (blob.size > 0) {
        this.opts.onChunk({
          blob,
          mime: type,
          startSec,
          endSec,
          peak: this.peak,
        });
      }
      // Immediately begin the next chunk (unless stop() was called).
      this.startChunker();
    };
    rec.start();
    this.chunker = rec;
    this.chunkTimer = window.setTimeout(() => {
      if (rec.state !== "inactive") rec.stop();
    }, this.opts.chunkMs);
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
        if (max > this.peak) this.peak = max;
        const now = performance.now();
        if (now - this.lastLevelEmit > 80) {
          this.lastLevelEmit = now;
          this.opts.onLevel?.(max);
        }
        this.meterRaf = requestAnimationFrame(tick);
      };
      this.meterRaf = requestAnimationFrame(tick);
    } catch {
      // Level meter is optional; recording works without it.
    }
  }

  async stop(): Promise<{ blob: Blob; mime: string; durationSec: number }> {
    this.running = false;
    if (this.chunkTimer !== null) {
      clearTimeout(this.chunkTimer);
      this.chunkTimer = null;
    }
    // Emit the final partial chunk.
    if (this.chunker && this.chunker.state !== "inactive") {
      await new Promise<void>((resolve) => {
        const rec = this.chunker!;
        const prev = rec.onstop;
        rec.onstop = (ev) => {
          if (typeof prev === "function") prev.call(rec, ev);
          resolve();
        };
        rec.stop();
      });
    }
    const durationSec = this.elapsed();

    const blob = await new Promise<Blob>((resolve) => {
      const full = this.full;
      if (!full || full.state === "inactive") {
        resolve(new Blob(this.fullParts, { type: this.mime || "audio/webm" }));
        return;
      }
      full.onstop = () => {
        resolve(
          new Blob(this.fullParts, { type: full.mimeType || this.mime || "audio/webm" }),
        );
      };
      full.stop();
    });

    this.teardown();
    return { blob, mime: blob.type, durationSec };
  }

  private teardown(): void {
    if (this.meterRaf !== null) cancelAnimationFrame(this.meterRaf);
    this.meterRaf = null;
    this.analyser = null;
    void this.audioCtx?.close().catch(() => undefined);
    this.audioCtx = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.full = null;
    this.chunker = null;
  }
}
