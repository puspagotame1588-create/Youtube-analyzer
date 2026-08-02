/**
 * Server-owned composition of the scholarship answer text.
 *
 * This module exists because "the model cited a real claim id" is a weaker
 * guarantee than it looks. A model can attach a valid id from the correct
 * programme to a sentence that contradicts it — the citation then lends the
 * false sentence credibility. The fix is not a better prompt: it is to stop
 * asking the model for sentences.
 *
 * Every factual character the user sees is produced here, from two sources
 * only:
 *
 *   1. `LEADS` / `CHROME` — fixed, locale-specific connective text owned by
 *      this file. The model may pick a key from a closed enum; it can never
 *      supply the sentence, so it cannot smuggle an amount, date, deadline,
 *      eligibility rule, status or programme name into it.
 *   2. `getScholarshipClaim(id).statement` — the audited corpus, looked up
 *      fresh by id at composition time.
 *
 * `isComposedFromCorpus()` re-derives the whole block list from those two
 * sources and requires an exact match. It is a deterministic tripwire, not a
 * probabilistic judgement: no second model call and no entailment scoring is
 * involved anywhere in this guarantee.
 */

import { getScholarshipClaim } from '@/lib/data/scholarships';
import type { ScholarshipLead } from './provider';

export type AnswerLocale = 'en' | 'ja';

/**
 * One displayable unit. `fact` and `unpublished` carry corpus text verbatim;
 * every other kind carries server chrome. Nothing else can exist.
 */
export type AnswerBlock =
  | { kind: 'lead'; text: string }
  | { kind: 'fact'; claimId: string; text: string }
  | { kind: 'unpublished-heading'; text: string }
  | { kind: 'unpublished'; claimId: string; text: string }
  | { kind: 'note'; text: string }
  | { kind: 'closing'; text: string };

/** The four connectives, resolved. Purely relational — no factual content. */
const LEADS: Record<ScholarshipLead, Record<AnswerLocale, string>> = {
  direct: {
    en: 'The audited official sources confirm the following:',
    ja: '監査済みの公式ソースで確認できた記載は次のとおりです：',
  },
  partial: {
    en: 'The audited official sources confirm only part of this question:',
    ja: 'ご質問のうち、監査済みの公式ソースで確認できたのは一部のみです：',
  },
  'related-only': {
    en: 'The audited official sources do not address that question directly. The closest confirmed statements are:',
    ja: 'ご質問に直接お答えする記載は監査済みの公式ソースにありません。最も近い確認済みの記載は次のとおりです：',
  },
  conflict: {
    en: 'The audited official sources are not consistent on this point. Every confirmed statement is shown, and none is chosen for you:',
    ja: 'この点について公式ソースの記載は一致していません。確認済みの記載をすべて示し、どれかを選ぶことはしません：',
  },
};

const CHROME: Record<AnswerLocale, { unpublished: string; note: string; closing: string }> = {
  en: {
    unpublished: 'Not published by any official source — cannot be treated as fact:',
    note: 'Statements are shown exactly as the audit recorded them from the official source.',
    closing: 'Always confirm the latest details on the official page before applying.',
  },
  ja: {
    unpublished: 'いずれの公式ソースにも記載がない項目（事実として扱えません）：',
    note: '引用文は監査時に公式ソースから記録した原文（英語）のまま表示しています。翻訳は行いません。',
    closing: '出願前に必ず公式ページで最新情報をご確認ください。',
  },
};

export interface ComposeInput {
  locale: AnswerLocale;
  /** Model-selected connective key. Defaults to the neutral 'direct'. */
  lead: ScholarshipLead;
  /** Confirmed claim ids, already resolved and programme-checked, in order. */
  claimIds: string[];
  /** Unpublished-field claim ids, already resolved and programme-checked. */
  unpublishedIds: string[];
}

/**
 * Builds the answer for one programme section. The only inputs that reach the
 * output are a locale, an enum key, and claim ids — so the output is a pure
 * function of the corpus and this file's own constants.
 */
export function composeAnswer(input: ComposeInput): AnswerBlock[] {
  const { locale } = input;
  const blocks: AnswerBlock[] = [{ kind: 'lead', text: LEADS[input.lead][locale] }];

  for (const id of input.claimIds) {
    const claim = getScholarshipClaim(id);
    // An id with no corpus entry contributes no text. It cannot reach here via
    // the resolver, but composition must never invent a fallback sentence.
    if (!claim) continue;
    blocks.push({ kind: 'fact', claimId: claim.id, text: claim.statement });
  }

  const unpublished = input.unpublishedIds
    .map((id) => getScholarshipClaim(id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  if (unpublished.length > 0) {
    blocks.push({ kind: 'unpublished-heading', text: CHROME[locale].unpublished });
    for (const claim of unpublished) {
      blocks.push({ kind: 'unpublished', claimId: claim.id, text: claim.statement });
    }
  }

  // Japanese readers get Japanese chrome, but the audited excerpts stay in the
  // language the official source published them in. Translating them here
  // would mean generating factual text, which is precisely what this module
  // exists to prevent.
  if (locale === 'ja' && blocks.some((b) => b.kind === 'fact' || b.kind === 'unpublished')) {
    blocks.push({ kind: 'note', text: CHROME.ja.note });
  }

  blocks.push({ kind: 'closing', text: CHROME[locale].closing });
  return blocks;
}

/** Flattens blocks to plain text. Bullets and id tags are added here, not by a model. */
export function renderAnswerText(blocks: AnswerBlock[]): string {
  return blocks
    .map((b) =>
      b.kind === 'fact' || b.kind === 'unpublished' ? `• ${b.text} [${b.claimId}]` : b.text,
    )
    .join('\n');
}

/**
 * Deterministic tripwire. Re-derives the expected blocks from the corpus and
 * this file's constants and requires exact equality, so a block list that was
 * altered anywhere between composition and presentation fails closed.
 */
export function isComposedFromCorpus(blocks: AnswerBlock[], input: ComposeInput): boolean {
  const expected = composeAnswer(input);
  if (expected.length !== blocks.length) return false;
  return expected.every((e, i) => {
    const got = blocks[i];
    if (!got || got.kind !== e.kind || got.text !== e.text) return false;
    const eId = 'claimId' in e ? e.claimId : undefined;
    const gotId = 'claimId' in got ? got.claimId : undefined;
    return eId === gotId;
  });
}

/** Exposed so tests can assert the connective set carries no factual content. */
export const LEAD_TEXT = LEADS;
export const CHROME_TEXT = CHROME;
