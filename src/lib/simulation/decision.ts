/**
 * Decision-report derivation (Phase 10 data contract).
 *
 * ARCHITECTURE RULES honored here:
 *  1. Structured data determines ELIGIBILITY (deterministic requirement checks).
 *  2. The deterministic engine measures SUITABILITY (the score) — eligibility is
 *     a SEPARATE concept and is never inferred from the score.
 *  3. Evidence comes from the dataset's provenance/source records (RAG-style).
 *  4. This layer is PURE and deterministic. It never calls an AI model, never
 *     ranks from memory, never invents facts, and never changes a score: every
 *     `score`/`points` value is copied straight from the engine output.
 *  5/6. The main entity is a school; the seed data is SCHOOL-LEVEL, so every
 *     requirement is labeled scope 'school' with "program applicability
 *     unverified" — university-wide facts are never presented as program-specific.
 *  7. Missing information is surfaced as 'unverified' / unknown, never invented.
 */

import type { Dataset, School, SourceRecord } from '@/lib/data/types';
import { JLPT_ORDER, type SimProfile, type SimRoute, type SimulationResult } from './types';

export type RouteEligibility =
  | 'eligible'
  | 'likely_eligible'
  | 'possibly_eligible'
  | 'not_currently_eligible'
  | 'unknown';

export type Confidence = 'high' | 'medium' | 'low';
export type RequirementStatus = 'met' | 'not_met' | 'unverified';
export type EvidenceBasis = 'verified' | 'user_input' | 'estimate' | 'assumption' | 'unknown';
export type EvidenceKind = 'fact' | 'assumption' | 'estimate' | 'unknown';
export type Bi = { en: string; ja: string };

export interface EvidenceRef {
  /** null when no source backs this requirement yet. */
  source: Bi | null;
  url?: string;
  /** 'school' = university/school-wide record; program applicability unverified. */
  scope: 'program' | 'school' | 'general' | 'none';
  scopeNote: Bi;
  checkedAt?: string;
  isDemo: boolean;
}

export interface RequirementCheck {
  id: string;
  label: Bi;
  requirement: Bi;
  userStatus: Bi;
  status: RequirementStatus;
  evidence: EvidenceRef;
  nextAction: Bi;
}

export interface ScoreCategory {
  id: string;
  label: Bi;
  points: number;
  max: number;
  reason: Bi;
  basis: EvidenceBasis;
}

export interface EvidenceItem {
  kind: EvidenceKind;
  statement: Bi;
  basis: Bi;
  scope: EvidenceRef['scope'];
  checkedAt?: string;
  confidence: Confidence | 'unknown';
}

export interface DecisionFactor {
  label: Bi;
  detail: Bi;
}

export interface NextAction {
  priority: 'high' | 'medium' | 'low';
  title: Bi;
  why: Bi;
  /** Only set when a real deadline is known; never fabricated. */
  deadline?: string;
  evidenceNeeded: Bi;
  done: boolean;
}

export interface RouteDecisionResult {
  routeId: string;
  routeName: Bi;
  kind: SimRoute['kind'];
  score: number;
  eligibility: RouteEligibility;
  confidence: Confidence;
  summary: Bi;
  positiveFactors: DecisionFactor[];
  risks: DecisionFactor[];
  blockers: RequirementCheck[];
  scoreBreakdown: ScoreCategory[];
  facts: EvidenceItem[];
  assumptions: EvidenceItem[];
  estimates: EvidenceItem[];
  unknowns: EvidenceItem[];
  nextActions: NextAction[];
  evidenceCoverage: { verified: number; total: number };
  /** comparison + card fields */
  isDemo: boolean;
  timeMonths: number;
  totalCostJpy: { min: number; expected: number; max: number };
  jlptRequirement: Bi;
  firstCareer: Bi;
}

export interface DecisionReport {
  routes: RouteDecisionResult[];
  /** highest-scoring route that is not not_currently_eligible/unknown; null if none. */
  recommendedRouteId: string | null;
  closeCall: boolean;
  generatedAt: string;
  engineVersion: string;
}

