/**
 * OpenAI provider and provider selection.
 *
 * The HTTP layer is stubbed — these tests never make a network call and never
 * need a real key — but everything above it is the production path: the real
 * prompt builder, the real JSON schema, the real zod validation and the real
 * resolver. What is being proved is that switching to OpenAI changes who
 * answers and nothing about what is allowed through.
 */

import { describe, expect, it, vi } from 'vitest';
import { OpenAIProvider, OPENAI_DEFAULT_MODEL, openAiModel } from './openai';
import { chooseProvider, getProvider, isLiveProvider } from './select';
import { scholarshipChatResultSchema } from './provider';
import { jsonSchemaFor } from './json-schema';
import { buildScholarshipContext, resolveScholarshipAnswer } from './scholarship-chat';
import { getScholarshipClaim } from '@/lib/data/scholarships';
import type { AiTask } from './provider';

const FAKE_KEY = 'sk-test-not-a-real-key';

/** Builds a provider whose transport returns exactly `outputText`. */
function providerReturning(outputText: string, capture?: { request?: unknown }): OpenAIProvider {
  const p = new OpenAIProvider(FAKE_KEY);
  const create = vi.fn(async (req: unknown) => {
    if (capture) capture.request = req;
    return { output_text: outputText };
  });
  // Replace only the transport; prompt building and validation stay real.
  (p as unknown as { client: { responses: { create: unknown } } }).client = {
    responses: { create },
  };
  return p;
}

const chatTask = (locale: 'en' | 'ja' = 'en'): AiTask => {
  const ctx = buildScholarshipContext('JASSO monthly amount');
  return {
    task: 'scholarship-chat',
    locale,
    message: 'JASSO monthly amount',
    context: {
      programmes: ctx.programmes.map((p) => ({
        key: p.key,
        labelEn: p.labelEn,
        labelJa: p.labelJa,
        confirmed: p.confirmed,
        unpublished: p.unpublished,
      })),
    },
  };
};

