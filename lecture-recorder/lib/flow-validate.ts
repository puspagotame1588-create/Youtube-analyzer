/**
 * Runtime checks on a generated flow.
 *
 * Static types say a field is a string; they cannot say the string names a
 * segment that exists, or that a sum adds up. Everything here runs on the
 * finished object before it is allowed to replace the last good one.
 */

import { segmentIndex } from "./flow";
import type {
  EvidenceText,
  FlowCoverageEntry,
  LectureFlow,
  TranscriptSegment,
} from "./types";

export interface ValidationResult {
  /** Any error blocks persistence: the previous flow stays current. */
  errors: string[];
  /** Quality problems worth showing the student, not worth discarding a run. */
  warnings: string[];
}

/** Evidence that claims to come from the transcript must cite the transcript. */
const MUST_CITE = new Set(["transcript", "derived_calculation"]);

export function validateFlow(
  flow: LectureFlow,
  segments: TranscriptSegment[],
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const count = segments.length;

  if (flow.schemaVersion !== "1.0") {
    errors.push(`未知の schemaVersion: ${flow.schemaVersion}`);
  }
  if (count === 0) {
    errors.push("書き起こしが空です。");
    return { errors, warnings };
  }

  const resolves = (id: string) => {
    const index = segmentIndex(id);
    return index !== null && index >= 0 && index < count;
  };

  /* Every citation, wherever it appears, has to name a real segment. */
  const checkEvidence = (evidence: EvidenceText, where: string) => {
    for (const id of evidence.sourceSegmentIds) {
      if (!resolves(id)) errors.push(`${where}: 存在しない引用元 ${id}`);
    }
    if (MUST_CITE.has(evidence.basis) && evidence.sourceSegmentIds.length === 0) {
      errors.push(`${where}: basis が ${evidence.basis} なのに引用元がありません`);
    }
    if (!evidence.text.trim()) errors.push(`${where}: 本文が空です`);
  };

  const walk = (list: EvidenceText[], where: string) =>
    list.forEach((e, i) => checkEvidence(e, `${where}[${i}]`));

  walk(flow.mainQuestions, "mainQuestions");
  walk(flow.overview, "overview");
  walk(flow.conclusion, "conclusion");
  walk(flow.unresolvedQuestions, "unresolvedQuestions");
  walk(flow.examMentions, "examMentions");
  flow.assignments.forEach((a, i) => checkEvidence(a.task, `assignments[${i}].task`));

  /* Sections: unique ids, resolvable citations, sane chapter membership. */
  const sectionIds = new Set<string>();
  for (const [i, section] of flow.sections.entries()) {
    const where = `sections[${i}](${section.id})`;
    if (!section.id.trim()) errors.push(`${where}: id が空です`);
    if (sectionIds.has(section.id)) errors.push(`${where}: id が重複しています`);
    sectionIds.add(section.id);
    if (!section.title.trim()) errors.push(`${where}: title が空です`);

    for (const id of section.sourceSegmentIds) {
      if (!resolves(id)) errors.push(`${where}: 存在しない引用元 ${id}`);
    }
    if (section.sourceSegmentIds.length === 0) {
      errors.push(`${where}: 引用元がありません`);
    }
    checkEvidence(section.purpose, `${where}.purpose`);
    walk(section.explanation, `${where}.explanation`);
    if (section.explanation.length === 0) errors.push(`${where}: 説明がありません`);
    if (section.connectionFromPrevious) {
      checkEvidence(section.connectionFromPrevious, `${where}.connectionFromPrevious`);
    }
    if (section.connectionToNext) {
      checkEvidence(section.connectionToNext, `${where}.connectionToNext`);
    }
    section.details.forEach((d, j) => {
      if (!d.label.trim()) errors.push(`${where}.details[${j}]: label が空です`);
      checkEvidence(d.content, `${where}.details[${j}]`);
    });
  }

  /* Chapters partition the sections. */
  const chapterIds = new Set<string>();
  const claimed = new Map<string, string>();
  for (const [i, chapter] of flow.chapters.entries()) {
    const where = `chapters[${i}](${chapter.id})`;
    if (chapterIds.has(chapter.id)) errors.push(`${where}: id が重複しています`);
    chapterIds.add(chapter.id);
    if (!chapter.title.trim()) errors.push(`${where}: title が空です`);
    for (const id of chapter.sectionIds) {
      if (!sectionIds.has(id)) {
        errors.push(`${where}: 存在しないセクション ${id}`);
        continue;
      }
      const owner = claimed.get(id);
      if (owner) errors.push(`${where}: セクション ${id} は ${owner} にも属しています`);
      else claimed.set(id, chapter.id);
    }
  }
  for (const section of flow.sections) {
    if (!chapterIds.has(section.chapterId)) {
      errors.push(`sections(${section.id}): 存在しない chapterId ${section.chapterId}`);
    } else if (claimed.get(section.id) !== section.chapterId) {
      errors.push(`sections(${section.id}): chapterId が章の一覧と一致しません`);
    }
    if (!claimed.has(section.id)) {
      errors.push(`sections(${section.id}): どの章にも含まれていません`);
    }
  }

  /* Relationships join two sections that exist. */
  for (const [i, rel] of flow.relationships.entries()) {
    const where = `relationships[${i}]`;
    if (!sectionIds.has(rel.fromSectionId)) {
      errors.push(`${where}: 存在しないセクション ${rel.fromSectionId}`);
    }
    if (!sectionIds.has(rel.toSectionId)) {
      errors.push(`${where}: 存在しないセクション ${rel.toSectionId}`);
    }
    if (rel.fromSectionId === rel.toSectionId) {
      errors.push(`${where}: 同じセクションを指しています`);
    }
    checkEvidence(rel.explanation, `${where}.explanation`);
  }

  /* Coverage accounts for the whole transcript, once each. */
  const covered = new Map<string, number>();
  for (const [i, entry] of flow.coverage.entries()) {
    const where = `coverage[${i}](${entry.segmentId})`;
    if (!resolves(entry.segmentId)) {
      errors.push(`${where}: 存在しないセグメントです`);
      continue;
    }
    covered.set(entry.segmentId, (covered.get(entry.segmentId) ?? 0) + 1);
    for (const id of entry.sectionIds) {
      if (!sectionIds.has(id)) errors.push(`${where}: 存在しないセクション ${id}`);
    }
    if (entry.status === "represented" && entry.sectionIds.length === 0) {
      errors.push(`${where}: represented なのにセクションがありません`);
    }
    if (entry.status !== "represented" && !entry.reason?.trim()) {
      errors.push(`${where}: ${entry.status} の理由が書かれていません`);
    }
  }
  for (const [id, times] of covered) {
    if (times > 1) errors.push(`coverage: ${id} が ${times} 回現れます`);
  }
  if (covered.size !== count) {
    errors.push(`coverage: ${count} 区間のうち ${covered.size} 件しかありません`);
  }

  /* Order and arithmetic are quality signals, not grounds for discarding. */
  warnings.push(...orderWarnings(flow));
  warnings.push(...checkArithmetic(flow));

  const unresolved = flow.coverage.filter((c) => c.status === "unresolved").length;
  if (unresolved > 0 && flow.availability === "complete_for_available_transcript") {
    warnings.push(`未整理の区間が ${unresolved} 件あるため、完全とは言えません。`);
  }

  return { errors, warnings };
}

