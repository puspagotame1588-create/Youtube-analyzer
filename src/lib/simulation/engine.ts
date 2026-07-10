/**
 * Deterministic route generation. Pure functions over the verified dataset —
 * no AI, no network, no randomness.
 */

import type { CareerProfile, Dataset, School } from '@/lib/data/types';
import { computeFactors, effectiveJlpt, totalScore } from './scoring';
import {
  CLOSE_CALL_MARGIN,
  DEFAULT_WEIGHTS,
  ENGINE_VERSION,
  JLPT_ORDER,
  type Assumption,
  type CaseName,
  type EvidenceStrength,
  type Feasibility,
  type FactorWeights,
  type Milestone,
  type RouteKind,
  type SimProfile,
  type SimRoute,
  type SimulationResult,
  type UncertainNumber,
} from './types';

const CASES: CaseName[] = ['conservative', 'expected', 'optimistic'];

const VISA_NOTE = {
  en: 'This route may be compatible with the information provided. Final eligibility depends on individual circumstances and official review by the Immigration Services Agency. This is general educational information, not legal advice.',
  ja: 'このルートは入力いただいた情報と両立する可能性があります。最終的な可否は個別の事情と出入国在留管理庁の審査によります。これは一般的な教育情報であり、法的助言ではありません。',
};

/** Pick the best school for a field/kind: field match, then budget fit, then location. */
export function pickSchool(
  dataset: Dataset,
  kind: 'university' | 'vocational',
  profile: SimProfile,
): School | undefined {
  const candidates = dataset.schools
    .filter((s) => s.institutionType === kind && s.fields.includes(profile.field))
    .filter((s) => s.provenance.verification === 'published');
  if (candidates.length === 0) return undefined;
  const budget = profile.budgetJpy.expected;
  return [...candidates].sort((a, b) => {
    const total = (s: School): number =>
      s.firstYearCostJpy + s.annualTuitionJpy * (s.programYears - 1);
    const overA = Math.max(0, total(a) - budget);
    const overB = Math.max(0, total(b) - budget);
    if (overA !== overB) return overA - overB;
    const locA = a.city === profile.location ? 0 : 1;
    const locB = b.city === profile.location ? 0 : 1;
    if (locA !== locB) return locA - locB;
    return total(a) - total(b);
  })[0];
}

export function careerForField(dataset: Dataset, field: SimProfile['field']): CareerProfile {
  const career = dataset.careers.find((c) => c.field === field);
  if (!career) throw new Error(`No career profile seeded for field: ${field}`);
  return career;
}

function educationCost(school: School | undefined): number {
  if (!school) return 0;
  return school.firstYearCostJpy + school.annualTuitionJpy * (school.programYears - 1);
}

/** Months of extra language study needed before the school's JLPT requirement is met. */
export function languageGapMonths(profile: SimProfile, required: (typeof JLPT_ORDER extends Record<infer K, number> ? K : never)): number {
  const have = Math.max(
    JLPT_ORDER[profile.jlptCurrent],
    profile.jlptExpected ? JLPT_ORDER[profile.jlptExpected] : 0,
  );
  const gap = JLPT_ORDER[required] - have;
  return gap > 0 ? gap * 6 : 0; // rule: ~6 months of study per JLPT step
}

