import { describe, expect, it } from 'vitest';
import { buildScholarshipContext, resolveScholarshipAnswer } from './scholarship-chat';
import { scholarshipChatResultSchema } from './provider';

/**
 * The adversarial probe that failed against commit 28c4c35.
 *
 * The claim under test was "a wrong answer is unrepresentable rather than
 * unlikely". It held for ids, URLs, programme ownership and publication status,
 * but NOT for prose: the model could attach a real, valid claim id from the
 * correct programme to a fabricated sentence, and the resolver passed the
 * sentence through verbatim. The genuine citation then sat directly beneath the
 * lie, lending it credibility.
 *
 * Against the current design the same attack has nowhere to land: the reply
 * schema has no text field, so the fabricated sentence is stripped before the
 * resolver runs, and the displayed text is composed from the corpus instead.
 */
describe('PROBE: unsupported prose carrying a valid citation', () => {
  const fabricated =
    'The JASSO Honors Scholarship pays ¥250,000 per month and the deadline is 1 April 2027.';

  it('strips model-authored prose at the schema boundary', () => {
    // Exactly what a provider would return if it tried the attack.
    const parsed = scholarshipChatResultSchema.parse({
      refused: false,
      sections: [{ programme: 'jasso', answer: fabricated, claimIds: ['J-10'] }],
    });

    expect(parsed.sections[0]).not.toHaveProperty('answer');
    expect(JSON.stringify(parsed)).not.toContain('250,000');
  });

  it('shows corpus text, not the fabrication, even when the id is real and correct', () => {
    const ctx = buildScholarshipContext('JASSO monthly amount');
    const jasso = ctx.programmes.find((p) => p.key === 'jasso')!;
    // J-10 is the genuine amount claim: ¥48,000 / ¥30,000.
    const realId = jasso.confirmed.find((c) => c.id === 'J-10')?.id ?? jasso.confirmed[0]!.id;

    const out = resolveScholarshipAnswer(
      ctx,
      // The prose is gone by construction; this is what survives the boundary.
      { sections: [{ programme: 'jasso', claimIds: [realId] }] },
      'en',
    );

    const shown = JSON.stringify(out);
    expect(shown).not.toContain('250,000');
    expect(shown).not.toContain('1 April 2027');

    // And what IS shown is the audited statement, verbatim.
    const facts = out.sections[0]!.blocks.filter((b) => b.kind === 'fact');
    expect(facts).toHaveLength(1);
    expect(facts[0]!.text).toBe(
      jasso.confirmed.find((c) => c.id === realId)!.statement,
    );
  });

  it('leaves no path by which a section body can differ from the corpus', () => {
    const ctx = buildScholarshipContext('JASSO monthly amount');
    const ids = ctx.programmes[0]!.confirmed.map((c) => c.id);
    const out = resolveScholarshipAnswer(
      ctx,
      { sections: [{ programme: ctx.programmes[0]!.key, claimIds: ids }] },
      'en',
    );

    // Every factual line equals a cited claim's statement, and every cited
    // claim produced exactly one line. No paraphrase, no extra assertion.
    const section = out.sections[0]!;
    const factTexts = section.blocks.filter((b) => b.kind === 'fact').map((b) => b.text);
    expect(factTexts).toEqual(section.citations.map((c) => c.statement));
  });
});