const NOT_VERIFIED: Bi = { en: 'Not verified', ja: '未確認' };
const SCHOOL_SCOPE_NOTE: Bi = {
  en: 'School-level record — program-specific applicability not verified.',
  ja: '学校単位の記録です。プログラム個別の適用可否は未確認です。',
};

function schoolsForRoute(route: SimRoute, dataset: Dataset): School[] {
  return route.schoolIds
    .map((id) => dataset.schools.find((s) => s.id === id))
    .filter((s): s is School => Boolean(s));
}

function sourceRef(dataset: Dataset, sourceIds: string[]): SourceRecord | undefined {
  for (const id of sourceIds) {
    const src = dataset.sources.find((s) => s.id === id);
    if (src) return src;
  }
  return undefined;
}

/** Deterministic requirement checks from structured data (rule 1). */
function buildRequirements(route: SimRoute, profile: SimProfile, dataset: Dataset): RequirementCheck[] {
  const checks: RequirementCheck[] = [];
  const school = schoolsForRoute(route, dataset)[0];
  const career = dataset.careers.find((c) => c.id === route.careerId);
  const haveJlpt = Math.max(JLPT_ORDER[profile.jlptCurrent], profile.jlptExpected ? JLPT_ORDER[profile.jlptExpected] : 0);

  if (school) {
    // --- JLPT admission requirement (school-level) ---
    const req = JLPT_ORDER[school.jlptRequired];
    const met = haveJlpt >= req;
    const src = sourceRef(dataset, school.provenance.sourceIds);
    checks.push({
      id: 'jlpt',
      label: { en: 'Japanese-language requirement', ja: '日本語要件' },
      requirement: { en: `JLPT ${school.jlptRequired.toUpperCase()} (admission)`, ja: `JLPT ${school.jlptRequired.toUpperCase()}（入学）` },
      userStatus: {
        en: `You: ${profile.jlptCurrent.toUpperCase()}${profile.jlptExpected ? ` → ${profile.jlptExpected.toUpperCase()} expected` : ''}`,
        ja: `あなた：${profile.jlptCurrent.toUpperCase()}${profile.jlptExpected ? ` → ${profile.jlptExpected.toUpperCase()}（見込み）` : ''}`,
      },
      status: met ? 'met' : 'unverified',
      evidence: {
        source: src ? { en: src.nameEn, ja: src.nameJa } : null,
        ...(src?.url ? { url: src.url } : {}),
        scope: 'school',
        scopeNote: SCHOOL_SCOPE_NOTE,
        ...(school.provenance.lastVerified ? { checkedAt: school.provenance.lastVerified } : {}),
        isDemo: school.provenance.isDemo,
      },
      nextAction: met
        ? { en: 'Confirm the exact level required for your specific program and admission route.', ja: '志望プログラム・入試方式ごとの必要レベルを確認してください。' }
        : { en: `Reach and verify JLPT ${school.jlptRequired.toUpperCase()} before the application window.`, ja: `出願までに JLPT ${school.jlptRequired.toUpperCase()} を取得・確認してください。` },
    });

    // --- EJU requirement (school-level) ---
    if (school.ejuRequired) {
      checks.push({
        id: 'eju',
        label: { en: 'EJU (Examination for Japanese University Admission)', ja: 'EJU（日本留学試験）' },
        requirement: { en: 'EJU required', ja: 'EJUが必要' },
        userStatus: NOT_VERIFIED,
        status: 'unverified',
        evidence: {
          source: sourceRef(dataset, school.provenance.sourceIds) ? { en: sourceRef(dataset, school.provenance.sourceIds)!.nameEn, ja: sourceRef(dataset, school.provenance.sourceIds)!.nameJa } : null,
          scope: 'school',
          scopeNote: SCHOOL_SCOPE_NOTE,
          ...(school.provenance.lastVerified ? { checkedAt: school.provenance.lastVerified } : {}),
          isDemo: school.provenance.isDemo,
        },
        nextAction: { en: 'Confirm whether EJU is required for your program and which subjects/scores.', ja: '志望プログラムでEJUが必要か、必要科目・点数を確認してください。' },
      });
    }

    // --- Affordability (user budget vs school cost) — a funding check, never an auto hard-block ---
    const cost = route.totalCostJpy.expected;
    const affMet = profile.budgetJpy.expected >= cost;
    checks.push({
      id: 'affordability',
      label: { en: 'Funding / affordability', ja: '費用・資金' },
      requirement: { en: `Total education cost ~¥${cost.toLocaleString()}`, ja: `教育費の目安 約¥${cost.toLocaleString()}` },
      userStatus: { en: `Your budget ¥${profile.budgetJpy.expected.toLocaleString()}`, ja: `予算 ¥${profile.budgetJpy.expected.toLocaleString()}` },
      status: affMet ? 'met' : 'unverified',
      evidence: {
        source: null,
        scope: 'general',
        scopeNote: { en: 'Cost is an estimate from school-level figures; your funding is self-reported.', ja: '費用は学校単位の数値からの推定、資金は自己申告です。' },
        isDemo: school.provenance.isDemo,
      },
      nextAction: affMet
        ? { en: 'Confirm all mandatory fees (admission, facilities, materials) for the exact year.', ja: '該当年度の必須費用（入学金・施設費・教材費）をすべて確認してください。' }
        : { en: 'Check scholarships and confirm total mandatory cost before committing.', ja: '奨学金を確認し、確定前に必須費用の総額を確認してください。' },
    });
  }

  // --- Work-status / degree pathway (can be a genuine current blocker) ---
  if (career) {
    let status: RequirementStatus = 'unverified';
    let reqText: Bi;
    if (route.kind === 'university') {
      status = career.degreePathways.university ? 'met' : 'not_met';
      reqText = { en: 'Bachelor degree supports the standard work status in this field', ja: '学士号がこの分野の標準的な就労資格の根拠になります' };
    } else if (route.kind === 'vocational') {
      status = career.degreePathways.vocational ? 'met' : 'not_met';
      reqText = { en: 'Diploma (専門士) supports the standard work status in this field', ja: '専門士がこの分野の標準的な就労資格の根拠になります' };
    } else {
      const ok = career.degreePathways.direct || profile.education === 'bachelor' || profile.education === 'master';
      status = ok ? 'unverified' : 'not_met';
      reqText = { en: 'Direct employment needs a compatible work status for this field', ja: '直接就職にはこの分野に適合する就労資格が必要です' };
    }
    const src = sourceRef(dataset, career.provenance.sourceIds);
    checks.push({
      id: 'work-status',
      label: { en: 'Work-status eligibility (general guidance)', ja: '就労資格の適合（一般情報）' },
      requirement: reqText,
      userStatus: { en: `Your prior education: ${profile.education}`, ja: `これまでの学歴：${profile.education}` },
      status,
      evidence: {
        source: src ? { en: src.nameEn, ja: src.nameJa } : null,
        ...(src?.url ? { url: src.url } : {}),
        scope: 'general',
        scopeNote: { en: 'General residence-status guidance — individual review by the ISA always applies; not legal advice.', ja: '在留資格の一般的な案内です。出入国在留管理庁の個別審査があります。法的助言ではありません。' },
        ...(career.provenance.lastVerified ? { checkedAt: career.provenance.lastVerified } : {}),
        isDemo: career.provenance.isDemo,
      },
      nextAction:
        status === 'not_met'
          ? { en: 'This field generally needs a degree/専門士 or a specific status — a study route or specialist advice is required.', ja: 'この分野は通常、学位・専門士または特定の在留資格が必要です。進学ルートまたは専門家への相談が必要です。' }
          : { en: 'Confirm the residence-status route with a qualified professional (gyoseishoshi).', ja: '在留資格の方針を有資格の専門家（行政書士）に確認してください。' },
    });
  }

  return checks;
}

