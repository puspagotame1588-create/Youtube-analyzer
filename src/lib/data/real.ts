/**
 * REAL private-beta data slice — Kanto institutions, scholarships, and
 * official job/recruitment links.
 *
 * Rules for this file:
 * - Only official names and official URLs, verified via web search on the
 *   retrieval date. No scraping of prohibited sources.
 * - Numeric facts (tuition, requirements, amounts) are NOT stored here unless
 *   confirmed from the official page; missing information is listed instead.
 *   These records therefore do NOT feed the deterministic simulation engine —
 *   the engine continues to use the clearly-labeled demonstration dataset
 *   until each field is individually verified.
 * - Every record carries per-field data status: official | derived | unverified.
 */

export type FieldDataStatus = 'official' | 'derived' | 'unverified';

/**
 * Data lifecycle states (mission P0.5 §4). A URL-confirmed record is NOT a
 * verified simulation record — only `record_verified` + non-expired records
 * may ever influence simulation scores, and none of the records in this file
 * have reached that state yet.
 */
export type DataState =
  | 'source_discovered'
  | 'official_url_confirmed'
  | 'field_extracted'
  | 'field_verified'
  | 'record_verified'
  | 'simulation_eligible'
  | 'outdated'
  | 'archived';

/** Entity-specific review cycles (days). Never one uniform date for everything. */
export const REVIEW_CYCLES = {
  vacancy: 7,            // active vacancies: automated removal checks
  scholarship: 14,       // scholarships with open deadlines
  admissions: 90,        // school admissions/tuition during recruitment
  legal: 30,             // government/legal guidance: monthly + on official updates
  recruitPortal: 30,     // company recruitment portals (not vacancies)
  description: 180,      // general institution descriptions
} as const;

export function nextReview(retrievedAt: string, cycleDays: number): string {
  const d = new Date(retrievedAt);
  d.setDate(d.getDate() + cycleDays);
  return d.toISOString().slice(0, 10);
}

export interface RealRecordMeta {
  state: DataState;
  retrievedAt: string;
  reviewer: string;
  reviewCycleDays: number;
  nextReviewAt: string;
  /** what we do NOT yet have verified — shown in the UI */
  missingInfo: string[];
  /** how the record was verified */
  method: string;
}

const RETRIEVED = '2026-07-10';

const metaFor = (cycleDays: number): Omit<RealRecordMeta, 'missingInfo'> => ({
  state: 'official_url_confirmed',
  retrievedAt: RETRIEVED,
  reviewer: 'founder',
  reviewCycleDays: cycleDays,
  nextReviewAt: nextReview(RETRIEVED, cycleDays),
  method: 'Official site identified and confirmed via web search on the retrieval date.',
});

export interface RealSchool {
  id: string;
  institutionType: 'university' | 'vocational';
  nameJa: string;
  nameEn: string;
  city: string;
  fields: string[];
  officialUrl: string;
  urlStatus: FieldDataStatus;
  admissionsUrl?: string;
  noteEn: string;
  noteJa: string;
  meta: RealRecordMeta;
}

const SCHOOL_MISSING = [
  'Tuition and fees (verify on the official site)',
  'JLPT/EJU requirements per faculty',
  'Application deadlines for the current cycle',
  'International-student support details',
];

