/**
 * GATED live-provider integration test — real network, real model, real money.
 *
 * Excluded from `npm test`. Run it deliberately:
 *
 *     npm run test:live
 *
 * It requires BOTH an opt-in flag and a key, so it can never fire by accident
 * in CI or in a normal test run:
 *
 *     AI_LIVE_TEST=1 OPENAI_API_KEY=... npm run test:live
 *     AI_LIVE_TEST=1 ANTHROPIC_API_KEY=... npm run test:live
 *
 * If the flag or the key is missing every case is SKIPPED, and a skipped run
 * proves nothing — it must never be reported as having verified the live path.
 *
 * The key is read only to decide whether to run and to construct the client.
 * It is never printed, asserted on, or written to a snapshot.
 */

import { describe, expect, it } from 'vitest';
import { chooseProvider, getProvider } from './select';
import { scholarshipChatResultSchema } from './provider';
import { buildScholarshipContext, resolveScholarshipAnswer } from './scholarship-chat';
import { getScholarshipClaim } from '@/lib/data/scholarships';

const optedIn = process.env.AI_LIVE_TEST === '1';
const hasKey = Boolean(process.env.OPENAI_API_KEY?.trim() || process.env.ANTHROPIC_API_KEY?.trim());
const live = optedIn && hasKey;

describe.skipIf(!live)('live provider — end to end', () => {
  it('reports which provider is configured (never the key)', () => {
    const name = chooseProvider();
    // eslint-disable-next-line no-console
    console.info(`[live-test] provider=${name}`);
    expect(['openai', 'anthropic']).toContain(name);
  });

  for (const [locale, question] of [
    ['en', 'How much is the JASSO Honors Scholarship?'],
    ['ja', 'JASSO学習奨励費の金額は？'],
  ] as const) {
    it(`answers a ${locale} question with corpus-derived text only`, async () => {
      const ctx = buildScholarshipContext(question);
      expect(ctx.empty).toBe(false);

      const { provider, name } = await getProvider();
      const res = await provider.run({
        task: 'scholarship-chat',
        locale,
        message: question,
        context: {
          programmes: ctx.programmes.map((p) => ({
            key: p.key,
            labelEn: p.labelEn,
            labelJa: p.labelJa,
            confirmed: p.confirmed,
            unpublished: p.unpublished,
          })),
        },
      });

      expect(res.provider).toBe(name);
      const parsed = scholarshipChatResultSchema.parse(res.data);
      const resolved = resolveScholarshipAnswer(ctx, parsed, locale);

      // eslint-disable-next-line no-console
      console.info(
        `[live-test] locale=${locale} provider=${res.provider} model=${res.model} ` +
          `sections=${resolved.sections.length} dropped=${resolved.droppedClaimIds.length} ` +
          `refused=${resolved.refused} latencyMs=${res.latencyMs}`,
      );

      // The guarantee under test: whatever the live model said, every factual
      // line is a corpus statement and every id resolves.
      for (const s of resolved.sections) {
        for (const b of s.blocks) {
          if (b.kind === 'fact' || b.kind === 'unpublished') {
            expect(b.text).toBe(getScholarshipClaim(b.claimId)!.statement);
          }
        }
        for (const c of s.citations) {
          expect(getScholarshipClaim(c.claimId)!.program).toBe(s.programme);
        }
      }
    }, 60_000);
  }

  it('refuses an off-corpus question before reaching the model', () => {
    expect(buildScholarshipContext('how do I rent an apartment in Osaka').empty).toBe(true);
  });
});

describe.skipIf(live)('live provider — not exercised', () => {
  it('is skipped, and a skipped run verifies nothing', () => {
    // eslint-disable-next-line no-console
    console.info(
      `[live-test] SKIPPED — optedIn=${optedIn} keyPresent=${hasKey}. ` +
        'The live provider path was NOT verified by this run.',
    );
    expect(live).toBe(false);
  });
});