/** Eligibility from requirement checks — separate from the score (rules 1, 2, 7). */
export function deriveEligibility(checks: RequirementCheck[]): RouteEligibility {
  if (checks.length === 0) return 'unknown';
  const notMet = checks.filter((c) => c.status === 'not_met').length;
  const unverified = checks.filter((c) => c.status === 'unverified').length;
  if (notMet > 0) return 'not_currently_eligible';
  if (unverified === 0) return 'eligible';
  // Some unknowns remain, nothing is failing → not eligible-confirmed, not blocked.
  return unverified <= 1 ? 'likely_eligible' : 'possibly_eligible';
}

function deriveConfidence(route: SimRoute, unverifiedCount: number): Confidence {
  if (route.evidence === 'weak') return 'low'; // all-demonstration data
  if (route.evidence === 'moderate' || unverifiedCount >= 2) return 'medium';
  return unverifiedCount === 0 ? 'high' : 'medium';
}

const FACTOR_META: Record<string, { label: Bi; basis: EvidenceBasis }> = {
  affordability: { label: { en: 'Affordability', ja: '費用適合' }, basis: 'user_input' },
  visa: { label: { en: 'Eligibility fit (visa pathway)', ja: '資格適合（在留資格）' }, basis: 'assumption' },
  employment: { label: { en: 'Employment prospects', ja: '就職見込み' }, basis: 'estimate' },
  salary: { label: { en: 'Salary potential', ja: '給与ポテンシャル' }, basis: 'estimate' },
  location: { label: { en: 'Location fit', ja: '勤務地適合' }, basis: 'user_input' },
  settlement: { label: { en: 'Long-term / settlement fit', ja: '長期・定住適合' }, basis: 'assumption' },
  interest: { label: { en: 'Goal / field fit', ja: '目標・分野適合' }, basis: 'user_input' },
};

