/**
 * Scholarship claim retrieval (RAG source).
 *
 * Corpus: the committed 2026-08-01 verification report, compiled by
 * `scripts/build-scholarship-claims.mjs` into one entry per audited claim.
 *
 * The single invariant this module exists to enforce: a claim the audit could
 * NOT confirm is never returned in the same list as one it could. Callers get
 * `claims` (confirmed, each with its excerpt and official URL) and
 * `unverifiable` (the field is not published anywhere official) as separate
 * arrays, so "we could not verify this" cannot silently become an assertion.
 *
 * This mirrors `retrieveUniversities()`, which returns its records alongside
 * the source that backs them and the fields that remain unverified.
 */

import {
  SCHOLARSHIP_CLAIMS,
  SCHOLARSHIP_GATES,
  SCOPE_WARNINGS,
  VERIFICATION_DATE,
  PRODUCTION_STATUS,
} from './claims.generated';
import type {
  ClaimVerdict,
  ScholarshipClaim,
  ScholarshipGate,
  ScholarshipRetrieval,
} from './types';
import type { SourceRecord } from '@/lib/data/types';

export type { ScholarshipClaim, ScholarshipGate, ScholarshipRetrieval, ClaimVerdict };
export { VERIFICATION_DATE, PRODUCTION_STATUS };

/**
 * The single source backing every claim in this corpus. Individual claims each
 * carry their own controlling official URL; this record identifies the audit
 * that checked them, so a citation can name both the primary source and the
 * verification pass that confirmed it.
 */
export const SCHOLARSHIP_VERIFICATION_SOURCE: SourceRecord = {
  id: 'src-scholarship-verification-2026-08-01',
  nameEn: 'Scholarship dataset verification report (2026-08-01)',
  nameJa: '奨学金データ検証レポート（2026年8月1日）',
  url: 'internal:docs/SCHOLARSHIP_VERIFICATION_2026-08-01.md',
  type: 'manual',
  retrievedAt: VERIFICATION_DATE ?? '2026-08-01',
  reviewer: 'verification-pass',
  notes:
    'Independent recheck of five scholarship programmes against their controlling ' +
    'official pages and PDFs: 72 statements confirmed, 0 mismatches, 8 critical ' +
    'fields not published by any official source. Production gate: NOT READY FOR ' +
    'PRODUCTION. Unconfirmable fields are retrievable but are never returned as fact.',
};

/**
 * Display labels only. These are names, not audited facts — every factual
 * statement lives in a claim with its own excerpt and URL.
 */
export const PROGRAM_LABELS: Record<string, { en: string; ja: string }> = {
  jasso: {
    en: 'JASSO / MEXT Honors Scholarship for privately financed international students',
    ja: '文部科学省外国人留学生学習奨励費（JASSO）',
  },
  mext: { en: 'Japanese Government (MEXT) Scholarship', ja: '日本政府（文部科学省）奨学金' },
  yoneyama: {
    en: 'Rotary Yoneyama Memorial Foundation Scholarship',
    ja: 'ロータリー米山記念奨学会 奨学金',
  },
  satoyo: { en: 'Sato Yo International Scholarship Foundation', ja: '佐藤陽国際奨学財団' },
  kyoritsu: { en: 'Kyoritsu International Foundation Scholarship', ja: '共立国際交流奨学財団' },
};

const STOPWORDS = new Set([
  'the', 'a', 'an', 'of', 'and', 'or', 'is', 'are', 'to', 'in', 'for', 'on', 'at', 'by',
  'be', 'as', 'it', 'with', 'that', 'this', 'from', 'what', 'which', 'can', 'i', 'my',
]);

const norm = (s: string): string => s.normalize('NFKC').toLowerCase();

/**
 * Latin word tokens, plus CJK n-grams. There is no tokeniser available, so a
 * long query is broken into overlapping substrings — but only down to trigrams.
 * Bigrams are deliberately excluded: Japanese compounds share short fragments,
 * so a bigram match is close to meaningless. 在留資格 (residence status) and
 * 大学入学資格 (university-entry qualification) share 資格, and ranking on that
 * shared fragment surfaces claims about an entirely different requirement.
 *
 * Runs are cut at hiragana as well as at Latin and punctuation. Hiragana is
 * Japan's function-word script - particles, inflections, politeness - and
 * treating a whole sentence as one run makes those grammatical tails rank like
 * keywords. A question about renting an apartment in Osaka then matches a
 * scholarship claim through the polite request ending alone, which is the same
 * failure as matching the English token "rent" inside "different": grammar
 * masquerading as topic. Cutting at hiragana leaves only the content words, and
 * an apartment question correctly retrieves nothing.
 */