export const realSchools: RealSchool[] = [
  {
    id: 'real-waseda',
    institutionType: 'university',
    nameJa: '早稲田大学',
    nameEn: 'Waseda University',
    city: 'tokyo',
    fields: ['business', 'it'],
    officialUrl: 'https://www.waseda.jp/',
    urlStatus: 'official',
    admissionsUrl: 'https://www.waseda.jp/inst/admission/undergraduate/system/international/',
    noteEn: 'Large private university with dedicated international admissions and English-based programs.',
    noteJa: '外国学生入試と英語学位プログラムを持つ大規模私立大学。',
    meta: { ...metaFor(REVIEW_CYCLES.description), missingInfo: SCHOOL_MISSING },
  },
  {
    id: 'real-meiji',
    institutionType: 'university',
    nameJa: '明治大学',
    nameEn: 'Meiji University',
    city: 'tokyo',
    fields: ['business', 'realestate'],
    officialUrl: 'https://www.meiji.ac.jp/',
    urlStatus: 'official',
    noteEn: 'Major private university in central Tokyo with international student admissions.',
    noteJa: '都心にある大手私立大学。外国人留学生入試があります。',
    meta: { ...metaFor(REVIEW_CYCLES.description), missingInfo: SCHOOL_MISSING },
  },
  {
    id: 'real-toyo',
    institutionType: 'university',
    nameJa: '東洋大学',
    nameEn: 'Toyo University',
    city: 'tokyo',
    fields: ['business', 'hospitality'],
    officialUrl: 'https://www.toyo.ac.jp/',
    urlStatus: 'official',
    noteEn: 'Private university known for its international tourism management faculty.',
    noteJa: '国際観光学部で知られる私立大学。',
    meta: { ...metaFor(REVIEW_CYCLES.description), missingInfo: SCHOOL_MISSING },
  },
  {
    id: 'real-nihon',
    institutionType: 'university',
    nameJa: '日本大学',
    nameEn: 'Nihon University',
    city: 'tokyo',
    fields: ['business', 'it', 'realestate'],
    officialUrl: 'https://www.nihon-u.ac.jp/',
    urlStatus: 'official',
    admissionsUrl: 'https://www.nihon-u.ac.jp/admission_info/',
    noteEn: 'One of Japan’s largest universities, with international student selection across many faculties.',
    noteJa: '日本最大級の総合大学。多くの学部で外国人留学生選抜があります。',
    meta: { ...metaFor(REVIEW_CYCLES.description), missingInfo: SCHOOL_MISSING },
  },
  {
    id: 'real-hosei',
    institutionType: 'university',
    nameJa: '法政大学',
    nameEn: 'Hosei University',
    city: 'tokyo',
    fields: ['business', 'it'],
    officialUrl: 'https://www.hosei.ac.jp/',
    urlStatus: 'official',
    noteEn: 'Major private university in Tokyo with programs relevant to business and information fields.',
    noteJa: '経営・情報系の学部を持つ東京の大手私立大学。',
    meta: { ...metaFor(REVIEW_CYCLES.description), missingInfo: SCHOOL_MISSING },
  },
  {
    id: 'real-hal-tokyo',
    institutionType: 'vocational',
    nameJa: 'HAL東京',
    nameEn: 'HAL Tokyo',
    city: 'tokyo',
    fields: ['it'],
    officialUrl: 'https://www.hal.ac.jp/',
    urlStatus: 'official',
    noteEn: 'IT / game / CG vocational school at Shinjuku station (専門士 programs).',
    noteJa: '新宿駅前のIT・ゲーム・CG専門学校（専門士課程）。',
    meta: { ...metaFor(REVIEW_CYCLES.description), missingInfo: SCHOOL_MISSING },
  },
  {
    id: 'real-jec',
    institutionType: 'vocational',
    nameJa: '日本電子専門学校',
    nameEn: 'Japan Electronics College',
    city: 'tokyo',
    fields: ['it'],
    officialUrl: 'https://www.jec.ac.jp/',
    urlStatus: 'official',
    noteEn: 'Shinjuku vocational school with 20+ departments across IT, CG, game, and electronics; long history of accepting international students.',
    noteJa: '新宿のIT・CG・ゲーム・電子系の専門学校。留学生の受け入れ実績が長い学校です。',
    meta: { ...metaFor(REVIEW_CYCLES.description), missingInfo: SCHOOL_MISSING },
  },
  {
    id: 'real-neec',
    institutionType: 'vocational',
    nameJa: '日本工学院専門学校',
    nameEn: 'Nihon Kogakuin College',
    city: 'tokyo',
    fields: ['it', 'hospitality'],
    officialUrl: 'https://www.neec.ac.jp/',
    urlStatus: 'official',
    noteEn: 'Large vocational college group (Kamata/Hachioji) covering IT, technology, and hospitality fields.',
    noteJa: '蒲田・八王子の大規模専門学校。IT・テクノロジー・ホテル観光系の学科があります。',
    meta: { ...metaFor(REVIEW_CYCLES.description), missingInfo: SCHOOL_MISSING },
  },
  {
    id: 'real-ohara-hotel',
    institutionType: 'vocational',
    nameJa: '東京ホテル・トラベル・鉄道専門学校（大原学園）',
    nameEn: 'Tokyo Hotel, Travel & Railway College (O-hara Group)',
    city: 'tokyo',
    fields: ['hospitality'],
    officialUrl: 'https://www.o-hara.ac.jp/senmon/school/tokyo_hotel/',
    urlStatus: 'official',
    noteEn: 'O-hara group vocational school for hotel and travel careers (Suidobashi, Tokyo).',
    noteJa: '大原学園グループのホテル・トラベル系専門学校（東京・水道橋）。',
    meta: { ...metaFor(REVIEW_CYCLES.description), missingInfo: SCHOOL_MISSING },
  },
  {
    id: 'real-ohara-boki',
    institutionType: 'vocational',
    nameJa: '大原簿記学校（大原学園）',
    nameEn: 'O-hara College of Bookkeeping (O-hara Group)',
    city: 'tokyo',
    fields: ['business'],
    officialUrl: 'https://www.o-hara.ac.jp/',
    urlStatus: 'derived',
    noteEn: 'Business/bookkeeping vocational school within the O-hara group. Group site verified; the school-specific page should be confirmed from the group school list.',
    noteJa: '大原学園グループのビジネス・簿記系専門学校。グループ公式サイトは確認済み。学校別ページはグループの学校一覧から要確認。',
    meta: {
      ...metaFor(REVIEW_CYCLES.description),
      missingInfo: [...SCHOOL_MISSING, 'School-specific official page (currently linking to the verified group site)'],
    },
  },
];

