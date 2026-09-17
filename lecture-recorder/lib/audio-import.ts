"use client";

/**
 * Turns an audio file recorded elsewhere — a phone voice memo, a handheld
 * recorder — into the chunks the accurate pass already knows how to handle.
 *
 * The work happens in the browser because the alternative is shipping ffmpeg:
 * the file has to be split before it can be sent (the API caps a request at
 * 25 MB and about 25 minutes), and only the browser can already decode m4a,
 * mp3, aac and the rest without a new dependency.
 */

/**
 * What speech models resample to internally anyway, so sending anything higher
 * costs upload time and buys nothing. One hour arrives as roughly 115 MB of
 * 16-bit WAV, split across chunks that each stay well inside the size cap.
 */
export const IMPORT_SAMPLE_RATE = 16000;

/** Seconds per chunk. At 16 kHz mono this is about 15 MB, inside the 24 MB cap. */
export const IMPORT_CHUNK_SEC = 480;

/** Extensions worth offering in the file picker. The browser decodes all of these. */
export const IMPORT_ACCEPT =
  "audio/*,.m4a,.mp3,.wav,.aac,.ogg,.opus,.webm,.mp4,.flac,.3gp,.amr";

export interface ChunkRange {
  idx: number;
  /** Sample offsets into the decoded audio. */
  from: number;
  to: number;
  startSec: number;
  endSec: number;
}

/** Where each chunk starts and ends. Split out so the arithmetic can be tested. */
export function chunkRanges(
  totalSamples: number,
  sampleRate: number,
  chunkSec: number = IMPORT_CHUNK_SEC,
): ChunkRange[] {
  if (totalSamples <= 0 || sampleRate <= 0 || chunkSec <= 0) return [];
  const per = Math.floor(chunkSec * sampleRate);
  const out: ChunkRange[] = [];
  for (let from = 0, idx = 0; from < totalSamples; from += per, idx++) {
    const to = Math.min(from + per, totalSamples);
    out.push({
      idx,
      from,
      to,
      startSec: from / sampleRate,
      endSec: to / sampleRate,
    });
  }
  // A final sliver of a chunk is a cut point for no gain; fold it into the one
  // before it rather than sending two seconds of audio on its own.
  if (out.length > 1) {
    const last = out[out.length - 1];
    if (last.to - last.from < sampleRate * 10) {
      out.pop();
      const previous = out[out.length - 1];
      previous.to = last.to;
      previous.endSec = last.endSec;
    }
  }
  return out;
}

/**
 * Straight-line resampling. Speech at 16 kHz does not need a windowed filter,
 * and this avoids allocating a second AudioBuffer for a 90 minute lecture.
 */
export function resampleLinear(
  input: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (fromRate === toRate || input.length === 0) return input;
  const ratio = fromRate / toRate;
  const length = Math.max(1, Math.floor(input.length / ratio));
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const at = i * ratio;
    const low = Math.floor(at);
    const high = Math.min(low + 1, input.length - 1);
    const t = at - low;
    out[i] = input[low] * (1 - t) + input[high] * t;
  }
  return out;
}

/** One chunk of samples as a 16-bit PCM WAV file. */
export function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const bytes = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(bytes);
  const ascii = (at: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(at + i, text.charCodeAt(i));
  };

  ascii(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true); // PCM header length
  view.setUint16(20, 1, true); // format: uncompressed PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // bytes per second
  view.setUint16(32, 2, true); // bytes per frame
  view.setUint16(34, 16, true); // bits per sample
  ascii(36, "data");
  view.setUint32(40, samples.length * 2, true);

  for (let i = 0; i < samples.length; i++) {
    // Clamp before scaling: a sample past ±1 would wrap and click loudly.
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([bytes], { type: "audio/wav" });
}

export interface DecodedAudio {
  samples: Float32Array;
  sampleRate: number;
  durationSec: number;
}

/** Decodes any file the browser understands into mono samples at 16 kHz. */
export async function decodeToMono(file: File): Promise<DecodedAudio> {
  const Ctor: typeof AudioContext | undefined =
    typeof window === "undefined"
      ? undefined
      : window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
  if (!Ctor) throw new Error("このブラウザは音声ファイルを読み込めません。");

  // Asking for 16 kHz up front makes the decoder resample as it goes, which
  // keeps a 90 minute lecture from briefly needing a gigabyte at 48 kHz.
  let ctx: AudioContext;
  try {
    ctx = new Ctor({ sampleRate: IMPORT_SAMPLE_RATE });
  } catch {
    ctx = new Ctor();
  }

  let buffer: AudioBuffer;
  try {
    buffer = await ctx.decodeAudioData(await file.arrayBuffer());
  } catch {
    throw new Error(
      "この音声ファイルを読み込めませんでした。m4a・mp3・wav・aac などに変換してからお試しください。",
    );
  } finally {
    void ctx.close().catch(() => undefined);
  }

  let samples: Float32Array;
  if (buffer.numberOfChannels === 1) {
    samples = buffer.getChannelData(0);
  } else {
    // Mixing the channels down keeps a lecturer who lands on only one of them.
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    samples = new Float32Array(left.length);
    for (let i = 0; i < left.length; i++) samples[i] = (left[i] + right[i]) / 2;
  }

  samples = resampleLinear(samples, buffer.sampleRate, IMPORT_SAMPLE_RATE);
  return {
    samples,
    sampleRate: IMPORT_SAMPLE_RATE,
    durationSec: samples.length / IMPORT_SAMPLE_RATE,
  };
}

/** Loudest sample in the file, so a recording too quiet to read can be flagged. */
export function peakLevel(samples: Float32Array): number {
  let peak = 0;
  // A 90 minute file has 86 million samples; every 32nd is plenty for a peak.
  for (let i = 0; i < samples.length; i += 32) {
    const v = Math.abs(samples[i]);
    if (v > peak) peak = v;
  }
  return peak;
}
