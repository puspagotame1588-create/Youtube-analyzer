"use client";

import { AnalysisSchema, type AnalyzeRequest } from "./analysis-schema";
import { db } from "./db";
import { spokenSegments } from "./format";

/**
 * Runs the post-lecture analysis (summary + main points + topics) for a stored
 * lecture and saves the result. Safe to call again to re-analyze.
 */
export async function analyzeLecture(lectureId: string): Promise<void> {
  const lecture = await db.lectures.get(lectureId);
  if (!lecture) throw new Error("Lecture not found");
  const course = await db.courses.get(lecture.courseId);

  await db.lectures.update(lectureId, { status: "analyzing", analysisError: undefined });

  const spoken = spokenSegments(lecture.segments);
  if (spoken.length === 0) {
    await db.lectures.update(lectureId, {
      status: "error",
      analysisError: "No speech was transcribed, so there is nothing to summarize.",
    });
    return;
  }

  const body: AnalyzeRequest = {
    course: course?.name ?? "",
    teacher: course?.teacher ?? "",
    lectureNumber: lecture.number,
    date: lecture.date,
    title: lecture.title,
    segments: spoken.map((s) => ({ startSec: s.startSec, ja: s.ja, en: s.en })),
  };

  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Analysis failed (${res.status})`);
    }
    const analysis = AnalysisSchema.parse(await res.json());
    const patch: Partial<typeof lecture> = { analysis, status: "done" };
    // Adopt the inferred title if the user left the default one.
    if (/^第\d+回$/.test(lecture.title.trim()) && analysis.title.ja.trim()) {
      patch.title = analysis.title.ja.trim();
    }
    await db.lectures.update(lectureId, patch);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.lectures.update(lectureId, { status: "error", analysisError: message });
    throw err;
  }
}