function buildScoreBreakdown(route: SimRoute): ScoreCategory[] {
  // points sum to the engine score; values copied verbatim (never AI-altered).
  return route.breakdown.map((f) => {
    const meta = FACTOR_META[f.factor] ?? { label: { en: f.factor, ja: f.factor }, basis: 'estimate' as EvidenceBasis };
    return {
      id: f.factor,
      label: meta.label,
      points: Math.round(f.weighted),
      max: Math.round(f.weight),
      reason: { en: f.reasonEn, ja: f.reasonJa },
      basis: meta.basis,
    };
  });
}

function buildPositivesAndRisks(route: SimRoute): { positives: DecisionFactor[]; risks: DecisionFactor[] } {
  const sorted = [...route.breakdown].sort((a, b) => b.score - a.score);
  const positives: DecisionFactor[] = sorted.slice(0, 3).map((f) => ({
    label: FACTOR_META[f.factor]?.label ?? { en: f.factor, ja: f.factor },
    detail: { en: f.reasonEn, ja: f.reasonJa },
  }));
  const risks: DecisionFactor[] = [...route.breakdown]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((f) => ({
      label: FACTOR_META[f.factor]?.label ?? { en: f.factor, ja: f.factor },
      detail: { en: f.reasonEn, ja: f.reasonJa },
    }));
  // Demo salary is an explicit, honest risk when unverified.
  if (route.salaryRangeJpy.isDemo) {
    risks.unshift({
      label: { en: 'Employment/salary outcomes not verified', ja: '就職・給与の実績は未確認' },
      detail: { en: 'Entry salary shown is demonstration data, not a verified outcome.', ja: '表示中の初任給はデモデータであり、検証済みの実績ではありません。' },
    });
  }
  return { positives, risks: risks.slice(0, 3) };
}

