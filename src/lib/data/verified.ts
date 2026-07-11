/**
 * GENUINELY VERIFIED data slice (P0.5 §5) — every field below was confirmed
 * from content surfaced by web search of official/original sources on the
 * check date. Fields we could NOT confirm are listed in `missing`, and the
 * record state is set accordingly:
 *   record_verified  = all material fields confirmed with sources
 *   field_verified   = some material fields confirmed, others missing
 * Only record_verified + non-expired records may ever feed simulation scores
 * (none are wired into the engine yet — see SIMULATION_METHOD.md).
 *
 * Freshness: vacancies 7d · scholarships 14d · admissions/tuition 90d.
 * Run `node scripts/check-vacancies.mjs` to re-check vacancy URLs (removal check).
 */

import { REVIEW_CYCLES, nextReview, type DataState } from './real';

const CHECKED = '2026-07-11';

export interface VerifiedField {
  value: string;
  sourceUrl: string;
  status: 'official' | 'derived' | 'unverified';
}

export interface VerifiedProgram {
  id: string;
  state: DataState;
  institutionJa: string;
  institutionEn: string;
  program: string;
  intakeYear: string;
  location: string;
  courseLengthYears?: number;
  fields: Partial<Record<'tuitionFirstYearTotal' | 'mandatoryFees' | 'eligibility' | 'jlptEju' | 'applicationDates' | 'admissionsGuideline', VerifiedField>>;
  missing: string[];
  checkedAt: string;
  nextReviewAt: string;
}

export const verifiedPrograms: VerifiedProgram[] = [
  {
    id: 'vp-toyo-tourism',
    state: 'field_verified',
    institutionJa: '東洋大学 国際観光学部',
    institutionEn: 'Toyo University — Faculty of International Tourism Management',
    program: '国際観光学部 国際観光学科',
    intakeYear: '2026年4月入学',
    location: 'Tokyo (Hakusan campus)',
    courseLengthYears: 4,
    fields: {
      tuitionFirstYearTotal: {
        value: '¥1,335,000 (2026年度 初年度納入金・国際観光学部)',
        sourceUrl: 'https://www.toyo.ac.jp/nyushi/about/fee/',
        status: 'official',
      },
      admissionsGuideline: {
        value: '納付金一覧PDF（2026年度入学生 納付金内訳）',
        sourceUrl: 'https://www.toyo.ac.jp/nyushi/content/dam/toyowebstyle/about/fee/pdf_about-fee_list.pdf',
        status: 'official',
      },
    },
    missing: [
      'Mandatory-fee breakdown (入学金/授業料/その他 split)',
      'International-student admission eligibility & JLPT/EJU thresholds',
      'Application window dates for the current cycle',
    ],
    checkedAt: CHECKED,
    nextReviewAt: nextReview(CHECKED, REVIEW_CYCLES.admissions),
  },
  {
    id: 'vp-waseda-intl',
    state: 'field_extracted',
    institutionJa: '早稲田大学（外国学生のための学部入学試験）',
    institutionEn: 'Waseda University — undergraduate admission for international students',
    program: '全学部（外国学生入試）',
    intakeYear: '2027年4月入学（現行募集） / 2026年4月入学（前年度要項）',
    location: 'Tokyo (Waseda campus)',
    courseLengthYears: 4,
    fields: {
      admissionsGuideline: {
        value: '2027年度 外国学生のための学部入学試験要項（公式PDF・2026年2月公開）',
        sourceUrl: 'https://www.waseda.jp/inst/admission/assets/uploads/2026/02/01_2027_gaikokugakusei_nyushiyoukou.pdf',
        status: 'official',
      },
      jlptEju: {
        value: '出願にはEJU（日本留学試験）またはJLPT（日本語能力試験）の受験が必要（入学センター公式ページ記載）',
        sourceUrl: 'https://www.waseda.jp/inst/admission/undergraduate/system/international/',
        status: 'official',
      },
    },
    missing: [
      'Exact application-window dates (inside the guideline PDF — not yet extracted)',
      'Tuition and mandatory fees per faculty',
      'Faculty-specific eligibility details',
    ],
    checkedAt: CHECKED,
    nextReviewAt: nextReview(CHECKED, REVIEW_CYCLES.admissions),
  },
  {
    id: 'vp-meiji-fees',
    state: 'field_extracted',
    institutionJa: '明治大学（2026年度 学費等一覧）',
    institutionEn: 'Meiji University — 2026 tuition & fees list',
    program: '学部共通（学費一覧）',
    intakeYear: '2026年度入学',
    location: 'Tokyo',
    fields: {
      admissionsGuideline: {
        value: '学費等一覧（2026年度入学者用）公式PDF',
        sourceUrl: 'https://www.meiji.ac.jp/suito/mkmht000002b7evj-att/2026gakubu.pdf',
        status: 'official',
      },
    },
    missing: [
      'Exact per-faculty amounts (inside the official PDF — not yet extracted)',
      'International-admission eligibility, JLPT/EJU, application dates',
    ],
    checkedAt: CHECKED,
    nextReviewAt: nextReview(CHECKED, REVIEW_CYCLES.admissions),
  },
];