const MIN_CJK_GRAM = 3;
/** A single kanji matches far too much text to be evidence of topic. */
const MIN_CJK_RUN = 2;
/** Content scripts only: kanji, katakana and the iteration mark. Hiragana separates. */
const CJK_RUN = /[\u3005\u30a0-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+/g;

/**
 * Question intent → corpus vocabulary.
 *
 * The corpus was audited in English, so a Japanese question and an English
 * paraphrase both fail on pure lexical overlap: "How much is the JASSO Honors
 * Scholarship?" and 「JASSO学習奨励費の金額は？」 share no token with the claim
 * that says "Amount is JPY 48,000 monthly...", and the amount claim ranks tenth
 * — outside the eight-claim window. The user then reads eligibility criteria in
 * answer to a question about money. Every word of it is true and cited, which
 * makes it a relevance failure rather than a correctness one, but it is still
 * the wrong answer.
 *
 * Expansion only changes which audited claims are retrieved and in what order.
 * It cannot introduce a fact: the triggers are question phrasings and the
 * expansions are words that already appear in the corpus. Expanded tokens score
 * below tokens the user actually typed, so they break ties rather than
 * overriding a direct match.
 */
const INTENT_EXPANSIONS: Array<{ trigger: RegExp; tokens: string[] }> = [
  { trigger: /how much|amount|stipend|monthly|金額|いくら|月額|支給額/i, tokens: ['amount', 'jpy', 'monthly'] },
  { trigger: /deadline|due date|closing date|締切|締め切り|応募期間|申請期限/i, tokens: ['deadline', 'application', 'period'] },
  { trigger: /how long|duration|how many years|期間|年間/i, tokens: ['duration', 'months', 'year'] },
  { trigger: /eligib|qualify|who can apply|requirement|条件|要件|対象者/i, tokens: ['eligible', 'must', 'requirement'] },
  { trigger: /language|jlpt|eju|cefr|語学|日本語能力|英語力/i, tokens: ['japanese', 'jlpt', 'eju', 'cefr', 'english'] },
  { trigger: /document|paperwork|必要書類|提出書類/i, tokens: ['document', 'submit', 'form'] },
  { trigger: /how (?:do|can) i apply|application route|how to apply|申請方法|応募方法|出願方法/i, tokens: ['apply', 'application', 'institution'] },
  { trigger: /renew|extend|継続|更新/i, tokens: ['renewal', 'continue', 'extension'] },
];

/** Corpus vocabulary implied by the question's intent. Never user-supplied text. */
function expandIntent(query: string): string[] {
  const hits = INTENT_EXPANSIONS.filter((e) => e.trigger.test(query)).flatMap((e) => e.tokens);
  return [...new Set(hits)];
}

function analyse(query: string): { words: string[]; runs: string[]; grams: string[] } {
  const q = norm(query);
  const words = q
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));

  const runs: string[] = [];
  const grams: string[] = [];
  for (const run of q.match(CJK_RUN) ?? []) {
    if (run.length < MIN_CJK_RUN) continue;
    runs.push(run);
    for (let n = MIN_CJK_GRAM; n < run.length; n++) {
      for (let i = 0; i + n <= run.length; i++) grams.push(run.slice(i, i + n));
    }
  }
  return { words, runs: [...new Set(runs)], grams: [...new Set(grams)] };
}

/**
 * Word sets per claim, so a Latin token is matched on word boundaries rather
 * than as a substring. Naive substring matching silently retrieves nonsense:
 * the token "rent" from an apartment question matches inside "diffe(rent)",
 * which is enough to make an off-topic query look supported.
 */
const WORDS = new WeakMap<ScholarshipClaim, { statement: Set<string>; excerpt: Set<string> }>();

function wordsOf(claim: ScholarshipClaim): { statement: Set<string>; excerpt: Set<string> } {
  let w = WORDS.get(claim);
  if (!w) {
    const split = (t: string): Set<string> =>
      new Set(norm(t).split(/[^a-z0-9]+/).filter(Boolean));
    w = { statement: split(claim.statement), excerpt: split(claim.excerpt) };
    WORDS.set(claim, w);
  }
  return w;
}

function scoreClaim(claim: ScholarshipClaim, query: string): number {
  const q = norm(query.trim());
  if (q === '') return 1; // empty query: everything is equally eligible

  // An audit id is an exact handle — treat it as such.
  if (norm(claim.id) === q) return 1000;

  const { words, runs, grams } = analyse(query);
  const statement = norm(claim.statement);
  const excerpt = norm(claim.excerpt);
  const label = norm(
    `${claim.program} ${PROGRAM_LABELS[claim.program]?.en ?? ''} ${PROGRAM_LABELS[claim.program]?.ja ?? ''}`,
  );

  const claimWords = wordsOf(claim);
  const labelWords = new Set(label.split(/[^a-z0-9]+/).filter(Boolean));

  let score = 0;
  for (const w of words) {
    if (labelWords.has(w)) score += 5;
    if (claimWords.statement.has(w)) score += 3;
    if (claimWords.excerpt.has(w)) score += 1;
  }
  // Intent vocabulary ranks below anything the user actually typed.
  for (const w of expandIntent(query)) {
    if (words.includes(w)) continue;
    if (claimWords.statement.has(w)) score += 2;
    if (claimWords.excerpt.has(w)) score += 1;
  }
  // Whole-phrase matches dominate; trigram+ matches only refine the ranking.
  for (const r of runs) {
    if (excerpt.includes(r)) score += 8;
    if (statement.includes(r)) score += 4;
    if (label.includes(r)) score += 6;
  }
  for (const g of grams) {
    if (excerpt.includes(g)) score += 2;
    if (statement.includes(g)) score += 1;
  }
  return score;
}

