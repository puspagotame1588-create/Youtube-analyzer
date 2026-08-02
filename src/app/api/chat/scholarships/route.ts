/**
 * Scholarship chatbot endpoint.
 *
 * Grounding happens HERE, not in the browser. The client sends only a question;
 * this route retrieves the claims, hands the model nothing but those claims,
 * and then resolves the model's cited ids back against the same set. A client
 * cannot supply its own "context", and the model cannot emit a URL — so neither
 * can introduce a fact the audit did not confirm.
 *
 * Refusal is the default: if retrieval finds nothing relevant the model is
 * never called at all.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import type { AIProvider } from '@/lib/ai/provider';
import { scholarshipChatResultSchema } from '@/lib/ai/provider';
import { MockAIProvider } from '@/lib/ai/mock';
import { safeRateLimit } from '@/lib/storage/kv';
import { clientIp } from '@/lib/net/ip';
import {
  buildScholarshipContext,
  resolveScholarshipAnswer,
  type ResolvedAnswer,
} from '@/lib/ai/scholarship-chat';

export const runtime = 'nodejs';

const requestSchema = z.object({
  message: z.string().min(1).max(1000),
  locale: z.enum(['en', 'ja']),
  conversation: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(4000) }))
    .max(10)
    .optional(),
});

async function getProvider(): Promise<{ provider: AIProvider; live: boolean }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (key) {
    const { AnthropicProvider } = await import('@/lib/ai/anthropic');
    return { provider: new AnthropicProvider(key), live: true };
  }
  return { provider: new MockAIProvider(), live: false };
}

const refusal = (
  reason: ResolvedAnswer['refusalReason'],
  ctx: { verifiedAt: string | null; productionStatus: string | null },
): ResolvedAnswer => ({
  sections: [],
  refused: true,
  refusalReason: reason,
  droppedClaimIds: [],
  verifiedAt: ctx.verifiedAt,
  productionStatus: ctx.productionStatus,
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = clientIp(request);
  const rl = await safeRateLimit('scholarship-chat', ip, 20, 300);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'rate-limited' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid-request' }, { status: 400 });
  }
  const { message, locale, conversation } = parsed.data;

  // 1. Retrieve. This is the model's entire factual world.
  const context = buildScholarshipContext(message);

  // 2. Nothing relevant: refuse without spending a model call.
  if (context.empty) {
    console.info('[scholarship-chat] refused=no-relevant-claims');
    return NextResponse.json({
      ...refusal('no-relevant-claims', context),
      provider: 'none',
      programmesConsidered: [],
    });
  }

  const { provider, live } = await getProvider();

  try {
    const result = await provider.run({
      task: 'scholarship-chat',
      locale,
      message,
      conversation,
      // Only ids, statements and excerpts — no URLs reach the model.
      context: {
        programmes: context.programmes.map((p) => ({
          key: p.key,
          labelEn: p.labelEn,
          labelJa: p.labelJa,
          confirmed: p.confirmed,
          unpublished: p.unpublished,
        })),
      },
    });

    const modelAnswer = scholarshipChatResultSchema.parse(result.data);

    // 3. Resolve ids against the context we actually supplied. Invented or
    //    cross-programme ids are dropped here.
    const resolved = resolveScholarshipAnswer(context, {
      sections: modelAnswer.sections.map((s) => ({
        programme: s.programme,
        answer: s.answer,
        claimIds: s.claimIds,
        unpublishedIds: s.unpublishedIds,
      })),
      refused: modelAnswer.refused,
    });

    console.info(
      `[scholarship-chat] provider=${result.provider} model=${result.model} live=${live} ` +
        `programmes=${context.programmes.map((p) => p.key).join('|')} ` +
        `sections=${resolved.sections.length} dropped=${resolved.droppedClaimIds.length} ` +
        `refused=${resolved.refused} latencyMs=${result.latencyMs}`,
    );

    return NextResponse.json({
      ...resolved,
      provider: result.provider,
      model: result.model,
      programmesConsidered: context.programmes.map((p) => p.key),
    });
  } catch (err) {
    console.warn(
      `[scholarship-chat] failed live=${live} err=${err instanceof Error ? err.message : 'unknown'}`,
    );
    // A failed or invalid model reply must not become an uncited answer.
    return NextResponse.json({
      ...refusal('no-supported-sections', context),
      provider: 'none',
      programmesConsidered: context.programmes.map((p) => p.key),
    });
  }
}