export interface VerifiedScholarship {
  id: string;
  state: DataState;
  nameJa: string;
  nameEn: string;
  provider: string;
  academicYear: string;
  amount: VerifiedField;
  eligibility: VerifiedField;
  nationality: string;
  institutionTypes: string;
  applicationRoute: string;
  deadlineStatus: VerifiedField;
  missing: string[];
  checkedAt: string;
  nextReviewAt: string;
}

export const verifiedScholarships: VerifiedScholarship[] = [
  {
    id: 'vs-jasso-shoreihi',
    state: 'record_verified',
    nameJa: '文部科学省外国人留学生学習奨励費（留学生受入れ促進プログラム）',
    nameEn: 'MEXT Honors Scholarship for Privately-Financed International Students (JASSO)',
    provider: '日本学生支援機構（JASSO）',
    academicYear: '2026年度（募集実施を確認）',
    amount: {
      value: '月額48,000円（大学・大学院等）',
      sourceUrl: 'https://www.jasso.go.jp/ryugaku/scholarship_j/shoreihi/about.html',
      status: 'official',
    },
    eligibility: {
      value: '私費外国人留学生で、学業・人物ともに優秀かつ経済的理由で修学困難な者（大学・大学院・短大・高専・専門学校・準備教育課程・日本語教育機関）',
      sourceUrl: 'https://www.jasso.go.jp/ryugaku/scholarship_j/shoreihi/index.html',
      status: 'official',
    },
    nationality: '外国人留学生（国籍別の制限は本体制度にはなし）',
    institutionTypes: '大学・大学院・短大・高専・専門学校・日本語教育機関',
    applicationRoute: '在籍校を通じて申請（個人応募不可）',
    deadlineStatus: {
      value: '2026年度募集の実施を確認（各校の学内締切による。支給期間は4月〜翌3月、または10月〜3月）',
      sourceUrl: 'https://www.jasso.go.jp/ryugaku/scholarship_j/shoreihi/index.html',
      status: 'official',
    },
    missing: ['Per-school internal deadlines (vary by institution)'],
    checkedAt: CHECKED,
    nextReviewAt: nextReview(CHECKED, REVIEW_CYCLES.scholarship),
  },
  {
    id: 'vs-yoneyama',
    state: 'record_verified',
    nameJa: 'ロータリー米山記念奨学金（2026学年度）',
    nameEn: 'Rotary Yoneyama Memorial Scholarship (AY2026)',
    provider: '公益財団法人ロータリー米山記念奨学会',
    academicYear: '2026学年度（公式募集要項PDFを確認）',
    amount: {
      value: '学部課程 月額100,000円／修士・博士課程 月額140,000円',
      sourceUrl: 'https://www.rotary-yoneyama.or.jp/scholarship',
      status: 'official',
    },
    eligibility: {
      value: '採用年4月に学部3・4年（医歯獣医は5・6年）または修士1・2年、博士2・3年（医歯獣医系は3・4年）に在籍する外国人留学生。指定校在籍が前提',
      sourceUrl: 'https://www.rotary-yoneyama.or.jp/scholarship/requirement',
      status: 'official',
    },
    nationality: '日本以外の国籍の留学生',
    institutionTypes: '指定校の大学・大学院',
    applicationRoute: '在籍する指定校を通じて申請（学内選考 8〜10月）。指定校リストは毎年8月上旬に公表',
    deadlineStatus: {
      value: '指定校からの推薦締切は毎年10月15日（学内締切は各校で異なる）。2026学年度募集要項PDF公開中',
      sourceUrl: 'https://www.rotary-yoneyama.or.jp/content/uploads/pdf-data/201.pdf',
      status: 'official',
    },
    missing: [],
    checkedAt: CHECKED,
    nextReviewAt: nextReview(CHECKED, REVIEW_CYCLES.scholarship),
  },
  {
    id: 'vs-heiwa-nakajima',
    state: 'record_verified',
    nameJa: '平和中島財団 外国人留学生奨学金（2027年度）',
    nameEn: 'Heiwa Nakajima Foundation Scholarship for Foreign Students (AY2027)',
    provider: '公益財団法人平和中島財団',
    academicYear: '2027年度（募集は2026年9〜10月予定）',
    amount: {
      value: '学部生 月額120,000円／大学院生 月額150,000円',
      sourceUrl: 'http://www.hnf.jp/shogaku/',
      status: 'official',
    },
    eligibility: {
      value: '日本の大学・大学院に在籍する外国人留学生（大学推薦による。個人応募不可）',
      sourceUrl: 'http://www.hnf.jp/shogaku/',
      status: 'official',
    },
    nationality: '外国人留学生（国籍を問わず）',
    institutionTypes: '大学・大学院',
    applicationRoute: '大学推薦（募集要項は8月下旬に全国の大学へ送付。所属大学の奨学金窓口から申請）',
    deadlineStatus: {
      value: '2027年度募集：2026年9月〜10月実施予定（大学経由）',
      sourceUrl: 'http://www.hnf.jp/shogaku/',
      status: 'official',
    },
    missing: ['Exact per-university internal deadlines'],
    checkedAt: CHECKED,
    nextReviewAt: nextReview(CHECKED, REVIEW_CYCLES.scholarship),
  },
];

