import { z } from "zod";
import { fail, failFrom, ok } from "@/lib/server/http";
import { isFinalizing } from "@/lib/server/pipeline";
import {
  deleteLecture,
  patchLecture,
  readLecture,
  readHighlights,
  readMaterials,
  readNotes,
  readTranscript,
} from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const PatchSchema = z.object({
  title: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const lecture = await readLecture(id);
    if (!lecture) return fail("講義が見つかりません", 404);
    const [transcript, notes, materials, highlights] = await Promise.all([
      readTranscript(id),
      readNotes(id),
      readMaterials(id),
      readHighlights(id),
    ]);
    return ok({
      lecture: { ...lecture, finalizing: isFinalizing(id) },
      transcript,
      notes,
      highlights,
      materials: materials.files,
    });
  } catch (err) {
    return failFrom(err);
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const parsed = PatchSchema.safeParse(await req.json());
    if (!parsed.success) return fail("入力が正しくありません");
    return ok(await patchLecture(id, parsed.data));
  } catch (err) {
    return failFrom(err);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    await deleteLecture(id);
    return ok({ deleted: true });
  } catch (err) {
    return failFrom(err);
  }
}
