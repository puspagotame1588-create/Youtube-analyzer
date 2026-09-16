"use client";

import type {
  ChatTurn,
  Course,
  Flashcards,
  Lecture,
  LiveSegment,
  MaterialFile,
  Notes,
  TranscriptFile,
} from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!res.ok) {
    const message =
      (body as { error?: string } | null)?.error ?? `通信に失敗しました (${res.status})`;
    throw new Error(message);
  }
  return body as T;
}

const json = (value: unknown): RequestInit => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(value),
});

export interface Health {
  ready: boolean;
  dataDir: string;
  models: { live: string; transcribe: string; notes: string; fast: string };
  recording: { liveChunkSec: number; passChunkSec: number; audioBitsPerSecond: number };
}

export interface LectureBundle {
  lecture: Lecture & { finalizing?: boolean };
  transcript: TranscriptFile | null;
  notes: Notes | null;
  materials: MaterialFile[];
}

export const api = {
  health: () => request<Health>("/api/health"),

  courses: () => request<Course[]>("/api/courses"),
  createCourse: (input: {
    name: string;
    teacher: string;
    language: "ja" | "en";
    keywords: string[];
  }) => request<Course>("/api/courses", json(input)),
  updateCourse: (id: string, patch: Partial<Course>) =>
    request<Course>(`/api/courses/${id}`, { ...json(patch), method: "PATCH" }),
  deleteCourse: (id: string) =>
    request<{ deleted: true }>(`/api/courses/${id}`, { method: "DELETE" }),

  lectures: () => request<Lecture[]>("/api/lectures"),
  createLecture: (input: {
    courseId: string;
    title: string;
    date: string;
    language?: "ja" | "en";
    audioMime: string;
  }) => request<Lecture>("/api/lectures", json(input)),
  lecture: (id: string) => request<LectureBundle>(`/api/lectures/${id}`),
  updateLecture: (id: string, patch: { title?: string; date?: string }) =>
    request<Lecture>(`/api/lectures/${id}`, { ...json(patch), method: "PATCH" }),
  deleteLecture: (id: string) =>
    request<{ deleted: true }>(`/api/lectures/${id}`, { method: "DELETE" }),

  liveSegments: (id: string, after: number) =>
    request<{
      segments: LiveSegment[];
      status: Lecture["status"];
      pendingChunks: number;
      durationSec: number;
    }>(`/api/lectures/${id}/live?after=${after}`),

  stop: (id: string, durationSec: number) =>
    request<{ stopped: true; finalizing: boolean }>(
      `/api/lectures/${id}/stop`,
      json({ durationSec, autoFinalize: true }),
    ),
  finalize: (id: string, force = false) =>
    request<{ started: boolean; running?: boolean }>(
      `/api/lectures/${id}/finalize`,
      json({ force }),
    ),

  transcript: (id: string) => request<TranscriptFile>(`/api/lectures/${id}/transcript`),
  notes: (id: string) => request<Notes | null>(`/api/lectures/${id}/notes`),

  flashcards: (id: string) => request<Flashcards | null>(`/api/lectures/${id}/flashcards`),
  makeFlashcards: (id: string) =>
    request<Flashcards>(`/api/lectures/${id}/flashcards`, { method: "POST" }),

  chat: (id: string) => request<ChatTurn[]>(`/api/lectures/${id}/chat`),
  ask: (id: string, question: string) =>
    request<{ turn: ChatTurn; grounded: boolean }>(
      `/api/lectures/${id}/chat`,
      json({ question }),
    ),

  materials: (id: string) => request<MaterialFile[]>(`/api/lectures/${id}/materials`),
  uploadMaterial: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<MaterialFile>(`/api/lectures/${id}/materials`, {
      method: "POST",
      body: form,
    });
  },
  deleteMaterial: (id: string, storedAs: string) =>
    request<{ deleted: true }>(
      `/api/lectures/${id}/materials?storedAs=${encodeURIComponent(storedAs)}`,
      { method: "DELETE" },
    ),
};
