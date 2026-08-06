/**
 * Site-wide assistant endpoint.
 *
 * Routes a question to one of three grounded corpora and returns a composed,
 * cited answer. The grounding rule is the same one the scholarship endpoint
 * enforces: the response body is built from corpus records and server-owned
 * chrome, never from model prose.
 *
 * Two of the three branches never call a model at all. The scholarship branch
 * calls one, and even there the model returns claim ids — the wording is
 * composed server-side and re-derived by `isComposedFromCorpus` before it can
 * be sent. A question that matches no corpus is refused without a model call.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { scholarshipChatResultSchema } from '@/lib/ai/provider';
import { getProvider } from '@/lib/ai/select';
import { safeRateLimit } from '@/lib/storage/kv';
import { clientIp } from '@/lib/net/ip';
import {
  buildScholarshipContext,
  resolveScholarshipAnswer,
} from '@/lib/ai/scholarship-chat';
import {
  composeAboutAnswer,
  composeNavigationAnswer,
  composeRefusal,
  composeUniversityAnswer,
  detectIntent,
  fromScholarshipAnswer,
  type AssistantAnswer,
} from '@/lib/ai/assistant-router';
import { SITE_DISCLAIMER } from '@/lib/ai/site-facts';

export const runtime = 'nodejs';

const requestSchema = z.object({
  message: z.string().min(1).max(1000),
  locale: z.enum(['en', 'ja']),
  conversation: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(4000) }))
    .max(10)
    .optional(),
});

interface AssistantResponse extends AssistantAnswer {
  disclaimer: string;
  provider: string;
  verifiedAt?: string | null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = clientIp(request);
  const rl = await safeRateLimit('site-assistant', ip, 30, 300);
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

  const intent = detectIntent(message);
  const send = (answer: AssistantAnswer, extra: Partial<AssistantResponse> = {}) =>
    NextResponse.json<AssistantResponse>({
      ...answer,
      disclaimer: SITE_DISCLAIMER[locale],
      provider: 'none',
      ...extra,
    });

  // Deterministic branches. No model is involved, so there is nothing to
  // validate afterwards — the text is a pure function of the corpora.
  if (intent === 'university') return send(composeUniversityAnswer(message, locale));
  if (intent === 'navigation') return send(composeNavigationAnswer(message, locale));
  if (intent === 'about') return send(composeAboutAnswer(locale));
  if (intent === 'none') return send(composeRefusal(locale));

  // Scholarship branch — delegates wholesale to the audited pipeline.
  const context = buildScholarshipContext(message);
  if (context.empty) {
    console.info('[site-assistant] intent=scholarship refused=no-relevant-claims');
    return send(
      {
        intent: 'scholarship',
        sections: [],
        refused: true,
        refusalReason: 'no-relevant-claims',
        suggestions: composeRefusal(locale).suggestions,
      },
      { verifiedAt: context.verifiedAt },
    );
  }

  const { provider, live } = await getProvider();

  try {
    const result = await provider.run({
      task: 'scholarship-chat',
      locale,
      message,
      conversation,
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
    const resolved = resolveScholarshipAnswer(
      context,
      {
        sections: modelAnswer.sections.map((s) => ({
          programme: s.programme,
          claimIds: s.claimIds,
          unpublishedIds: s.unpublishedIds,
          lead: s.lead,
        })),
        refused: modelAnswer.refused,
      },
      locale,
    );

    console.info(
      `[site-assistant] intent=scholarship provider=${result.provider} live=${live} ` +
        `sections=${resolved.sections.length} dropped=${resolved.droppedClaimIds.length} ` +
        `refused=${resolved.refused} latencyMs=${result.latencyMs}`,
    );

    return send(fromScholarshipAnswer(resolved, locale), {
      provider: result.provider,
      verifiedAt: resolved.verifiedAt,
    });
  } catch (err) {
    console.warn(
      `[site-assistant] scholarship failed live=${live} err=${err instanceof Error ? err.message : 'unknown'}`,
    );
    // A failed or invalid model reply must not become an uncited answer.
    return send(
      {
        intent: 'scholarship',
        sections: [],
        refused: true,
        refusalReason: 'no-supported-sections',
        suggestions: composeRefusal(locale).suggestions,
      },
      { verifiedAt: context.verifiedAt },
    );
  }
}
