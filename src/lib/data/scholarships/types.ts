/**
 * Scholarship claim index — types.
 *
 * The corpus is the committed verification report, one entry per audited claim.
 * The distinction that matters throughout this module is between a claim the
 * audit CONFIRMED against an official source and one it could NOT confirm. The
 * two are never carried in the same list, so a caller cannot accidentally
 * present an unconfirmable field as fact.
 */

export type ScholarshipProgramKey = 'jasso' | 'mext' | 'yoneyama' | 'satoyo' | 'kyoritsu';

/**
 * PASS        — the saved statement agrees with the official source
 * MISMATCH    — it disagreed and was corrected
 * UNCONFIRMED — the official source does not publish the field at all
 */
export type ClaimVerdict = 'PASS' | 'MISMATCH' | 'UNCONFIRMED';

export interface ScholarshipClaim {
  /** Audit row id, e.g. 'J-14', 'R-11', 'K-08'. Stable and citable. */
  id: string;
  program: ScholarshipProgramKey | string;
  /** The statement that was checked, verbatim from the report. */
  statement: string;
  verdict: ClaimVerdict;
  /**
   * The exact supporting excerpt from the official source. For UNCONFIRMED rows
   * this is the auditor's note on what the source does NOT say.
   */
  excerpt: string;
  /** Controlling official URL(s). Never empty — the build refuses to emit otherwise. */
  sourceUrls: string[];
}

/**
 * Where a programme sits in its recruitment cycle.
 *
 * `closed-awaiting-next` means the round whose detailed terms the official page
 * publishes has already closed, and the next round's detailed terms are not out
 * yet. That combination is dangerous to render plainly: every confirmed claim
 * is still true of the round it names, but a reader looking ahead will read it
 * as current unless told otherwise.
 */
export type CycleStatus = 'open' | 'closed-awaiting-next';

export interface ProgramCycle {
  status: CycleStatus;
  /**
   * Audit row recording what is NOT published for the next cycle. Forced into
   * every answer for this programme so the gap cannot be silently omitted.
   * Null when the audit has no such row.
   */
  nextCycleUnconfirmedClaimId: string | null;
}

export interface ScholarshipGate {
  pass: number;
  mismatch: number;
  unconfirmed: number;
  /** The audit's own gate wording, e.g. 'Hold'. */
  gate: string;
}

/**
 * Result of a retrieval. Mirrors `retrieveUniversities()`: the payload carries
 * its own citation and its own honest gaps rather than leaving the caller to
 * remember them.
 */
export interface ScholarshipRetrieval {
  /** Confirmed claims only. Safe to present as fact, with the excerpt and URL. */
  claims: ScholarshipClaim[];
  /**
   * Claims the audit could not confirm from any official source. Returned so a
   * caller can say "this is not published" — never so it can be stated as fact.
   */
  unverifiable: ScholarshipClaim[];
  /** Programs represented in this result, with their audit gate. */
  programs: Array<{
    key: string;
    gate: ScholarshipGate | null;
    scopeWarning: string | null;
    cycle: ProgramCycle;
  }>;
  /** Date the corpus was verified. */
  verifiedAt: string | null;
  /** The audit's overall production decision. */
  productionStatus: string | null;
}
