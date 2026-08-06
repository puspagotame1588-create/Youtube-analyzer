/**
 * Kyoritsu's recruitment cycle: closed round, next round's terms unpublished.
 *
 * The corpus already separates these correctly — K-03/K-04/K-06 name the 2026
 * round in their own text, K-07 carries only the 2027 *schedule*, and K-14
 * records that the 2027 amount, headcount, eligibility and route are not
 * published. What these tests pin down is that a rendered answer cannot lose
 * that separation: the cycle warning is present, the unpublished row is present
 * whether or not the model asked for it, and no 2027 figure is ever asserted.
 */

import { describe, expect, it } from 'vitest';
import {
  buildScholarshipContext,
  detectProgrammes,
  resolveScholarshipAnswer,
} from './scholarship-chat';
import { CYCLE_NOTICE_TEXT, type AnswerBlock } from './scholarship-answer';
import { getScholarshipClaim, programCycle } from '@/lib/data/scholarships';

const KYORITSU_EN = 'How much is the Kyoritsu scholarship and when is the deadline?';
const KYORITSU_JA = '共立国際交流奨学財団の金額と締切は？';

const kindsOf = (blocks: AnswerBlock[]): string[] => blocks.map((b) => b.kind);
const textOf = (blocks: AnswerBlock[]): string => blocks.map((b) => b.text).join('\n');

/** Resolves a full answer for Kyoritsu, citing everything retrieval offered. */
function answerFor(message: string, locale: 'en' | 'ja') {
  const ctx = buildScholarshipContext(message);
  const p = ctx.programmes.find((x) => x.key === 'kyoritsu');
  expect(p, 'retrieval returned no kyoritsu context').toBeDefined();
  return {
    ctx,
    programme: p!,
    resolved: resolveScholarshipAnswer(
      ctx,
      {
        sections: [
          {
            programme: 'kyoritsu',
            claimIds: p!.confirmed.map((c) => c.id),
            unpublishedIds: p!.unpublished.map((c) => c.id),
            lead: 'direct',
          },
        ],
      },
      locale,
    ),
  };
}

describe('cycle metadata', () => {
  it('marks kyoritsu as a closed round awaiting the next one', () => {
    const cycle = programCycle('kyoritsu');
    expect(cycle.status).toBe('closed-awaiting-next');
    expect(cycle.nextCycleUnconfirmedClaimId).toBe('K-14');
  });

  it('leaves the other four programmes open', () => {
    for (const key of ['jasso', 'mext', 'yoneyama', 'satoyo']) {
      expect(programCycle(key).status, key).toBe('open');
    }
  });

  it('points at a claim the corpus actually records as unconfirmed', () => {
    const claim = getScholarshipClaim('K-14');
    expect(claim).toBeDefined();
    expect(claim!.verdict).toBe('UNCONFIRMED');
    expect(claim!.program).toBe('kyoritsu');
  });
});

describe('English Kyoritsu answer', () => {
  it('is still answered — the programme is not dropped', () => {
    expect(detectProgrammes(KYORITSU_EN)).toContain('kyoritsu');
    const { resolved } = answerFor(KYORITSU_EN, 'en');
    expect(resolved.refused).toBe(false);
    expect(resolved.sections).toHaveLength(1);
  });

  it('carries the cycle warning before any fact', () => {
    const { resolved } = answerFor(KYORITSU_EN, 'en');
    const kinds = kindsOf(resolved.sections[0]!.blocks);
    expect(kinds).toContain('cycle');
    expect(kinds.indexOf('cycle')).toBeLessThan(kinds.indexOf('fact'));
    expect(textOf(resolved.sections[0]!.blocks)).toContain(CYCLE_NOTICE_TEXT.en);
  });

  it('still presents the confirmed 2026 figures, with their citations intact', () => {
    const { resolved } = answerFor(KYORITSU_EN, 'en');
    const section = resolved.sections[0]!;
    const body = textOf(section.blocks);
    // K-03 is the audited amount. It names its own cycle.
    expect(body).toContain(getScholarshipClaim('K-03')!.statement);
    expect(body).toContain('110,000');
    const cited = section.citations.map((c) => c.claimId);
    expect(cited).toContain('K-03');
    for (const c of section.citations) expect(c.sourceUrls.length).toBeGreaterThan(0);
  });

  it('reports the 2026 deadline as past, not as an upcoming one', () => {
    const { resolved } = answerFor(KYORITSU_EN, 'en');
    const body = textOf(resolved.sections[0]!.blocks);
    expect(body).toContain(getScholarshipClaim('K-06')!.statement);
    expect(getScholarshipClaim('K-06')!.statement).toMatch(/2026 deadline was/);
  });
});

