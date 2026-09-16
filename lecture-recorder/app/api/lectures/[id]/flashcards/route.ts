import { failFrom, ok } from "@/lib/server/http";
import { generateFlashcards } from "@/lib/server/pipeline";
import { readFlashcards } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    return ok(await readFlashcards(id));
  } catch (err) {
    return failFrom(err);
  }
}

/** Flashcards are only generated when the student asks for them. */
export async function POST(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    return ok(await generateFlashcards(id));
  } catch (err) {
    return failFrom(err);
  }
}