export interface ScholarshipQueryOptions {
  /** Restrict to one or more programs. */
  programs?: string[];
  /** Max confirmed claims to return. Default 8. */
  limit?: number;
  /**
   * Include claims the audit could not confirm. They are always returned in the
   * separate `unverifiable` array, never in `claims`. Default true.
   */
  includeUnverifiable?: boolean;
}

const CONFIRMED: ReadonlySet<ClaimVerdict> = new Set<ClaimVerdict>(['PASS', 'MISMATCH']);

/**
 * Relevance floor. A score of 1 is exactly one weak signal: a single word that
 * appears only in a supporting excerpt, never in the statement and never in the
 * programme name — an incidental mention. "What is the best ramen in Tokyo"
 * scored 1 against a claim whose excerpt happens to name Tokyo, which was
 * enough to make an off-corpus question look supported and produce a page of
 * true but irrelevant scholarship facts. Two signals, or one strong one, is the
 * minimum for treating a question as in scope; below that, refuse.
 */
const MIN_SCORE = 2;

/**
 * Retrieval entry point. Returns confirmed claims and unconfirmable ones in
 * separate arrays, together with each program's audit gate, the verification
 * date and the audit's production decision — so a caller (or the AI explanation
 * layer) can cite a scholarship fact without ever presenting an unpublished
 * field as though it were established.
 */
export function retrieveScholarshipClaims(
  query: string,
  opts: ScholarshipQueryOptions = {},
): ScholarshipRetrieval {
  const { programs, limit = 8, includeUnverifiable = true } = opts;

  const pool = programs?.length
    ? SCHOLARSHIP_CLAIMS.filter((c) => programs.includes(c.program))
    : SCHOLARSHIP_CLAIMS;

  const ranked = pool
    .map((claim) => ({ claim, score: scoreClaim(claim, query) }))
    .filter((r) => r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score || a.claim.id.localeCompare(b.claim.id));

  const claims = ranked
    .filter((r) => CONFIRMED.has(r.claim.verdict))
    .slice(0, limit)
    .map((r) => r.claim);

  const unverifiable = includeUnverifiable
    ? ranked.filter((r) => r.claim.verdict === 'UNCONFIRMED').map((r) => r.claim)
    : [];

  const present = [...new Set([...claims, ...unverifiable].map((c) => c.program))];

  return {
    claims,
    unverifiable,
    programs: present.map((key) => ({
      key,
      gate: SCHOLARSHIP_GATES[key] ?? null,
      scopeWarning: SCOPE_WARNINGS[key] ?? null,
    })),
    verifiedAt: VERIFICATION_DATE,
    productionStatus: PRODUCTION_STATUS,
  };
}

// ── Direct accessors ─────────────────────────────────────────────────────────

const BY_ID = new Map(SCHOLARSHIP_CLAIMS.map((c) => [c.id, c]));

/** Look up one audited claim by its report id, e.g. 'J-14'. */
export function getScholarshipClaim(id: string): ScholarshipClaim | undefined {
  return BY_ID.get(id.toUpperCase());
}

export function claimsForProgram(program: string): ScholarshipClaim[] {
  return SCHOLARSHIP_CLAIMS.filter((c) => c.program === program);
}

/** Every field the audit could not confirm, across all programs. */
export function unverifiableClaims(): ScholarshipClaim[] {
  return SCHOLARSHIP_CLAIMS.filter((c) => c.verdict === 'UNCONFIRMED');
}

export function scholarshipCorpusStats(): {
  total: number;
  confirmed: number;
  unverifiable: number;
  programs: number;
  verifiedAt: string | null;
  productionStatus: string | null;
} {
  return {
    total: SCHOLARSHIP_CLAIMS.length,
    confirmed: SCHOLARSHIP_CLAIMS.filter((c) => CONFIRMED.has(c.verdict)).length,
    unverifiable: unverifiableClaims().length,
    programs: Object.keys(SCHOLARSHIP_GATES).length,
    verifiedAt: VERIFICATION_DATE,
    productionStatus: PRODUCTION_STATUS,
  };
}