describe('Japanese Kyoritsu answer', () => {
  it('is answered and carries the Japanese cycle warning', () => {
    expect(detectProgrammes(KYORITSU_JA)).toContain('kyoritsu');
    const { resolved } = answerFor(KYORITSU_JA, 'ja');
    expect(resolved.refused).toBe(false);
    const blocks = resolved.sections[0]!.blocks;
    expect(kindsOf(blocks)).toContain('cycle');
    expect(textOf(blocks)).toContain(CYCLE_NOTICE_TEXT.ja);
  });

  it('does not leak the English cycle warning into the Japanese answer', () => {
    const { resolved } = answerFor(KYORITSU_JA, 'ja');
    expect(textOf(resolved.sections[0]!.blocks)).not.toContain(CYCLE_NOTICE_TEXT.en);
  });
});

describe('unavailable 2027 details are refused, not confirmed', () => {
  it('forces the "2027 not published" row in even when the model omits it', () => {
    const ctx = buildScholarshipContext(KYORITSU_EN);
    // The model cites only confirmed claims and asks for NO unpublished rows.
    const resolved = resolveScholarshipAnswer(
      ctx,
      {
        sections: [{ programme: 'kyoritsu', claimIds: ['K-03'], unpublishedIds: [], lead: 'direct' }],
      },
      'en',
    );
    const section = resolved.sections[0]!;
    expect(section.unpublished.map((c) => c.claimId)).toContain('K-14');
    expect(kindsOf(section.blocks)).toContain('unpublished');
  });

  it('renders the 2027 gap as unpublished, never as a fact', () => {
    const { resolved } = answerFor(KYORITSU_EN, 'en');
    const section = resolved.sections[0]!;
    const k14 = section.blocks.find((b) => 'claimId' in b && b.claimId === 'K-14');
    expect(k14).toBeDefined();
    expect(k14!.kind).toBe('unpublished');
    // and never as a confirmed one
    expect(section.citations.map((c) => c.claimId)).not.toContain('K-14');
  });

  it('asserts no 2027 amount, headcount or deadline anywhere in the answer', () => {
    /**
     * Only two audited claims may legitimately mention 2027:
     *   K-04 — the 2026 award's payment window, which runs 2026-04 to 2027-03
     *   K-07 — the 2027 recruitment *schedule*, the one 2027 fact that is public
     * Any other 2027-bearing fact block would be an assertion the corpus does
     * not support, which is exactly what K-14 says is unpublished.
     */
    const MAY_MENTION_2027 = new Set(['K-04', 'K-07']);
    for (const locale of ['en', 'ja'] as const) {
      const { resolved } = answerFor(locale === 'en' ? KYORITSU_EN : KYORITSU_JA, locale);
      const facts = resolved.sections[0]!.blocks.filter(
        (b): b is Extract<AnswerBlock, { kind: 'fact' }> => b.kind === 'fact',
      );
      const offenders = facts.filter(
        (f) => f.text.includes('2027') && !MAY_MENTION_2027.has(f.claimId),
      );
      expect(offenders.map((f) => `${f.claimId}: ${f.text}`)).toEqual([]);
    }
  });

  it('confirms no 2027 monetary figure is asserted as fact', () => {
    const { resolved } = answerFor(KYORITSU_EN, 'en');
    const facts = resolved.sections[0]!.blocks.filter((b) => b.kind === 'fact');
    // The only amount in the corpus is the 2026 one, and its statement says so.
    for (const f of facts) {
      if (/110,000|70,000/.test(f.text)) expect(f.text).toContain('2026');
    }
  });

  it('keeps the confirmed 2027 schedule separate from unconfirmed 2027 terms', () => {
    const schedule = getScholarshipClaim('K-07')!;
    const gap = getScholarshipClaim('K-14')!;
    expect(schedule.verdict).toBe('PASS');
    expect(gap.verdict).toBe('UNCONFIRMED');
    // The gap row is explicit that amount/headcount/eligibility/route are open.
    expect(gap.statement).toMatch(/2027 amount, headcount/);
  });
});

describe('the cycle warning is server-owned chrome', () => {
  it('states no year, amount, deadline or rule of its own', () => {
    for (const locale of ['en', 'ja'] as const) {
      expect(CYCLE_NOTICE_TEXT[locale]).not.toMatch(/\d/);
    }
  });

  it('is absent for a programme whose cycle is open', () => {
    const ctx = buildScholarshipContext('How much is the JASSO Honors Scholarship?');
    const p = ctx.programmes.find((x) => x.key === 'jasso')!;
    const resolved = resolveScholarshipAnswer(
      ctx,
      {
        sections: [
          { programme: 'jasso', claimIds: p.confirmed.map((c) => c.id), lead: 'direct' },
        ],
      },
      'en',
    );
    expect(kindsOf(resolved.sections[0]!.blocks)).not.toContain('cycle');
  });
});