function buildMilestones(
  kind: RouteKind,
  profile: SimProfile,
  school: School | undefined,
  career: CareerProfile,
  dataset: Dataset,
): { milestones: Milestone[]; monthsToJob: number } {
  const ms: Milestone[] = [];
  const src = school ? school.provenance.sourceIds : ['src-demo-manual'];
  let t = 0;
  const push = (m: Omit<Milestone, 'id'>): void => {
    ms.push({ ...m, id: `m-${kind}-${ms.length}` });
  };

  push({
    kind: 'now',
    titleEn: 'Now — Japanese-language school',
    titleJa: '現在 — 日本語学校在籍',
    detailEn: 'Your current position. Attendance and study records matter for every next step.',
    detailJa: '現在地。出席率と学習記録はすべての次のステップで重要です。',
    monthOffset: 0,
    sourceIds: src,
  });

  const gapMonths = school ? languageGapMonths(profile, school.jlptRequired) : 0;
  if (gapMonths > 0 && school) {
    t += gapMonths;
    push({
      kind: 'jlpt',
      titleEn: `Reach JLPT ${school.jlptRequired.toUpperCase()}`,
      titleJa: `JLPT ${school.jlptRequired.toUpperCase()} に到達`,
      detailEn: `${school.nameEn} requires ${school.jlptRequired.toUpperCase()}. Estimated ${gapMonths} months of additional study (rule: ~6 months per level).`,
      detailJa: `${school.nameJa}は${school.jlptRequired.toUpperCase()}が必要です。追加学習の目安は${gapMonths}か月（1レベルあたり約6か月のルール）。`,
      monthOffset: t,
      riskFlag: {
        en: 'If the JLPT result comes later than planned, the application window may be missed.',
        ja: 'JLPTの結果が遅れると出願期間を逃す可能性があります。',
      },
      sourceIds: src,
    });
  }

  if (kind !== 'employment' && school) {
    t += 3;
    push({
      kind: 'application-deadline',
      titleEn: `Apply to ${school.nameEn}`,
      titleJa: `${school.nameJa}に出願`,
      detailEn: `Application months: ${school.applicationMonths.join(', ')}. ${school.ejuRequired ? 'EJU required.' : 'No EJU required.'}`,
      detailJa: `出願月: ${school.applicationMonths.join('、')}月。${school.ejuRequired ? 'EJUが必要です。' : 'EJUは不要です。'}`,
      monthOffset: t,
      sourceIds: src,
    });
    t += 3;
    push({
      kind: 'admission',
      titleEn: 'Admission decision',
      titleJa: '合格発表',
      detailEn: 'On admission, prepare the residence-status extension for study.',
      detailJa: '合格後、就学継続のための在留資格の更新を準備します。',
      monthOffset: t,
      sourceIds: src,
    });
    push({
      kind: 'tuition-payment',
      titleEn: `First-year payment ¥${school.firstYearCostJpy.toLocaleString()}`,
      titleJa: `初年度納入金 ¥${school.firstYearCostJpy.toLocaleString()}`,
      detailEn: 'Admission + first-year tuition and facility fees.',
      detailJa: '入学金と初年度の授業料・施設費。',
      monthOffset: t + 1,
      costJpy: school.firstYearCostJpy,
      sourceIds: src,
    });
    const scholarships = dataset.scholarships.filter((sc) => school.scholarshipIds.includes(sc.id));
    if (scholarships.length > 0) {
      push({
        kind: 'scholarship',
        titleEn: `Scholarship window (${scholarships.length} matching)`,
        titleJa: `奨学金の申請時期（該当${scholarships.length}件）`,
        detailEn: scholarships.map((s) => s.nameEn).join(' / '),
        detailJa: scholarships.map((s) => s.nameJa).join('／'),
        monthOffset: t + 2,
        sourceIds: scholarships.flatMap((s) => s.provenance.sourceIds),
      });
    }
    const years = school.programYears;
    push({
      kind: 'internship',
      titleEn: 'Internship / part-time in your field',
      titleJa: '専攻分野でのインターン・アルバイト',
      detailEn: 'Within the 28h/week permission. Field experience strongly improves first-job outcomes.',
      detailJa: '週28時間の資格外活動の範囲内で。分野での経験は初職の結果を大きく改善します。',
      monthOffset: t + 12 * (years - 1),
      sourceIds: src,
    });
    t += 12 * years;
    push({
      kind: 'graduation',
      titleEn: `Graduate (${years}-year program)`,
      titleJa: `卒業（${years}年課程）`,
      detailEn: kind === 'vocational' ? 'Diploma (専門士) awarded.' : 'Bachelor degree awarded.',
      detailJa: kind === 'vocational' ? '専門士の称号が付与されます。' : '学士号が授与されます。',
      monthOffset: t,
      sourceIds: src,
    });
    push({
      kind: 'visa-transition',
      titleEn: 'Change of status: Student → work status',
      titleJa: '在留資格変更：留学 → 就労資格',
      detailEn: `${career.levels[0]?.visaNoteEn ?? ''} Individual review always applies.`,
      detailJa: `${career.levels[0]?.visaNoteJa ?? ''} 常に個別審査があります。`,
      monthOffset: t + 1,
      riskFlag: {
        en: 'Job offer and job duties must match the status requirements; timing near graduation is critical.',
        ja: '内定内容と職務が資格要件に合致する必要があります。卒業前後のタイミングが重要です。',
      },
      sourceIds: [...src, 'src-isa-status'],
    });
    t += 2;
  } else {
    // direct employment after language school
    t += 6;
    push({
      kind: 'jlpt',
      titleEn: `Job hunting from JLPT ${effectiveJlpt(profile, 'expected').toUpperCase()}`,
      titleJa: `JLPT ${effectiveJlpt(profile, 'expected').toUpperCase()}で就職活動`,
      detailEn: 'Direct job hunting during language school. Interview Japanese matters most.',
      detailJa: '日本語学校在籍中の就職活動。面接での日本語が最も重要です。',
      monthOffset: t,
      sourceIds: src,
    });
    push({
      kind: 'visa-transition',
      titleEn: 'Status change required before starting work',
      titleJa: '就労開始前に在留資格の変更が必要',
      detailEn: `${career.levels[0]?.visaNoteEn ?? ''} Without a degree or 専門士, options are limited for this field. Individual review always applies.`,
      detailJa: `${career.levels[0]?.visaNoteJa ?? ''} 学位や専門士がない場合、この分野の選択肢は限られます。常に個別審査があります。`,
      monthOffset: t + 2,
      riskFlag: {
        en: 'This is the highest-risk step of the direct-employment route.',
        ja: '直接就職ルートで最もリスクの高いステップです。',
      },
      sourceIds: [...src, 'src-isa-status'],
    });
    t += 3;
  }

  push({
    kind: 'first-job',
    titleEn: `First job: ${career.levels[0]?.titleEn ?? career.nameEn}`,
    titleJa: `初職：${career.levels[0]?.titleJa ?? career.nameJa}`,
    detailEn: 'Entry salary ranges are demonstration data unless marked verified.',
    detailJa: '初任給レンジは、検証済みの表示がない限りデモデータです。',
    monthOffset: t,
    sourceIds: career.provenance.sourceIds,
  });

  const l3 = career.levels[1];
  push({
    kind: 'career-3y',
    titleEn: `~3 years: ${l3?.titleEn ?? 'experienced role'}`,
    titleJa: `約3年後：${l3?.titleJa ?? '中堅ポジション'}`,
    detailEn: l3 ? `${l3.skillsEn.join(', ')} — typical JLPT ${l3.jlptTypical.toUpperCase()}.` : '',
    detailJa: l3 ? `${l3.skillsJa.join('、')} — 目安JLPT ${l3.jlptTypical.toUpperCase()}。` : '',
    monthOffset: t + 36,
    sourceIds: career.provenance.sourceIds,
  });
  const l5 = career.levels[2] ?? career.levels[career.levels.length - 1];
  push({
    kind: 'career-5y',
    titleEn: `~5 years+: ${l5?.titleEn ?? 'senior role'}`,
    titleJa: `約5年以降：${l5?.titleJa ?? '上級ポジション'}`,
    detailEn: l5?.obstaclesEn ?? '',
    detailJa: l5?.obstaclesJa ?? '',
    monthOffset: t + 60,
    sourceIds: career.provenance.sourceIds,
  });
  push({
    kind: 'settlement',
    titleEn: 'Long-term settlement stage',
    titleJa: '長期定住ステージ',
    detailEn:
      'Stable residence-status history, income, and contributions are commonly considered in long-term applications. General information — individual review applies; consult a qualified professional for your case.',
    detailJa:
      '安定した在留歴・収入・納付状況は長期在留の申請で一般的に考慮されます。一般情報であり個別審査があります。具体的な判断は専門家にご相談ください。',
    monthOffset: t + 72,
    sourceIds: ['src-isa-status'],
  });

  return { milestones: ms, monthsToJob: t };
}

