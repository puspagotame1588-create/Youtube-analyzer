/**
 * Grounding layer for the scholarship chatbot.
 *
 * Two jobs, both of which exist so the model cannot assert anything the audit
 * did not confirm:
 *
 *  1. buildScholarshipContext() turns a question into the ONLY material the
 *     model is allowed to see — confirmed claims and unpublished-field claims,
 *     grouped by programme, each tagged with its audit id.
 *
 *  2. resolveScholarshipAnswer() takes the model's reply back. The model emits
 *     claim IDs, never URLs or excerpts; this function resolves those ids
 *     against the context it was given. An id the model invented, or one that
 *     belongs to a different programme than the section citing it, is dropped.
 *     A section left with no supporting claim is dropped; if nothing survives,
 *     the answer is a refusal.
 *
 * The consequence is that a fabricated citation is not "unlikely", it is
 * unrepresentable: URLs are only ever produced by this file, from the corpus.
 */

import {
  retrieveScholarshipClaims,
  getScholarshipClaim,
  PROGRAM_LABELS,
  type ScholarshipClaim,
  type ScholarshipGate,
} from '@/lib/data/scholarships';

/** Max confirmed claims per programme sent to the model. Bounds prompt size. */
const MAX_CONFIRMED_PER_PROGRAMME = 8;
/** Max programmes in one answer. Beyond this the question is too broad. */
const MAX_PROGRAMMES = 3;

/**
 * Aliases used to detect which programme(s) a question is about. Detection only
 * narrows retrieval — it never adds facts.
 */
const PROGRAMME_ALIASES: Record<string, RegExp> = {
  jasso: /jasso|学習奨励費|日本学生支援機構|honors scholarship|奨励費/i,
  mext: /mext|monbukagakusho|文部科学省|国費|japanese government scholarship|embassy recommendation|大使館推薦/i,
  yoneyama: /yoneyama|米山|rotary|ロータリー/i,
  satoyo: /sato ?yo|佐藤陽|sisf/i,
  kyoritsu: /kyoritsu|共立/i,
};

export function detectProgrammes(message: string): string[] {
  return Object.entries(PROGRAMME_ALIASES)
    .filter(([, re]) => re.test(message))
    .map(([key]) => key);
}

export interface ContextClaim {
  id: string;
  statement: string;
  excerpt: string;
}

export interface ProgrammeContext {
  key: string;
  labelEn: string;
  labelJa: string;
  gate: ScholarshipGate | null;
  scopeWarning: string | null;
  /** Audit-confirmed. May be quoted as fact, with citation. */
  confirmed: ContextClaim[];
  /** The official source does not publish this. May only be reported as unpublished. */
  unpublished: ContextClaim[];
}

export interface ScholarshipChatContext {
  programmes: ProgrammeContext[];
  verifiedAt: string | null;
  productionStatus: string | null;
  /** True when retrieval found nothing — the endpoint refuses without calling a model. */
  empty: boolean;
}

const toContextClaim = (c: ScholarshipClaim): ContextClaim => ({
  id: c.id,
  statement: c.statement,
  excerpt: c.excerpt,
});

/**
 * Builds the model's entire view of the world for one question. Anything not
 * in here cannot appear in a cited answer.
 */
export function buildScholarshipContext(message: string): ScholarshipChatContext {
  const detected = detectProgrammes(message);
  const retrieval = retrieveScholarshipClaims(message, {
    programs: detected.length ? detected : undefined,
    limit: MAX_CONFIRMED_PER_PROGRAMME * MAX_PROGRAMMES,
  });

  const byProgramme = new Map<string, ProgrammeContext>();
  const ensure = (key: string): ProgrammeContext => {
    let p = byProgramme.get(key);
    if (!p) {
      const meta = retrieval.programs.find((x) => x.key === key) ?? null;
      p = {
        key,
        labelEn: PROGRAM_LABELS[key]?.en ?? key,
        labelJa: PROGRAM_LABELS[key]?.ja ?? key,
        gate: meta?.gate ?? null,
        scopeWarning: meta?.scopeWarning ?? null,
        confirmed: [],
        unpublished: [],
      };
      byProgramme.set(key, p);
    }
    return p;
  };

  for (const c of retrieval.claims) {
    const p = ensure(c.program);
    if (p.confirmed.length < MAX_CONFIRMED_PER_PROGRAMME) p.confirmed.push(toContextClaim(c));
  }
  for (const c of retrieval.unverifiable) {
    ensure(c.program).unpublished.push(toContextClaim(c));
  }

  // Rank programmes by how much confirmed support they actually have.
  const programmes = [...byProgramme.values()]
    .sort((a, b) => b.confirmed.length - a.confirmed.length)
    .slice(0, MAX_PROGRAMMES);

  const empty = programmes.every((p) => p.confirmed.length === 0 && p.unpublished.length === 0);

  return {
    programmes,
    verifiedAt: retrieval.verifiedAt,
    productionStatus: retrieval.productionStatus,
    empty: programmes.length === 0 || empty,
  };
}

