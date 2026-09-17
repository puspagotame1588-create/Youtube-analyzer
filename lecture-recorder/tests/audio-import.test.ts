import { describe, expect, it } from "vitest";
import {
  IMPORT_CHUNK_SEC,
  IMPORT_SAMPLE_RATE,
  chunkRanges,
  encodeWav,
  peakLevel,
  resampleLinear,
} from "@/lib/audio-import";

const RATE = IMPORT_SAMPLE_RATE;

describe("chunkRanges", () => {
  it("covers a 90 minute lecture with no gaps or overlap", () => {
    const ranges = chunkRanges(90 * 60 * RATE, RATE);
    expect(ranges.length).toBeGreaterThan(1);
    expect(ranges[0].startSec).toBe(0);
    expect(ranges.at(-1)!.endSec).toBeCloseTo(90 * 60);
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i].from).toBe(ranges[i - 1].to);
      expect(ranges[i].startSec).toBeCloseTo(ranges[i - 1].endSec);
    }
  });

  it("keeps every chunk inside the upload limits", () => {
    const ranges = chunkRanges(90 * 60 * RATE, RATE);
    for (const r of ranges) {
      const seconds = r.endSec - r.startSec;
      // 16-bit mono, plus the 44 byte header.
      expect((r.to - r.from) * 2 + 44).toBeLessThan(24 * 1024 * 1024);
      expect(seconds).toBeLessThan(1350);
    }
  });

  it("folds a trailing sliver into the chunk before it", () => {
    // Three seconds past a chunk boundary is not worth its own request.
    const ranges = chunkRanges((IMPORT_CHUNK_SEC + 3) * RATE, RATE);
    expect(ranges).toHaveLength(1);
    expect(ranges[0].endSec).toBeCloseTo(IMPORT_CHUNK_SEC + 3);
  });

  it("keeps a trailing chunk that is long enough to stand alone", () => {
    const ranges = chunkRanges((IMPORT_CHUNK_SEC + 120) * RATE, RATE);
    expect(ranges).toHaveLength(2);
    expect(ranges[1].endSec).toBeCloseTo(IMPORT_CHUNK_SEC + 120);
  });

  it("handles a file shorter than one chunk", () => {
    const ranges = chunkRanges(30 * RATE, RATE);
    expect(ranges).toHaveLength(1);
    expect(ranges[0]).toMatchObject({ idx: 0, from: 0, startSec: 0 });
    expect(ranges[0].endSec).toBeCloseTo(30);
  });

  it("returns nothing for empty audio", () => {
    expect(chunkRanges(0, RATE)).toEqual([]);
  });
});

describe("resampleLinear", () => {
  it("returns the input untouched when the rate already matches", () => {
    const input = new Float32Array([0, 0.5, -0.5]);
    expect(resampleLinear(input, RATE, RATE)).toBe(input);
  });

  it("shortens 48 kHz to 16 kHz by a factor of three", () => {
    const input = new Float32Array(48000);
    expect(resampleLinear(input, 48000, 16000)).toHaveLength(16000);
  });

  it("keeps the shape of the signal", () => {
    // A ramp stays a ramp: the first and last samples survive resampling.
    const input = new Float32Array(48000);
    for (let i = 0; i < input.length; i++) input[i] = i / input.length;
    const out = resampleLinear(input, 48000, 16000);
    expect(out[0]).toBeCloseTo(0, 3);
    expect(out.at(-1)!).toBeCloseTo(1, 2);
    expect(out[out.length / 2]).toBeCloseTo(0.5, 2);
  });
});

describe("encodeWav", () => {
  const read = async (blob: Blob) => new DataView(await blob.arrayBuffer());
  const ascii = (view: DataView, at: number, length: number) =>
    String.fromCharCode(...Array.from({ length }, (_, i) => view.getUint8(at + i)));

  it("writes a header a decoder will accept", async () => {
    const view = await read(encodeWav(new Float32Array(RATE), RATE));
    expect(ascii(view, 0, 4)).toBe("RIFF");
    expect(ascii(view, 8, 4)).toBe("WAVE");
    expect(ascii(view, 12, 4)).toBe("fmt ");
    expect(ascii(view, 36, 4)).toBe("data");
    expect(view.getUint16(20, true)).toBe(1); // uncompressed PCM
    expect(view.getUint16(22, true)).toBe(1); // mono
    expect(view.getUint32(24, true)).toBe(RATE);
    expect(view.getUint16(34, true)).toBe(16); // bits per sample
  });

  it("declares the sizes the payload actually has", async () => {
    const blob = encodeWav(new Float32Array(1000), RATE);
    const view = await read(blob);
    expect(blob.size).toBe(44 + 1000 * 2);
    expect(view.getUint32(40, true)).toBe(2000);
    expect(view.getUint32(4, true)).toBe(blob.size - 8);
  });

  it("clamps rather than wrapping a sample past full scale", async () => {
    const view = await read(encodeWav(new Float32Array([2, -2]), RATE));
    // Wrapping would flip these to large negative and positive values.
    expect(view.getInt16(44, true)).toBe(32767);
    expect(view.getInt16(46, true)).toBe(-32768);
  });
});

describe("peakLevel", () => {
  it("finds the loudest sample", () => {
    const samples = new Float32Array(1000);
    samples[640] = -0.8;
    expect(peakLevel(samples)).toBeCloseTo(0.8);
  });

  it("reports silence as zero", () => {
    expect(peakLevel(new Float32Array(1000))).toBe(0);
  });
});
