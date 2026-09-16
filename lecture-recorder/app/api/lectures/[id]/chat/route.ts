import { z } from "zod";
import { fail, failFrom, ok } from "@/lib/server/http";
import { answerQuestion } from "@/lib/server/pipeline";
import { appendChat, readChat } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Ctx = { params: Promise<{ id: string }> };

const AskSchema = z.object({ question: z.string().min(1, "質問を入力してください") });

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    return ok(await readChat(id));
  } catch (err) {
    return failFrom(err);
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const parsed = AskSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "入力が正しくありません");
    const question = parsed.data.question.trim();

    const history = await readChat(id);
    await appendChat(id, { role: "user", content: question, at: Date.now() });
    const answer = await answerQuestion(id, question, history);
    const turn = {
      role: "assistant" as const,
      content: answer.grounded
        ? answer.answer
        : `${answer.answer}\n\n（この内容は講義の書き起こしからは確認できませんでした。）`,
      citations: answer.citations,
      at: Date.now(),
    };
    await appendChat(id, turn);
    return ok({ turn, grounded: answer.grounded });
  } catch (err) {
    return failFrom(err);
  }
}