export interface RealScholarship {
  id: string;
  nameJa: string;
  nameEn: string;
  provider: string;
  officialUrl: string;
  urlStatus: FieldDataStatus;
  noteEn: string;
  noteJa: string;
  meta: RealRecordMeta;
}

const SCHOLARSHIP_MISSING = [
  'Current amounts and stipend conditions (verify on the official page)',
  'Current application window',
  'Eligibility details for your school and nationality',
];

export const realScholarships: RealScholarship[] = [
  {
    id: 'real-jasso-shoreihi',
    nameJa: 'JASSO 文部科学省外国人留学生学習奨励費',
    nameEn: 'JASSO / MEXT Honors Scholarship for privately financed international students',
    provider: '日本学生支援機構（JASSO）',
    officialUrl: 'https://www.jasso.go.jp/',
    urlStatus: 'official',
    noteEn: 'The main public support program for privately financed international students; applications go through your school.',
    noteJa: '私費外国人留学生向けの代表的な公的支援制度。申請は在籍校を通じて行います。',
    meta: { ...metaFor(REVIEW_CYCLES.scholarship), missingInfo: [...SCHOLARSHIP_MISSING, 'Direct program page (site root verified; program page to be pinned)'] },
  },
  {
    id: 'real-yoneyama',
    nameJa: 'ロータリー米山記念奨学会',
    nameEn: 'Rotary Yoneyama Memorial Foundation',
    provider: '公益財団法人ロータリー米山記念奨学会',
    officialUrl: 'https://www.rotary-yoneyama.or.jp/',
    urlStatus: 'official',
    noteEn: 'Private scholarship foundation for international students (describes itself as Japan’s largest private scholarship organization).',
    noteJa: '外国人留学生を支援する奨学財団（同会は自らを民間最大の奨学団体としています）。',
    meta: { ...metaFor(REVIEW_CYCLES.scholarship), missingInfo: SCHOLARSHIP_MISSING },
  },
  {
    id: 'real-sisf',
    nameJa: '佐藤陽国際奨学財団',
    nameEn: 'Sato Yo International Scholarship Foundation',
    provider: '公益財団法人佐藤陽国際奨学財団',
    officialUrl: 'https://sisf.or.jp/',
    urlStatus: 'official',
    noteEn: 'Scholarships for privately financed students from designated Asian countries; spring and autumn intakes via your school.',
    noteJa: '対象アジア諸国からの私費留学生向け。春・秋の年2回、在籍校経由で募集。',
    meta: { ...metaFor(REVIEW_CYCLES.scholarship), missingInfo: SCHOLARSHIP_MISSING },
  },
  {
    id: 'real-kif',
    nameJa: '共立国際交流奨学財団',
    nameEn: 'Kyoritsu International Foundation',
    provider: '一般財団法人共立国際交流奨学財団',
    officialUrl: 'https://kif-org.com/',
    urlStatus: 'official',
    noteEn: 'Scholarships for students from Asian countries at universities, junior colleges, and vocational schools.',
    noteJa: 'アジア諸国からの留学生対象。大学・短大・専門学校の学生に支給。',
    meta: { ...metaFor(REVIEW_CYCLES.scholarship), missingInfo: SCHOLARSHIP_MISSING },
  },
  {
    id: 'real-mext',
    nameJa: '日本政府（文部科学省）奨学金',
    nameEn: 'Japanese Government (MEXT) Scholarship',
    provider: '文部科学省',
    officialUrl: 'https://www.mext.go.jp/',
    urlStatus: 'official',
    noteEn: 'Government scholarship programs (embassy or university recommendation). Site root verified; program pages vary by year.',
    noteJa: '国費外国人留学生制度（大使館推薦・大学推薦）。公式サイトは確認済み。年度ごとの募集ページは要確認。',
    meta: { ...metaFor(REVIEW_CYCLES.scholarship), missingInfo: [...SCHOLARSHIP_MISSING, 'Year-specific application page'] },
  },
];