/** Sections should read forwards; a revisit belongs in `relationships`. */
function orderWarnings(flow: LectureFlow): string[] {
  const out: string[] = [];
  let previous = -1;
  let previousId = "";
  for (const section of flow.sections) {
    const indexes = section.sourceSegmentIds
      .map(segmentIndex)
      .filter((n): n is number => n !== null);
    if (indexes.length === 0) continue;
    const first = Math.min(...indexes);
    if (first < previous) {
      out.push(`順序: ${section.id} は ${previousId} より前の区間から始まっています。`);
    }
    previous = first;
    previousId = section.id;
  }
  return out;
}

/* ----------------------------------------------------------- arithmetic --- */

const EQUALS = /[=＝]/;

/**
 * Checks sums the AI wrote out, where it wrote them out.
 *
 * This verifies arithmetic that appears as `a op b = c`, nothing more. It
 * cannot tell whether the right quantities were chosen, so a clean result is
 * not a statement that the reasoning is correct.
 */
export function checkArithmetic(flow: LectureFlow): string[] {
  const out: string[] = [];
  const visit = (evidence: EvidenceText, where: string) => {
    if (evidence.basis !== "derived_calculation") return;
    for (const line of evidence.text.split(/[\n。]/)) {
      const problem = badEquation(line);
      if (problem) out.push(`計算: ${where} ${problem}`);
    }
  };

  for (const section of flow.sections) {
    section.explanation.forEach((e, i) => visit(e, `${section.id}.explanation[${i}]`));
    section.details.forEach((d, i) => visit(d.content, `${section.id}.details[${i}]`));
    visit(section.purpose, `${section.id}.purpose`);
  }
  flow.overview.forEach((e, i) => visit(e, `overview[${i}]`));
  flow.conclusion.forEach((e, i) => visit(e, `conclusion[${i}]`));
  return out;
}

const OPERATOR = /[+\-*/×÷−－✕✖＊／＋]/;

/** Returns a description when an equation in `line` does not hold. */
function badEquation(line: string): string | null {
  if (!EQUALS.test(line)) return null;
  const parts = line.split(EQUALS);
  if (parts.length !== 2) return null;
  // One side has to actually compute something. Without this, "限界利益 ＝ 200円"
  // would be read as an equation rather than a definition.
  if (!OPERATOR.test(parts[0]) && !OPERATOR.test(parts[1])) return null;
  const left = evaluate(parts[0]);
  const right = evaluate(parts[1]);
  if (left === null || right === null) return null;
  // Tolerant enough for a rounded yen figure, tight enough to catch a real error.
  const scale = Math.max(1, Math.abs(left), Math.abs(right));
  if (Math.abs(left - right) <= scale * 1e-6) return null;
  return `${parts[0].trim()} = ${parts[1].trim()} は ${format(left)} ≠ ${format(right)} です`;
}

