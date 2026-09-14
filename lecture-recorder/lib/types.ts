import type { Analysis } from "./analysis-schema";

export type LectureStatus =
  | "recording"
  | "recorded"
  | "analyzing"
  | "done"
  | "error";

export type SegmentStatus = "pending" | "done" | "silent" | "error";

export interface Course {
  id: string;
  name: string;
  teacher: string;
  color: string;
  createdAt: number;
}

export interface Segment {
  idx: number;
  startSec: number;
  endSec: number;
  ja: string;
  en: string;
  status: SegmentStatus;
}

export interface Lecture {
  id: string;
  courseId: string;
  /** 第N回 — auto-incremented per course */
  number: number;
  title: string;
  /** ISO date, YYYY-MM-DD */
  date: string;
  createdAt: number;
  durationSec: number;
  status: LectureStatus;
  segments: Segment[];
  audioMime?: string;
  analysis?: Analysis;
  analysisError?: string;
}

export interface AudioRecord {
  lectureId: string;
  blob: Blob;
  mime: string;
}