/**
 * Recruitment portals and public employment services — explicitly NOT live
 * vacancies. Individual current vacancies live in verified.ts and follow the
 * 7-day vacancy review cycle.
 */
export interface RealJobLink {
  id: string;
  field: 'business' | 'it' | 'hospitality' | 'foodservice' | 'realestate' | 'all';
  orgJa: string;
  orgEn: string;
  kind: 'company-official' | 'government';
  officialUrl: string;
  urlStatus: FieldDataStatus;
  noteEn: string;
  noteJa: string;
  meta: RealRecordMeta;
}

const JOB_MISSING = ['Current openings and eligibility (check the official page — postings change frequently)'];

export const realJobLinks: RealJobLink[] = [
  {
    id: 'real-job-gaisen',
    field: 'all',
    orgJa: '東京外国人雇用サービスセンター（厚生労働省）',
    orgEn: 'Tokyo Employment Service Center for Foreigners (MHLW)',
    kind: 'government',
    officialUrl: 'https://jsite.mhlw.go.jp/tokyo-foreigner/',
    urlStatus: 'official',
    noteEn: 'Free public employment service for international students: job-hunting guidance, interview events, and placement.',
    noteJa: '留学生向けの公的無料職業紹介機関。就職ガイダンス・面接会・職業紹介を行っています。',
    meta: { ...metaFor(REVIEW_CYCLES.recruitPortal), missingInfo: JOB_MISSING },
  },
  {
    id: 'real-job-mhlw-list',
    field: 'all',
    orgJa: '外国人雇用サービスセンター一覧（厚生労働省）',
    orgEn: 'Employment Service Centers for Foreigners — national list (MHLW)',
    kind: 'government',
    officialUrl: 'https://www.mhlw.go.jp/stf/newpage_12638.html',
    urlStatus: 'official',
    noteEn: 'Official list of all employment service centers for foreign residents across Japan.',
    noteJa: '全国の外国人雇用サービスセンターの公式一覧。',
    meta: { ...metaFor(REVIEW_CYCLES.recruitPortal), missingInfo: JOB_MISSING },
  },
  {
    id: 'real-job-rakuten',
    field: 'it',
    orgJa: '楽天グループ株式会社 採用情報',
    orgEn: 'Rakuten Group — Careers',
    kind: 'company-official',
    officialUrl: 'https://corp.rakuten.co.jp/careers/',
    urlStatus: 'official',
    noteEn: 'Large IT company with English-language working environment and new-graduate engineering hiring.',
    noteJa: '社内公用語が英語の大手IT企業。エンジニア新卒採用があります。',
    meta: { ...metaFor(REVIEW_CYCLES.recruitPortal), missingInfo: JOB_MISSING },
  },
  {
    id: 'real-job-mercari',
    field: 'it',
    orgJa: '株式会社メルカリ 採用サイト',
    orgEn: 'Mercari — Careers',
    kind: 'company-official',
    officialUrl: 'https://careers.mercari.com/',
    urlStatus: 'official',
    noteEn: 'Tech company known for hiring international engineers with language support.',
    noteJa: '外国籍エンジニアの採用と言語サポートで知られるテック企業。',
    meta: { ...metaFor(REVIEW_CYCLES.recruitPortal), missingInfo: JOB_MISSING },
  },
  {
    id: 'real-job-seibuprince',
    field: 'hospitality',
    orgJa: '西武プリンスホテルズ＆リゾーツ 採用情報',
    orgEn: 'Seibu Prince Hotels & Resorts — Careers',
    kind: 'company-official',
    officialUrl: 'https://www.seibuprince.com/company/careers',
    urlStatus: 'official',
    noteEn: 'Major hotel group operating nationwide, including many Kanto properties.',
    noteJa: '関東を含む全国でホテルを運営する大手ホテルグループ。',
    meta: { ...metaFor(REVIEW_CYCLES.recruitPortal), missingInfo: JOB_MISSING },
  },
  {
    id: 'real-job-hoshino',
    field: 'hospitality',
    orgJa: '星野リゾート 採用サイト',
    orgEn: 'Hoshino Resorts — Recruit',
    kind: 'company-official',
    officialUrl: 'https://www.hoshinoresorts.com/recruit/',
    urlStatus: 'official',
    noteEn: 'Hospitality operator with structured career courses and year-round hiring.',
    noteJa: 'キャリアコース制と通年採用を行うホスピタリティ運営会社。',
    meta: { ...metaFor(REVIEW_CYCLES.recruitPortal), missingInfo: JOB_MISSING },
  },
  {
    id: 'real-job-zensho',
    field: 'foodservice',
    orgJa: 'ゼンショーホールディングス 採用情報',
    orgEn: 'Zensho Holdings — Recruit',
    kind: 'company-official',
    officialUrl: 'https://recruit.zensho.co.jp/',
    urlStatus: 'official',
    noteEn: 'Major food-service group (Sukiya, Hama-sushi, Coco’s, Nakau) with store-manager career tracks.',
    noteJa: 'すき家・はま寿司・ココス・なか卯を運営する大手外食グループ。店長候補のキャリアトラックがあります。',
    meta: { ...metaFor(REVIEW_CYCLES.recruitPortal), missingInfo: JOB_MISSING },
  },
  {
    id: 'real-job-skylark',
    field: 'foodservice',
    orgJa: 'すかいらーくグループ 採用サイト',
    orgEn: 'Skylark Group — Recruit',
    kind: 'company-official',
    officialUrl: 'https://recruit.skylark.co.jp/',
    urlStatus: 'official',
    noteEn: 'Major restaurant chain group; recruitment portal includes non-Japanese applicant information.',
    noteJa: '大手レストランチェーングループ。採用ポータルに外国籍者向け情報があります。',
    meta: { ...metaFor(REVIEW_CYCLES.recruitPortal), missingInfo: JOB_MISSING },
  },
  {
    id: 'real-job-openhouse',
    field: 'realestate',
    orgJa: 'オープンハウスグループ 採用サイト',
    orgEn: 'Open House Group — Recruit',
    kind: 'company-official',
    officialUrl: 'https://recruit.openhouse-group.com/',
    urlStatus: 'official',
    noteEn: 'Fast-growing Tokyo real-estate group with new-graduate and mid-career hiring.',
    noteJa: '新卒・中途採用を行う成長中の東京の不動産グループ。',
    meta: { ...metaFor(REVIEW_CYCLES.recruitPortal), missingInfo: JOB_MISSING },
  },
  {
    id: 'real-job-able',
    field: 'realestate',
    orgJa: '株式会社エイブル 採用サイト',
    orgEn: 'Able Inc. — Recruit',
    kind: 'company-official',
    officialUrl: 'https://recruit.able.co.jp/',
    urlStatus: 'official',
    noteEn: 'Nationwide rental brokerage; multilingual staff serve international residents.',
    noteJa: '全国展開の賃貸仲介会社。外国人入居者対応の多言語スタッフが活躍しています。',
    meta: { ...metaFor(REVIEW_CYCLES.recruitPortal), missingInfo: JOB_MISSING },
  },
];