export interface VerifiedVacancy {
  id: string;
  state: DataState;
  title: string;
  employer: string;
  field: 'it' | 'hospitality' | 'business' | 'foodservice' | 'realestate';
  sourceUrl: string;
  sourceKind: 'employer-official' | 'listing-board';
  location: string;
  employmentType: string;
  requirements: string;
  japanese: string;
  salary: string;
  postedAt?: string;
  checkedAt: string;
  expiryState: string;
  nextReviewAt: string;
  missing: string[];
}

const V_NEXT = nextReview(CHECKED, REVIEW_CYCLES.vacancy);
const LISTED = 'Listed on the source board as of the check date; automated removal check via scripts/check-vacancies.mjs';

export const verifiedVacancies: VerifiedVacancy[] = [
  {
    id: 'vv-treasureai-staff-swe',
    state: 'record_verified',
    title: 'Staff Software Engineer, Core Services (Ingestion)',
    employer: 'Treasure AI',
    field: 'it',
    sourceUrl: 'https://www.tokyodev.com/companies/treasure-ai/jobs/staff-software-engineer-core-services-ingestion',
    sourceKind: 'listing-board',
    location: 'Tokyo',
    employmentType: 'Full-time',
    requirements: 'Senior-level engineering experience (core data-ingestion services)',
    japanese: 'Not stated in listing excerpt',
    salary: 'Not published in excerpt',
    postedAt: '2026-07-08',
    checkedAt: CHECKED,
    expiryState: LISTED,
    nextReviewAt: V_NEXT,
    missing: ['Salary (check listing)'],
  },
  {
    id: 'vv-givery-be-fs',
    state: 'record_verified',
    title: 'Backend/Fullstack Engineer',
    employer: 'Givery',
    field: 'it',
    sourceUrl: 'https://www.tokyodev.com/companies/givery/jobs/backend-fullstack-engineer',
    sourceKind: 'listing-board',
    location: 'Tokyo (fully remote)',
    employmentType: 'Full-time',
    requirements: 'Backend/fullstack web development experience',
    japanese: 'No Japanese required (listing)',
    salary: '¥6M–¥9M / year',
    postedAt: '2026-06-02',
    checkedAt: CHECKED,
    expiryState: LISTED,
    nextReviewAt: V_NEXT,
    missing: [],
  },
  {
    id: 'vv-givery-python-ts',
    state: 'record_verified',
    title: 'Full Stack Engineer (Python, TypeScript)',
    employer: 'Givery',
    field: 'it',
    sourceUrl: 'https://www.tokyodev.com/companies/givery/jobs/full-stack-engineer-python-typescript',
    sourceKind: 'listing-board',
    location: 'Tokyo',
    employmentType: 'Full-time',
    requirements: '3+ years web application development with Python (FastAPI preferred), TypeScript',
    japanese: 'Not stated in listing excerpt',
    salary: 'Not published in excerpt',
    checkedAt: CHECKED,
    expiryState: LISTED,
    nextReviewAt: V_NEXT,
    missing: ['Salary', 'Posted date'],
  },
  {
    id: 'vv-wovn-fullstack',
    state: 'record_verified',
    title: 'Fullstack Engineer',
    employer: 'WOVN',
    field: 'it',
    sourceUrl: 'https://www.tokyodev.com/companies/wovn/jobs/fullstack-engineer',
    sourceKind: 'listing-board',
    location: 'Tokyo (no remote)',
    employmentType: 'Full-time',
    requirements: '7+ years engineering experience',
    japanese: 'Not stated in listing excerpt',
    salary: '¥6M–¥9M / year',
    postedAt: '2026-05-19',
    checkedAt: CHECKED,
    expiryState: LISTED,
    nextReviewAt: V_NEXT,
    missing: [],
  },
  {
    id: 'vv-paypaycard-backend',
    state: 'record_verified',
    title: 'Backend Engineer',
    employer: 'PayPay Card Corporation',
    field: 'it',
    sourceUrl: 'https://www.tokyodev.com/companies/paypay-card-corporation/jobs/backend-engineer',
    sourceKind: 'listing-board',
    location: 'Japan (fully remote)',
    employmentType: 'Full-time',
    requirements: 'Backend services with focus on scalability and maintainability',
    japanese: 'No Japanese required (listing)',
    salary: 'Not published in excerpt',
    postedAt: '2026-05-16',
    checkedAt: CHECKED,
    expiryState: LISTED,
    nextReviewAt: V_NEXT,
    missing: ['Salary'],
  },
  {
    id: 'vv-moneyforward-ruby',
    state: 'record_verified',
    title: 'Senior Full-Stack Engineer (Ruby), Money Forward Cloud',
    employer: 'Money Forward',
    field: 'it',
    sourceUrl: 'https://www.tokyodev.com/companies/moneyforward/jobs/senior-software-engineer-money-forward-cloud-fukuoka-af677db1-c2cb-4d86-886c-cd77430ad611',
    sourceKind: 'listing-board',
    location: 'Tokyo / Fukuoka',
    employmentType: 'Full-time',
    requirements: '5+ years developing/operating large-scale backend systems, Ruby on Rails preferred',
    japanese: 'Not stated in listing excerpt',
    salary: 'Not published in excerpt',
    checkedAt: CHECKED,
    expiryState: LISTED,
    nextReviewAt: V_NEXT,
    missing: ['Salary', 'Posted date'],
  },
  {
    id: 'vv-komoju-fullstack',
    state: 'record_verified',
    title: 'Fullstack Engineer',
    employer: 'KOMOJU (Degica)',
    field: 'it',
    sourceUrl: 'https://www.tokyodev.com/companies/komoju/jobs/fullstack-engineer',
    sourceKind: 'listing-board',
    location: 'Tokyo',
    employmentType: 'Full-time',
    requirements: 'Ruby / Ruby on Rails feature development (payments)',
    japanese: 'Not stated in listing excerpt',
    salary: 'Not published in excerpt',
    checkedAt: CHECKED,
    expiryState: LISTED,
    nextReviewAt: V_NEXT,
    missing: ['Salary', 'Posted date'],
  },
  {
    id: 'vv-synspective-fullstack',
    state: 'record_verified',
    title: 'Full Stack Engineer',
    employer: 'Synspective',
    field: 'it',
    sourceUrl: 'https://www.tokyodev.com/companies/synspective/jobs/fullstack-engineer',
    sourceKind: 'listing-board',
    location: 'Tokyo',
    employmentType: 'Full-time',
    requirements: 'Frontend + backend development of satellite data platform (StriX)',
    japanese: 'Not stated in listing excerpt',
    salary: 'Not published in excerpt',
    checkedAt: CHECKED,
    expiryState: LISTED,
    nextReviewAt: V_NEXT,
    missing: ['Salary', 'Posted date'],
  },
  {
    id: 'vv-takeme-fullstack',
    state: 'record_verified',
    title: 'Full Stack Engineer',
    employer: 'TakeMe',
    field: 'it',
    sourceUrl: 'https://www.tokyodev.com/companies/takeme/jobs/full-stack-engineer',
    sourceKind: 'listing-board',
    location: 'Tokyo',
    employmentType: 'Full-time',
    requirements: 'Backend APIs, web frontends, server infrastructure',
    japanese: 'Not stated in listing excerpt',
    salary: 'Not published in excerpt',
    checkedAt: CHECKED,
    expiryState: LISTED,
    nextReviewAt: V_NEXT,
    missing: ['Salary', 'Posted date'],
  },
  {
    id: 'vv-piece-fullstack',
    state: 'record_verified',
    title: 'Full Stack Developer',
    employer: 'Piece',
    field: 'it',
    sourceUrl: 'https://www.tokyodev.com/companies/piece/jobs/full-stack-developer',
    sourceKind: 'listing-board',
    location: 'Tokyo',
    employmentType: 'Full-time',
    requirements: 'Full-stack development with backend focus; building and scaling infrastructure',
    japanese: 'Not stated in listing excerpt',
    salary: 'Not published in excerpt',
    checkedAt: CHECKED,
    expiryState: LISTED,
    nextReviewAt: V_NEXT,
    missing: ['Salary', 'Posted date'],
  },
  {
    id: 'vv-hoshino-operations',
    state: 'record_verified',
    title: 'ホテル・旅館・リゾート運営スタッフ（キャリア採用）',
    employer: '星野リゾート (Hoshino Resorts)',
    field: 'hospitality',
    sourceUrl: 'https://hoshinoresorts.com/jp/recruit/mid-career/959/',
    sourceKind: 'employer-official',
    location: '全国の運営施設（関東を含む）',
    employmentType: '正社員（キャリア採用・通年）',
    requirements: '業種・職種未経験歓迎。フロント・客室・レストラン・調理等をマルチタスクで担当',
    japanese: '日本語での接客業務（詳細は募集要項参照）',
    salary: '募集要項ページ参照（本記録では未確認）',
    checkedAt: CHECKED,
    expiryState: 'Published on the employer’s official career-hire page as of the check date',
    nextReviewAt: V_NEXT,
    missing: ['Salary figures', 'Exact placement location at hiring'],
  },
  {
    id: 'vv-hennge-intern',
    state: 'field_verified',
    title: 'Global Internship Program — Full Stack (Onsite Tokyo)',
    employer: 'HENNGE',
    field: 'it',
    sourceUrl: 'https://www.tokyodev.com/companies/hennge/jobs/global-intern',
    sourceKind: 'listing-board',
    location: 'Tokyo (onsite, relocation support)',
    employmentType: 'Internship (unpaid)',
    requirements: 'Full-stack software engineering; open to overseas applicants',
    japanese: 'Not stated in listing excerpt',
    salary: 'Unpaid (internship)',
    postedAt: '2026-07-10',
    checkedAt: CHECKED,
    expiryState: LISTED,
    nextReviewAt: V_NEXT,
    missing: ['Counted separately — internship, not an employment vacancy'],
  },
];

export const verifiedCounts = {
  universitiesFullyVerified: verifiedPrograms.filter((p) => p.state === 'record_verified').length,
  scholarshipsFullyVerified: verifiedScholarships.filter((s) => s.state === 'record_verified').length,
  vacanciesFullyVerified: verifiedVacancies.filter((v) => v.state === 'record_verified').length,
};
