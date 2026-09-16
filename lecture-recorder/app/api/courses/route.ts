import { z } from "zod";
import { fail, failFrom, newId, ok } from "@/lib/server/http";
import { readCourses, writeCourses } from "@/lib/server/store";
import type { Course } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLORS = ["#4f46e5", "#0f766e", "#b45309", "#be185d", "#1d4ed8", "#15803d", "#7c3aed", "#c2410c"];

const CreateSchema = z.object({
  name: z.string().min(1, "科目名を入力してください"),
  teacher: z.string().default(""),
  language: z.enum(["ja", "en"]).default("ja"),
  keywords: z.array(z.string()).default([]),
});

export async function GET() {
  try {
    return ok(await readCourses());
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
    const course: Course = {
      id: newId(),
      name: parsed.data.name.trim(),
      teacher: parsed.data.teacher.trim(),
      language: parsed.data.language,
      keywords: parsed.data.keywords.map((k) => k.trim()).filter(Boolean),
      color: COLORS[courses.length % COLORS.length],
      createdAt: Date.now(),
    };
    await writeCourses([...courses, course]);
    return ok(course);
  } catch (err) {
    return failFrom(err);
  }
}
