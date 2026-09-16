import { z } from "zod";
import { fail, failFrom, ok } from "@/lib/server/http";
import { deleteLecture, listLectures, readCourses, writeCourses } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  name: z.string().min(1).optional(),
  teacher: z.string().optional(),
  language: z.enum(["ja", "en"]).optional(),
  keywords: z.array(z.string()).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const parsed = PatchSchema.safeParse(await req.json());
    if (!parsed.success) return fail("入力が正しくありません");
    const courses = await readCourses();
    const index = courses.findIndex((c) => c.id === id);
    if (index < 0) return fail("科目が見つかりません", 404);
    const patch = parsed.data;
    courses[index] = {
      ...courses[index],
      ...patch,
      keywords: (patch.keywords ?? courses[index].keywords).map((k) => k.trim()).filter(Boolean),
    };
    await writeCourses(courses);
    return ok(courses[index]);
  } catch (err) {
    return failFrom(err);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const courses = await readCourses();
    await writeCourses(courses.filter((c) => c.id !== id));
    // Recordings belonging to the course go with it, audio included.
    const lectures = await listLectures();
    await Promise.all(
      lectures.filter((l) => l.courseId === id).map((l) => deleteLecture(l.id)),
    );
    return ok({ deleted: true });
  } catch (err) {
    return failFrom(err);
  }
}