function format(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(4).replace(/0+$/, "");
}

/**
 * Evaluates + − × ÷ and parentheses, and a bare number.
 *
 * A bare number has to be accepted: the answer side of an equation is usually
 * one, as in "(450 − 300) × 700 − 100,000 ＝ 5,000". Requiring an operator on
 * both sides let a wrong total through unchecked. Whether a line is an
 * equation at all is decided by `badEquation`, not here.
 */
export function evaluate(input: string): number | null {
  const normalized = input
    .replace(/[，,]/g, "")
    .replace(/[（]/g, "(")
    .replace(/[）]/g, ")")
    .replace(/[×✕✖＊*]/g, "*")
    .replace(/[÷／/]/g, "/")
    .replace(/[＋+]/g, "+")
    .replace(/[－−ー‐-]/g, "-")
    .replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0))
    .replace(/[^0-9.+\-*/() ]/g, " ")
    .trim();
  if (!/[0-9]/.test(normalized)) return null;

  const tokens = normalized.match(/\d+(?:\.\d+)?|[+\-*/()]/g);
  if (!tokens) return null;
  // Rebuilding the string from tokens drops any stray text; if that changes the
  // meaning (a word sat between two numbers), this is not a plain equation.
  if (tokens.join("") !== normalized.replace(/\s+/g, "")) return null;

  let at = 0;
  const peek = () => tokens[at];
  const eat = () => tokens[at++];

  const expr = (): number | null => {
    let value = term();
    if (value === null) return null;
    while (peek() === "+" || peek() === "-") {
      const op = eat();
      const next = term();
      if (next === null) return null;
      value = op === "+" ? value + next : value - next;
    }
    return value;
  };
  const term = (): number | null => {
    let value = unary();
    if (value === null) return null;
    while (peek() === "*" || peek() === "/") {
      const op = eat();
      const next = unary();
      if (next === null) return null;
      if (op === "/" && next === 0) return null;
      value = op === "*" ? value * next : value / next;
    }
    return value;
  };
  const unary = (): number | null => {
    if (peek() === "-") {
      eat();
      const value = unary();
      return value === null ? null : -value;
    }
    if (peek() === "(") {
      eat();
      const value = expr();
      if (value === null || eat() !== ")") return null;
      return value;
    }
    const token = peek();
    if (token === undefined || !/^\d/.test(token)) return null;
    eat();
    return Number(token);
  };

  const result = expr();
  return at === tokens.length && result !== null && Number.isFinite(result) ? result : null;
}

/* ------------------------------------------------------------- coverage --- */

/**
 * Builds the coverage table from what the sections actually cite.
 *
 * The model is asked for its own account of coverage, but it is not the source
 * of truth: this recomputes which segments a section really cited, so a
 * segment cannot be reported as explained just because the model said so.
 */
export function auditCoverage(
  flow: Pick<LectureFlow, "sections" | "coverage">,
  segmentCount: number,
): FlowCoverageEntry[] {
  const bySegment = new Map<string, string[]>();
  for (const section of flow.sections) {
    const cited = new Set<string>(section.sourceSegmentIds);
    for (const evidence of [
      section.purpose,
      ...section.explanation,
      ...section.details.map((d) => d.content),
      ...(section.connectionFromPrevious ? [section.connectionFromPrevious] : []),
      ...(section.connectionToNext ? [section.connectionToNext] : []),
    ]) {
      for (const id of evidence.sourceSegmentIds) cited.add(id);
    }
    for (const id of cited) {
      const index = segmentIndex(id);
      if (index === null || index < 0 || index >= segmentCount) continue;
      const list = bySegment.get(id) ?? [];
      if (!list.includes(section.id)) list.push(section.id);
      bySegment.set(id, list);
    }
  }

  const claimed = new Map(flow.coverage.map((c) => [c.segmentId, c]));
  const out: FlowCoverageEntry[] = [];
  for (let i = 0; i < segmentCount; i++) {
    const id = `s${i + 1}`;
    const sectionIds = bySegment.get(id) ?? [];
    if (sectionIds.length > 0) {
      out.push({ segmentId: id, status: "represented", sectionIds, reason: null });
      continue;
    }
    // Uncited: keep the model's reason when it gave one, otherwise say plainly
    // that nothing accounted for this segment.
    const said = claimed.get(id);
    if (said && said.status === "non_instructional" && said.reason?.trim()) {
      out.push({
        segmentId: id,
        status: "non_instructional",
        sectionIds: [],
        reason: said.reason.trim(),
      });
      continue;
    }
    out.push({
      segmentId: id,
      status: "unresolved",
      sectionIds: [],
      reason: said?.reason?.trim() || "この区間は説明に取り込まれていません。",
    });
  }
  return out;
}