/** Official legal-information sources used across the app (immigration safety). */
export const officialLegalSources = {
  checkedAt: '2026-07-10',
  reviewCycleDays: 30, // monitored monthly and whenever an official update is detected
  nextReviewAt: nextReview('2026-07-10', 30),
  studentParttime: {
    labelJa: '「留学」の在留資格に係る資格外活動許可について（出入国在留管理庁）',
    labelEn: 'Permission for activity other than that permitted — Student status (Immigration Services Agency)',
    url: 'https://www.moj.go.jp/isa/applications/procedures/nyuukokukanri07_00003.html',
  },
  shikakugai: {
    labelJa: '資格外活動の許可（入管法第19条）（出入国在留管理庁）',
    labelEn: 'Permission for activities outside the status of residence, Art. 19 (ISA)',
    url: 'https://www.moj.go.jp/isa/applications/procedures/shikakugai_00001.html',
  },
  prGuideline: {
    labelJa: '永住許可に関するガイドライン（令和8年2月24日改訂）（出入国在留管理庁）',
    labelEn: 'Guidelines on Permanent Residence Permission (rev. 2026-02-24) (ISA)',
    url: 'https://www.moj.go.jp/isa/applications/resources/nyukan_nyukan50.html',
  },
  prProcedure: {
    labelJa: '永住許可申請（出入国在留管理庁）',
    labelEn: 'Permanent residence application procedure (ISA)',
    url: 'https://www.moj.go.jp/isa/applications/procedures/16-4.html',
  },
  statusList: {
    labelJa: '在留資格一覧（出入国在留管理庁）',
    labelEn: 'List of statuses of residence (ISA)',
    url: 'https://www.moj.go.jp/isa/',
  },
} as const;

export const PARTTIME_RULE = {
  en: 'Working part-time on a Student status generally requires permission to engage in an activity other than that permitted by the status（資格外活動許可）. The standard comprehensive permission is normally limited to 28 hours per week; during long holiday periods set by your institution it may allow up to 8 hours per day. Rules differ for individual permissions — always confirm the conditions written on your own permission.',
  ja: '「留学」の在留資格でのアルバイトには、原則として資格外活動許可が必要です。通常の包括許可は週28時間以内が原則で、在籍校が定める長期休業期間中は1日8時間以内まで認められる場合があります。個別許可では条件が異なるため、必ずご自身の許可内容を確認してください。',
};