function totalCost(school: School | undefined, kind: RouteKind): UncertainNumber {
  if (kind === 'employment' || !school) {
    return { min: 0, expected: 0, max: 100_000 }; // exam fees, applications
  }
  const base = educationCost(school);
  return { min: Math.round(base * 0.85), expected: base, max: Math.round(base * 1.1) };
  // min assumes a typical scholarship offset; max adds fee increases/materials
}

function feasibilityOf(conservativeScore: number): Feasibility {
  if (conservativeScore >= 65) return 'high';
  if (conservativeScore >= 45) return 'medium';
  return 'low';
}

function evidenceOf(school: School | undefined, career: CareerProfile): EvidenceStrength {
  const records = [school?.provenance, career.provenance].filter(Boolean);
  const demoCount = records.filter((p) => p && p.isDemo).length;
  if (records.length === 0) return 'weak';
  if (demoCount === records.length) return 'weak'; // all demonstration data
  if (demoCount > 0) return 'moderate';
  return 'strong';
}

function freshnessOf(school: School | undefined, career: CareerProfile): string {
  const dates = [school?.provenance.lastVerified, career.provenance.lastVerified].filter(
    (d): d is string => Boolean(d),
  );
  return dates.sort()[0] ?? 'unknown';
}

function buildAssumptions(profile: SimProfile, kind: RouteKind): Assumption[] {
  const a: Assumption[] = [
    {
      id: 'as-budget',
      labelEn: 'Education budget',
      labelJa: '教育予算',
      value: `¥${profile.budgetJpy.expected.toLocaleString()}`,
      origin: 'user',
    },
    {
      id: 'as-jlpt',
      labelEn: 'Japanese level',
      labelJa: '日本語レベル',
      value:
        profile.jlptCurrent.toUpperCase() +
        (profile.jlptExpected ? ` → ${profile.jlptExpected.toUpperCase()} (expected)` : ''),
      origin: 'user',
    },
    {
      id: 'as-jlpt-growth',
      labelEn: 'Language growth during study',
      labelJa: '在学中の日本語力の伸び',
      value: kind === 'university' ? '+2 JLPT steps over 4 years' : kind === 'vocational' ? '+1 JLPT step over 2 years' : 'no additional growth assumed',
      origin: 'default',
    },
    {
      id: 'as-parttime',
      labelEn: 'Part-time income covers living costs',
      labelJa: 'アルバイト収入で生活費を賄う',
      value: 'within the 28h/week permission',
      origin: 'default',
    },
  ];
  return a;
}

