/**
 * Pure helpers shared by the Lecture Flow pipeline, its validator and the UI.
 *
 * Nothing here touches the filesystem or the network, so every rule below is
 * reachable from the test suite.
 */

import type { LectureFlow, TranscriptFile, TranscriptSegment } from "./types";

/**
 * A transcript segment as the flow refers to it.
 *
 * The stored transcript has no id: segments are addressed by position, which
 * is also how the study list cites them. Rather than migrate every transcript
 * on disk, ids are derived here and kept honest by `transcriptRevision`, which
 * changes the moment the positions would mean something different.
 */
export interface FlowSegment {
  id: string;
  startMs: number | null;
  endMs: number | null;
  text: string;
  /** No diarization in this app, so always null. Kept for the data contract. */
  speaker: string | null;
}

/** Position (0-based) to id. Ids read as s1, s2, … to match the specification. */
export function segmentId(index: number): string {
  return `s${index + 1}`;
}

/** Id back to position, or null when the id is not one this app issues. */
export function segmentIndex(id: string): number | null {
  const match = /^s([1-9]\d*)$/.exec(id.trim());
  if (!match) return null;
  return Number(match[1]) - 1;
}

export function toFlowSegments(segments: TranscriptSegment[]): FlowSegment[] {
  return segments.map((s, i) => ({
    id: segmentId(i),
    startMs: Number.isFinite(s.startSec) ? Math.round(s.startSec * 1000) : null,
    endMs: Number.isFinite(s.endSec) ? Math.round(s.endSec * 1000) : null,
    text: s.source,
    speaker: null,
  }));
}

/* ------------------------------------------------------------- revision --- */

/** FNV-1a, 32-bit. Not cryptographic; this only has to notice a change. */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** djb2, run alongside FNV so two different transcripts have to collide twice. */
function djb2(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (Math.imul(hash, 33) + input.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

const hex = (n: number) => n.toString(16).padStart(8, "0");

/**
 * Identifies the exact transcript a flow was built from.
 *
 * Segment ids are positions, so any edit that moves, adds or removes a segment
 * silently changes what "s4" points at. Storing this with the flow turns that
 * silent change into a visible "outdated" state instead of a wrong citation.
 */
export function transcriptRevision(transcript: TranscriptFile | null): string {
  if (!transcript || transcript.segments.length === 0) return "empty";
  const canonical = transcript.segments
    .map((s) => `${s.startSec}|${s.endSec}|${s.source}`)
    .join("\n");
  const count = transcript.segments.length;
  return `${count.toString(16)}-${hex(fnv1a(canonical))}${hex(djb2(canonical))}`;
}

/** True when a stored flow no longer matches the transcript on disk. */
export function isOutdated(flow: LectureFlow | null, revision: string): boolean {
  if (!flow) return false;
  return flow.transcriptRevision !== revision;
}

/* --------------------------------------------------------------- chunks --- */

export interface ChunkPlan {
  idx: number;
  /** Segments this chunk is responsible for. Owned ranges tile the lecture. */
  ownedFrom: number;
  ownedTo: number;
  /** Wider window sent for context. Never counted twice in the output. */
  contextFrom: number;
  contextTo: number;
}

export interface ChunkOptions {
  /** Characters of transcript per request. The real budget for Japanese. */
  maxChars: number;
  /** Upper bound on segments regardless of length, so a chunk stays readable. */
  maxSegments: number;
  /** Segments of neighbouring context included for interpreting transitions. */
  contextSegments: number;
}

/**
 * Splits a lecture into chunks that fit one request.
 *
 * Packing is by character count rather than segment count because segments
 * vary from a few characters to a few hundred. Each chunk owns a contiguous
 * run and additionally sees its neighbours, so a sentence finished in the next
 * chunk can still be understood without being reported twice.
 */
export function planChunks(lengths: number[], opts: ChunkOptions): ChunkPlan[] {
  const total = lengths.length;
  if (total === 0) return [];
  const maxChars = Math.max(1, opts.maxChars);
  const maxSegments = Math.max(1, opts.maxSegments);
  const context = Math.max(0, opts.contextSegments);

  const plans: ChunkPlan[] = [];
  let from = 0;
  while (from < total) {
    let chars = 0;
    let to = from;
    while (to < total) {
      const next = chars + lengths[to];
      // Always take at least one segment, even one longer than the budget:
      // refusing it would loop forever and losing it would lose the lecture.
      if (to > from && (next > maxChars || to - from >= maxSegments)) break;
      chars = next;
      to++;
    }
    plans.push({
      idx: plans.length,
      ownedFrom: from,
      ownedTo: to,
      contextFrom: Math.max(0, from - context),
      contextTo: Math.min(total, to + context),
    });
    from = to;
  }
  return plans;
}

/* ------------------------------------------------------------ citations --- */

export interface CitationRange {
  fromIndex: number;
  toIndex: number;
  startSec: number | null;
  endSec: number | null;
}

export interface ResolvedCitations {
  /** Ids that exist in this transcript, in reading order, deduplicated. */
  ids: string[];
  indexes: number[];
  /** Ids that did not resolve. Rendered as nothing, never as a guessed link. */
  unknown: string[];
  /**
   * Contiguous runs. Noncontiguous citations stay separate so the display
   * never implies the gap between them was cited.
   */
  ranges: CitationRange[];
  /** Earliest cited moment, for the play button. Null when unplayable. */
  seekSec: number | null;
}

export function resolveCitations(
  ids: string[],
  segments: TranscriptSegment[],
): ResolvedCitations {
  const seen = new Set<number>();
  const unknown: string[] = [];
  for (const raw of ids) {
    const index = segmentIndex(raw);
    if (index === null || index < 0 || index >= segments.length) {
      unknown.push(raw);
      continue;
    }
    seen.add(index);
  }
  const indexes = [...seen].sort((a, b) => a - b);

  const ranges: CitationRange[] = [];
  for (const index of indexes) {
    const last = ranges[ranges.length - 1];
    if (last && index === last.toIndex + 1) {
      last.toIndex = index;
      last.endSec = finiteOrNull(segments[index].endSec);
      continue;
    }
    ranges.push({
      fromIndex: index,
      toIndex: index,
      startSec: finiteOrNull(segments[index].startSec),
      endSec: finiteOrNull(segments[index].endSec),
    });
  }

  const first = ranges.find((r) => r.startSec !== null);
  return {
    ids: indexes.map(segmentId),
    indexes,
    unknown,
    ranges,
    seekSec: first ? first.startSec : null,
  };
}

function finiteOrNull(value: number): number | null {
  return Number.isFinite(value) ? value : null;
}
