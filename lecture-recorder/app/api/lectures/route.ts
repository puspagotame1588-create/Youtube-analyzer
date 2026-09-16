import { z } from "zod";
import { fail, failFrom, newId, ok } from "@/lib/server/http";
import { listLectures, readCourses, writeLecture } from "@/lib/server/store";
import type { Lecture } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().default(""),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません"),
  language: z.enum(["ja", "en"]).optional(),
  audioMime: z.string().default("audio/webm"),
});

export async function GET() {
  try {
    return ok(await listLectures());
  } catch (err) {
    return failFrom(err);
  }
}

export async function POST(req: Request) {
  try {
    const parsed = CreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "入力が正しくありません");
    }
    const courses = await readCourses();
    const course = courses.find((c) => c.id === parsed.data.courseId);
    if (!course) return fail("科目が見つかりません", 404);

    const existing = await listLectures();
    const number =
      existing
        .filter((l) => l.courseId === course.id)
        .reduce((max, l) => Math.max(max, l.number), 0) + 1;

    const now = Date.now();
    const lecture: Lecture = {
      id: newId(),
      courseId: course.id,
      number,
      title: parsed.data.title.trim(),
      date: parsed.data.date,
      language: parsed.data.language ?? course.language,
      status: "recording",
      createdAt: now,
      updatedAt: now,
      durationSec: 0,
      masterBytes: 0,
      audioMime: parsed.data.audioMime,
      progress: null,
      error: null,
      pendingChunks: 0,
    };
    await writeLecture(lecture);
    return ok(lecture);
  } catch (err) {
    return failFrom(err);
  }
}