describe('provider selection', () => {
  it('selects OpenAI when only OPENAI_API_KEY exists', () => {
    expect(chooseProvider({ OPENAI_API_KEY: FAKE_KEY })).toBe('openai');
  });

  it('does NOT select the mock when OPENAI_API_KEY exists', () => {
    expect(chooseProvider({ OPENAI_API_KEY: FAKE_KEY })).not.toBe('mock');
    expect(isLiveProvider(chooseProvider({ OPENAI_API_KEY: FAKE_KEY }))).toBe(true);
  });

  it('prefers OpenAI when both keys exist', () => {
    expect(chooseProvider({ OPENAI_API_KEY: FAKE_KEY, ANTHROPIC_API_KEY: FAKE_KEY })).toBe('openai');
  });

  it('falls back to Anthropic when only ANTHROPIC_API_KEY exists', () => {
    expect(chooseProvider({ ANTHROPIC_API_KEY: FAKE_KEY })).toBe('anthropic');
  });

  it('uses the mock only with no key, or when explicitly selected', () => {
    expect(chooseProvider({})).toBe('mock');
    expect(chooseProvider({ OPENAI_API_KEY: FAKE_KEY, AI_PROVIDER: 'mock' })).toBe('mock');
    // A blank or whitespace value is not a key.
    expect(chooseProvider({ OPENAI_API_KEY: '   ' })).toBe('mock');
  });

  it('instantiates the OpenAI provider, reporting provider=openai', async () => {
    const { name, live, provider } = await getProvider({ OPENAI_API_KEY: FAKE_KEY });
    expect(name).toBe('openai');
    expect(live).toBe(true);
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it('uses the configured model, defaulting when OPENAI_MODEL is unset', () => {
    const previous = process.env.OPENAI_MODEL;
    delete process.env.OPENAI_MODEL;
    expect(openAiModel()).toBe(OPENAI_DEFAULT_MODEL);
    process.env.OPENAI_MODEL = 'gpt-4.1';
    expect(openAiModel()).toBe('gpt-4.1');
    if (previous === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = previous;
  });
});

describe('OpenAI request shape', () => {
  it('constrains generation with the strict id-only JSON schema', async () => {
    const capture: { request?: unknown } = {};
    const p = providerReturning(
      JSON.stringify({ refused: false, sections: [{ programme: 'jasso', lead: 'direct', claimIds: ['J-10'], unpublishedIds: [] }] }),
      capture,
    );
    await p.run(chatTask());

    const req = capture.request as { text: { format: { schema: Record<string, unknown> } } };
    const format = req.text.format as unknown as { strict: boolean; schema: Record<string, unknown> };
    expect(format.strict).toBe(true);

    // The schema the API enforces has no free-text field anywhere.
    const props = format.schema.properties as Record<string, { items: { properties: Record<string, unknown> } }>;
    const section = props.sections!.items.properties;
    expect(Object.keys(section).sort()).toEqual(['claimIds', 'lead', 'programme', 'unpublishedIds']);
    expect((section.lead as { enum: string[] }).enum).toContain('direct');
  });

  it('declares no answer/summary field for the scholarship task', () => {
    const schema = JSON.stringify(jsonSchemaFor(chatTask()));
    expect(schema).not.toContain('"answer"');
    expect(schema).not.toContain('"summary"');
  });
});

describe('OpenAI output handling', () => {
  it('returns the same validated schema the other providers do', async () => {
    const p = providerReturning(
      JSON.stringify({
        refused: false,
        sections: [{ programme: 'jasso', lead: 'direct', claimIds: ['J-10'], unpublishedIds: [] }],
      }),
    );
    const res = await p.run(chatTask());
    expect(res.provider).toBe('openai');
    expect(() => scholarshipChatResultSchema.parse(res.data)).not.toThrow();
  });

  it('turns malformed output into a clean failure, never an answer', async () => {
    for (const bad of ['not json at all', '{"sections":[{"programme":1}]}', '', '{}{']) {
      const p = providerReturning(bad);
      await expect(p.run(chatTask())).rejects.toThrow('AI output failed validation');
    }
  });

  it('drops a prose field the model adds despite the schema', async () => {
    const p = providerReturning(
      JSON.stringify({
        refused: false,
        sections: [
          {
            programme: 'jasso',
            lead: 'direct',
            claimIds: ['J-10'],
            unpublishedIds: [],
            answer: 'JASSO pays ¥250,000 per month.',
          },
        ],
      }),
    );
    const res = await p.run(chatTask());
    expect(JSON.stringify(res.data)).not.toContain('250,000');
  });

  it('rejects fabricated and cross-programme ids end to end', async () => {
    const ctx = buildScholarshipContext('scholarship monthly amount');
    const own = ctx.programmes[0]!;
    const other = ctx.programmes[1]!;
    const p = providerReturning(
      JSON.stringify({
        refused: false,
        sections: [
          {
            programme: own.key,
            lead: 'direct',
            claimIds: [own.confirmed[0]!.id, other.confirmed[0]!.id, 'J-999'],
            unpublishedIds: [],
          },
        ],
      }),
    );
    const res = await p.run({ ...chatTask(), message: 'scholarship monthly amount' } as AiTask);
    const resolved = resolveScholarshipAnswer(
      ctx,
      scholarshipChatResultSchema.parse(res.data),
      'en',
    );
    expect(resolved.sections[0]!.citations.map((c) => c.claimId)).toEqual([own.confirmed[0]!.id]);
    expect(resolved.droppedClaimIds).toEqual(
      expect.arrayContaining([other.confirmed[0]!.id, 'J-999']),
    );
    expect(resolved.sections[0]!.answer).not.toContain(
      getScholarshipClaim(other.confirmed[0]!.id)!.statement,
    );
  });
});

describe('secrets stay out of responses and errors', () => {
  it('never puts the key in a provider response', async () => {
    const p = providerReturning(
      JSON.stringify({ refused: false, sections: [{ programme: 'jasso', lead: 'direct', claimIds: ['J-10'], unpublishedIds: [] }] }),
    );
    const res = await p.run(chatTask());
    expect(JSON.stringify(res)).not.toContain(FAKE_KEY);
  });

  it('never puts the key in a request payload we build', async () => {
    const capture: { request?: unknown } = {};
    const p = providerReturning(
      JSON.stringify({ refused: false, sections: [{ programme: 'jasso', lead: 'direct', claimIds: ['J-10'], unpublishedIds: [] }] }),
      capture,
    );
    await p.run(chatTask());
    expect(JSON.stringify(capture.request)).not.toContain(FAKE_KEY);
  });

  it('never puts the key in an error, even when the transport throws it back', async () => {
    const p = new OpenAIProvider(FAKE_KEY);
    (p as unknown as { client: { responses: { create: unknown } } }).client = {
      responses: {
        create: vi.fn(async () => {
          throw new Error(`401 Unauthorized: Bearer ${FAKE_KEY}`);
        }),
      },
    };
    await expect(p.run(chatTask())).rejects.toThrow('AI output failed validation');
    await p.run(chatTask()).catch((e: unknown) => {
      expect(String(e)).not.toContain(FAKE_KEY);
    });
  });
});