export interface SimulateOptions {
  weights?: FactorWeights;
  now?: string;
}

export function simulate(
  profile: SimProfile,
  dataset: Dataset,
  options: SimulateOptions = {},
): SimulationResult {
  const weights = options.weights ?? DEFAULT_WEIGHTS;
  const career = careerForField(dataset, profile.field);

  const kinds: RouteKind[] = ['university', 'vocational', 'employment'];
  const routes: SimRoute[] = [];

  for (const kind of kinds) {
    const school =
      kind === 'employment' ? undefined : pickSchool(dataset, kind, profile);
    if (kind !== 'employment' && !school) continue;

    const cost = totalCost(school, kind);
    const routeCity = school?.city ?? (profile.location === 'kanto-any' ? 'tokyo' : profile.location);
    const { milestones, monthsToJob } = buildMilestones(kind, profile, school, career, dataset);

    const scores = {} as Record<CaseName, number>;
    for (const c of CASES) {
      // Conservative case assumes the high end of costs; optimistic the low end.
      const costForCase =
        c === 'conservative' ? cost.max : c === 'optimistic' ? cost.min : cost.expected;
      const breakdown = computeFactors(
        { profile, career, kind, school, totalEducationCost: costForCase, routeCity },
        weights,
        c,
      );
      scores[c] = totalScore(breakdown);
    }
    const breakdown = computeFactors(
      { profile, career, kind, school, totalEducationCost: cost.expected, routeCity },
      weights,
      'expected',
    );

    const names: Record<RouteKind, { en: string; ja: string }> = {
      university: {
        en: school ? `University route — ${school.nameEn}` : 'University route',
        ja: school ? `大学進学ルート — ${school.nameJa}` : '大学進学ルート',
      },
      vocational: {
        en: school ? `Vocational route — ${school.nameEn}` : 'Vocational route',
        ja: school ? `専門学校ルート — ${school.nameJa}` : '専門学校ルート',
      },
      employment: {
        en: 'Direct employment route',
        ja: '直接就職ルート',
      },
    };

    const missingEn: string[] = [];
    const missingJa: string[] = [];
    if (!profile.desiredSalaryJpy) {
      missingEn.push('Desired salary — salary scoring used a neutral baseline.');
      missingJa.push('希望給与が未入力のため、給与スコアは中立的な基準を使用しました。');
    }
    if (profile.budgetJpy.min !== profile.budgetJpy.max) {
      missingEn.push('Budget is a range — conservative and optimistic cases differ.');
      missingJa.push('予算に幅があるため、保守的ケースと楽観的ケースで結果が異なります。');
    }

    routes.push({
      id: `route-${kind}`,
      kind,
      nameEn: names[kind].en,
      nameJa: names[kind].ja,
      field: profile.field,
      schoolIds: school ? [school.id] : [],
      careerId: career.id,
      monthsToJob,
      totalCostJpy: cost,
      salaryRangeJpy: {
        min: career.levels[0]?.salaryJpy.min ?? 0,
        max: career.levels[0]?.salaryJpy.max ?? 0,
        isDemo: career.levels[0]?.salaryJpy.isDemo ?? true,
      },
      milestones,
      scores,
      breakdown,
      feasibility: feasibilityOf(scores.conservative),
      evidence: evidenceOf(school, career),
      dataFreshness: freshnessOf(school, career),
      assumptions: buildAssumptions(profile, kind),
      missingInfoEn: missingEn,
      missingInfoJa: missingJa,
      whatWouldChangeEn: [
        'A higher confirmed JLPT level raises employment feasibility.',
        'A larger confirmed budget raises affordability.',
        'Scholarship awards reduce the effective cost of study routes.',
      ],
      whatWouldChangeJa: [
        'JLPTの上位級の取得は就職実現性を高めます。',
        '確定した予算の増加は費用適合度を高めます。',
        '奨学金の獲得は進学ルートの実質費用を下げます。',
      ],
      labels: [],
      visaNote: VISA_NOTE,
      sourceIds: [
        ...(school?.provenance.sourceIds ?? []),
        ...career.provenance.sourceIds,
      ].filter((v, i, arr) => arr.indexOf(v) === i),
    });
  }

  // Labels
  const byExpected = [...routes].sort((a, b) => b.scores.expected - a.scores.expected);
  const byConservative = [...routes].sort((a, b) => b.scores.conservative - a.scores.conservative);
  const bySpeed = [...routes].sort((a, b) => a.monthsToJob - b.monthsToJob);
  const byOptimistic = [...routes].sort((a, b) => b.scores.optimistic - a.scores.optimistic);
  byExpected[0]?.labels.push('best-overall');
  byConservative[0]?.labels.push('safest');
  bySpeed[0]?.labels.push('fastest');
  byOptimistic[0]?.labels.push('long-term');

  const closeCall =
    byExpected.length >= 2 &&
    byExpected[0] !== undefined &&
    byExpected[1] !== undefined &&
    byExpected[0].scores.expected - byExpected[1].scores.expected <= CLOSE_CALL_MARGIN;

  return {
    routes: byExpected,
    closeCall,
    closeCallMargin: CLOSE_CALL_MARGIN,
    weights,
    profile,
    generatedAt: options.now ?? new Date().toISOString(),
    engineVersion: ENGINE_VERSION,
  };
}