function buildEvidenceItems(route: SimRoute, profile: SimProfile, dataset: Dataset): Pick<RouteDecisionResult, 'facts' | 'assumptions' | 'estimates' | 'unknowns'> {
  const school = schoolsForRoute(route, dataset)[0];
  const career = dataset.careers.find((c) => c.id === route.careerId);
  const facts: EvidenceItem[] = [];
  const estimates: EvidenceItem[] = [];
  const unknowns: EvidenceItem[] = [];

  // Verified facts = published, non-demo provenance only (rule 7: never invent).
  for (const rec of [school?.provenance, career?.provenance]) {
    if (rec && !rec.isDemo && rec.verification === 'published') {
      const src = sourceRef(dataset, rec.sourceIds);
      facts.push({
        kind: 'fact',
        statement: { en: `${school ? school.nameEn : career?.nameEn ?? ''} record is independently verified.`, ja: `${school ? school.nameJa : career?.nameJa ?? ''}の記録は独立して検証済みです。` },
        basis: src ? { en: src.nameEn, ja: src.nameJa } : { en: 'Reviewed source', ja: '確認済み情報源' },
        scope: school ? 'school' : 'general',
        ...(rec.lastVerified ? { checkedAt: rec.lastVerified } : {}),
        confidence: rec.confidence,
      });
    }
  }

  // Estimates = demonstration / derived numbers.
  if (route.salaryRangeJpy.isDemo) {
    estimates.push({
      kind: 'estimate',
      statement: { en: `Entry salary ¥${route.salaryRangeJpy.min.toLocaleString()}–¥${route.salaryRangeJpy.max.toLocaleString()}`, ja: `初任給 ¥${route.salaryRangeJpy.min.toLocaleString()}〜¥${route.salaryRangeJpy.max.toLocaleString()}` },
      basis: { en: 'Demonstration data (fictional)', ja: 'デモデータ（架空）' },
      scope: 'none',
      confidence: 'low',
    });
  }
  estimates.push({
    kind: 'estimate',
    statement: { en: `Total education cost ~¥${route.totalCostJpy.expected.toLocaleString()} (range ¥${route.totalCostJpy.min.toLocaleString()}–¥${route.totalCostJpy.max.toLocaleString()})`, ja: `教育費 約¥${route.totalCostJpy.expected.toLocaleString()}（幅 ¥${route.totalCostJpy.min.toLocaleString()}〜¥${route.totalCostJpy.max.toLocaleString()}）` },
    basis: { en: 'Estimated from school-level figures; scholarships not applied.', ja: '学校単位の数値からの推定。奨学金は未反映。' },
    scope: 'school',
    confidence: 'medium',
  });

  // Assumptions = engine assumptions (user inputs + defaults), kept OUT of facts.
  const assumptions: EvidenceItem[] = route.assumptions.map((a) => ({
    kind: 'assumption',
    statement: { en: `${a.labelEn}: ${a.value}`, ja: `${a.labelJa}：${a.value}` },
    basis: a.origin === 'user' ? { en: 'Your input (unverified)', ja: 'あなたの入力（未検証）' } : { en: 'Engine default assumption', ja: 'エンジンの既定の前提' },
    scope: 'none',
    confidence: 'unknown',
  }));

  // Unknowns = missing info surfaced by the engine.
  for (let i = 0; i < route.missingInfoEn.length; i += 1) {
    unknowns.push({
      kind: 'unknown',
      statement: { en: route.missingInfoEn[i] ?? 'Not verified', ja: route.missingInfoJa[i] ?? '未確認' },
      basis: { en: 'More information required', ja: '追加情報が必要です' },
      scope: 'none',
      confidence: 'unknown',
    });
  }
  void profile;
  return { facts, assumptions, estimates, unknowns };
}

function buildNextActions(checks: RequirementCheck[], route: SimRoute): NextAction[] {
  const actions: NextAction[] = [];
  for (const c of checks) {
    if (c.status === 'unverified' || c.status === 'not_met') {
      actions.push({
        priority: c.status === 'not_met' ? 'high' : c.id === 'jlpt' || c.id === 'eju' ? 'high' : 'medium',
        title: c.nextAction,
        why: { en: `${c.label.en} is currently "${c.status === 'not_met' ? 'not met' : 'not verified'}".`, ja: `${c.label.ja}は現在「${c.status === 'not_met' ? '未達' : '未確認'}」です。` },
        evidenceNeeded: c.evidence.source ?? { en: 'Official program/admission source', ja: '公式のプログラム・入試情報' },
        done: false,
      });
    }
  }
  if (route.missingInfoEn.length > 0) {
    actions.push({
      priority: 'low',
      title: { en: 'Provide the missing profile details to sharpen the estimate.', ja: '不足しているプロフィール項目を入力すると推定精度が上がります。' },
      why: { en: 'Some scores used a neutral baseline due to missing input.', ja: '入力不足のため一部のスコアは中立的な基準を使用しました。' },
      evidenceNeeded: { en: 'Your own information', ja: 'ご自身の情報' },
      done: false,
    });
  }
  return actions.slice(0, 5);
}