// ── Resolving the model's reply back into cited facts ────────────────────────

/** What the model is allowed to return. It emits ids, never URLs or excerpts. */
export interface ModelSection {
  programme: string;
  answer: string;
  claimIds: string[];
  unpublishedIds?: string[];
}

export interface ModelAnswer {
  sections: ModelSection[];
  refused?: boolean;
}

export interface ResolvedCitation {
  claimId: string;
  statement: string;
  excerpt: string;
  sourceUrls: string[];
}

export interface ResolvedSection {
  programme: string;
  labelEn: string;
  labelJa: string;
  answer: string;
  gate: ScholarshipGate | null;
  scopeWarning: string | null;
  citations: ResolvedCitation[];
  unpublished: ResolvedCitation[];
}

export type RefusalReason =
  | 'no-relevant-claims'
  | 'no-supported-sections'
  | 'model-refused';

export interface ResolvedAnswer {
  sections: ResolvedSection[];
  refused: boolean;
  refusalReason?: RefusalReason;
  verifiedAt: string | null;
  productionStatus: string | null;
  /** Ids the model cited that were not in its context, or crossed programmes. */
  droppedClaimIds: string[];
}

/**
 * Resolves ids to citations against the exact context the model was given.
 *
 * A claim id is only honoured inside the section for the programme it belongs
 * to. That is what stops conditions from two programmes being presented as one
 * set: a section can physically only cite its own programme's claims.
 */
export function resolveScholarshipAnswer(
  context: ScholarshipChatContext,
  model: ModelAnswer,
): ResolvedAnswer {
  const base = {
    verifiedAt: context.verifiedAt,
    productionStatus: context.productionStatus,
  };

  if (model.refused) {
    return { sections: [], refused: true, refusalReason: 'model-refused', droppedClaimIds: [], ...base };
  }

  const dropped: string[] = [];
  const sections: ResolvedSection[] = [];

  for (const s of model.sections ?? []) {
    const ctx = context.programmes.find((p) => p.key === s.programme);
    if (!ctx) {
      dropped.push(...(s.claimIds ?? []), ...(s.unpublishedIds ?? []));
      continue;
    }

    const confirmedById = new Map(ctx.confirmed.map((c) => [c.id, c]));
    const unpublishedById = new Map(ctx.unpublished.map((c) => [c.id, c]));

    const citations: ResolvedCitation[] = [];
    for (const id of s.claimIds ?? []) {
      const hit = confirmedById.get(id);
      if (!hit) {
        // Either invented, or belongs to another programme. Either way it must
        // not become a citation under this heading.
        dropped.push(id);
        continue;
      }
      citations.push({ claimId: hit.id, statement: hit.statement, excerpt: hit.excerpt, sourceUrls: urlsFor(id) });
    }

    const unpublished: ResolvedCitation[] = [];
    for (const id of s.unpublishedIds ?? []) {
      const hit = unpublishedById.get(id);
      if (!hit) {
        dropped.push(id);
        continue;
      }
      unpublished.push({ claimId: hit.id, statement: hit.statement, excerpt: hit.excerpt, sourceUrls: urlsFor(id) });
    }

    // Prose with nothing behind it is exactly what this bot must not emit.
    if (citations.length === 0 && unpublished.length === 0) continue;
    if (!s.answer?.trim()) continue;

    sections.push({
      programme: ctx.key,
      labelEn: ctx.labelEn,
      labelJa: ctx.labelJa,
      answer: s.answer.trim(),
      gate: ctx.gate,
      scopeWarning: ctx.scopeWarning,
      citations,
      unpublished,
    });
  }

  if (sections.length === 0) {
    return {
      sections: [],
      refused: true,
      refusalReason: context.empty ? 'no-relevant-claims' : 'no-supported-sections',
      droppedClaimIds: [...new Set(dropped)],
      ...base,
    };
  }

  return {
    sections,
    refused: false,
    droppedClaimIds: [...new Set(dropped)],
    ...base,
  };
}

/** Source URLs come from the corpus, never from the model. */
function urlsFor(claimId: string): string[] {
  return getScholarshipClaim(claimId)?.sourceUrls ?? [];
}