function summarize(route: SimRoute, eligibility: RouteEligibility, unverified: number, rank: number): Bi {
  const topFactor = [...route.breakdown].sort((a, b) => b.score - a.score)[0];
  const factorLabel = topFactor ? FACTOR_META[topFactor.factor]?.label ?? { en: topFactor.factor, ja: topFactor.factor } : { en: 'overall fit', ja: '総合適合' };
  const rankPhrase =
    rank === 0
      ? { en: 'currently ranks first', ja: '現在1位です' }
      : { en: `currently ranks #${rank + 1}`, ja: `現在${rank + 1}位です` };
  const eligPhrase: Record<RouteEligibility, Bi> = {
    eligible: { en: 'All checked requirements are met.', ja: '確認済みの要件はすべて満たしています。' },
    likely_eligible: { en: `${unverified} requirement still needs verification.`, ja: `要件が${unverified}件、確認待ちです。` },
    possibly_eligible: { en: `${unverified} requirements still need verification.`, ja: `要件が${unverified}件、確認待ちです。` },
    not_currently_eligible: { en: 'A core requirement is not currently met.', ja: '中核となる要件が現在満たされていません。' },
    unknown: { en: 'Eligibility could not be determined from available data.', ja: '入手可能なデータでは適合性を判定できませんでした。' },
  };
  return {
    en: `This route ${rankPhrase.en} on suitability, driven mainly by ${factorLabel.en.toLowerCase()}. ${eligPhrase[eligibility].en}`,
    ja: `このルートは適合度で${rankPhrase.ja}。主な要因は「${factorLabel.ja}」です。${eligPhrase[eligibility].ja}`,
  };
}

function jlptRequirementText(route: SimRoute, dataset: Dataset): Bi {
  const school = schoolsForRoute(route, dataset)[0];
  if (school) return { en: `JLPT ${school.jlptRequired.toUpperCase()} (school-level)`, ja: `JLPT ${school.jlptRequired.toUpperCase()}（学校単位）` };
  const career = dataset.careers.find((c) => c.id === route.careerId);
  if (career) return { en: `JLPT ${career.minJlptEntry.toUpperCase()} (typical entry)`, ja: `JLPT ${career.minJlptEntry.toUpperCase()}（一般的な入職目安）` };
  return NOT_VERIFIED;
}

/** Build the full decision report from an engine result (pure, deterministic). */
export function buildDecisionReport(result: SimulationResult, dataset: Dataset): DecisionReport {
  const routes: RouteDecisionResult[] = result.routes.map((route, rank) => {
    const blockers = buildRequirements(route, result.profile, dataset);
    const eligibility = deriveEligibility(blockers);
    const unverified = blockers.filter((c) => c.status === 'unverified').length;
    const verified = blockers.filter((c) => c.status === 'met').length;
    const confidence = deriveConfidence(route, unverified);
    const { positives, risks } = buildPositivesAndRisks(route);
    const evidence = buildEvidenceItems(route, result.profile, dataset);
    const career = dataset.careers.find((c) => c.id === route.careerId);
    return {
      routeId: route.id,
      routeName: { en: route.nameEn, ja: route.nameJa },
      kind: route.kind,
      score: route.scores.expected,
      eligibility,
      confidence,
      summary: summarize(route, eligibility, unverified, rank),
      positiveFactors: positives,
      risks,
      blockers,
      scoreBreakdown: buildScoreBreakdown(route),
      ...evidence,
      nextActions: buildNextActions(blockers, route),
      evidenceCoverage: { verified, total: blockers.length },
      isDemo: route.evidence === 'weak',
      timeMonths: route.monthsToJob,
      totalCostJpy: route.totalCostJpy,
      jlptRequirement: jlptRequirementText(route, dataset),
      firstCareer: career ? { en: career.levels[0]?.titleEn ?? career.nameEn, ja: career.levels[0]?.titleJa ?? career.nameJa } : NOT_VERIFIED,
    };
  });

  const recommended = routes.find((r) => r.eligibility !== 'not_currently_eligible' && r.eligibility !== 'unknown') ?? null;

  return {
    routes,
    recommendedRouteId: recommended ? recommended.routeId : null,
    closeCall: result.closeCall,
    generatedAt: result.generatedAt,
    engineVersion: result.engineVersion,
  };
}
