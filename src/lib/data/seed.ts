/**
 * CareerVerse private-beta seed dataset.
 *
 * IMPORTANT: every record here is DEMONSTRATION DATA (`isDemo: true`).
 * Institutions are fictional-but-representative Kanto examples so that no real
 * school is shown with unverified figures. The UI renders a "Demonstration
 * data" badge wherever these records appear, and the Data Sources page states
 * the sample-only scope. Real records enter via the admin review pipeline.
 */

import type {
  CareerProfile,
  Dataset,
  JobListing,
  Provenance,
  School,
  Scholarship,
  SourceRecord,
} from './types';
import { MEXT_REGISTRY_SOURCE } from './universities';
import { SCHOLARSHIP_VERIFICATION_SOURCE } from './scholarships';

const REVIEWED = '2026-06-15';
const REVIEW_DUE = '2026-12-15';

const demoProvenance = (sourceIds: string[]): Provenance => ({
  sourceIds,
  verification: 'published',
  lastVerified: REVIEWED,
  reviewDueAt: REVIEW_DUE,
  reviewer: 'founder',
  confidence: 'medium',
  isDemo: true,
});

export const sources: SourceRecord[] = [
  {
    id: 'src-demo-manual',
    nameEn: 'CareerVerse demonstration dataset (manually authored)',
    nameJa: 'CareerVerse デモ用データセット（手動作成）',
    url: 'internal:methodology',
    type: 'manual',
    retrievedAt: REVIEWED,
    reviewer: 'founder',
    notes: 'Fictional representative records for private-beta demonstration.',
  },
  {
    id: 'src-mext-tuition',
    nameEn: 'MEXT — standard tuition statistics (reference ranges)',
    nameJa: '文部科学省 — 授業料の標準額・統計（参考値）',
    url: 'https://www.mext.go.jp/',
    type: 'government',
    retrievedAt: REVIEWED,
    reviewer: 'founder',
  },
  {
    id: 'src-isa-status',
    nameEn: 'Immigration Services Agency — residence status categories',
    nameJa: '出入国在留管理庁 — 在留資格一覧',
    url: 'https://www.moj.go.jp/isa/',
    type: 'government',
    retrievedAt: REVIEWED,
    reviewer: 'founder',
  },
  {
    id: 'src-jasso',
    nameEn: 'JASSO — scholarships for international students',
    nameJa: '日本学生支援機構（JASSO）— 外国人留学生奨学金',
    url: 'https://www.jasso.go.jp/',
    type: 'government',
    retrievedAt: REVIEWED,
    reviewer: 'founder',
  },
  {
    id: 'src-mhlw-wage',
    nameEn: 'MHLW — basic wage structure statistics (reference ranges)',
    nameJa: '厚生労働省 — 賃金構造基本統計調査（参考値）',
    url: 'https://www.mhlw.go.jp/',
    type: 'government',
    retrievedAt: REVIEWED,
    reviewer: 'founder',
  },
];

export const schools: School[] = [
  {
    id: 'sch-keihin-intl-u',
    institutionType: 'university',
    nameEn: 'Keihin International University (Demo)',
    nameJa: '京浜国際大学（デモ）',
    city: 'yokohama',
    fields: ['business', 'it'],
    firstYearCostJpy: 1_350_000,
    annualTuitionJpy: 980_000,
    programYears: 4,
    jlptRequired: 'n2',
    ejuRequired: true,
    scholarshipIds: ['schol-jasso-honors', 'schol-kanto-future'],
    intlSupport: 'excellent',
    employmentOutcome: { value: 0.86, isDemo: true },
    applicationMonths: [9, 10, 11],
    descriptionEn:
      'Mid-sized private university with an international business faculty, a dedicated international student office, and bilingual career services.',
    descriptionJa:
      '国際経営学部を持つ中規模私立大学。留学生専用オフィスとバイリンガルのキャリア支援があります。',
    livingCostMonthlyJpy: 110_000,
    careerSupportEn: 'Career center with JLPT-aware interview coaching and company introductions.',
    careerSupportJa: 'JLPTレベルに合わせた面接指導や企業紹介を行うキャリアセンターがあります。',
    provenance: demoProvenance(['src-demo-manual', 'src-mext-tuition']),
    sponsored: false,
  },
  {
    id: 'sch-musashino-business-u',
    institutionType: 'university',
    nameEn: 'Musashino Business University (Demo)',
    nameJa: '武蔵野ビジネス大学（デモ）',
    city: 'tokyo',
    fields: ['business', 'realestate'],
    firstYearCostJpy: 1_180_000,
    annualTuitionJpy: 890_000,
    programYears: 4,
    jlptRequired: 'n2',
    ejuRequired: false,
    scholarshipIds: ['schol-kanto-future'],
    intlSupport: 'good',
    employmentOutcome: { value: 0.81, isDemo: true },
    applicationMonths: [10, 11, 12, 1],
    descriptionEn:
      'Affordable Tokyo business university accepting JLPT N2 without EJU; evening seminar tracks suit students who work part-time.',
    descriptionJa:
      'EJU不要・N2で出願できる学費が比較的安い東京のビジネス系大学。アルバイトと両立しやすい夜間ゼミもあります。',
    livingCostMonthlyJpy: 125_000,
    careerSupportEn: 'Alumni mentoring and a real-estate industry placement program.',
    careerSupportJa: '卒業生メンター制度と不動産業界への就職支援プログラムがあります。',
    provenance: demoProvenance(['src-demo-manual', 'src-mext-tuition']),
    sponsored: false,
  },
  {
    id: 'sch-tokyo-tech-u',
    institutionType: 'university',
    nameEn: 'Tokyo Digital Institute University (Demo)',
    nameJa: '東京デジタル学院大学（デモ）',
    city: 'tokyo',
    fields: ['it'],
    firstYearCostJpy: 1_520_000,
    annualTuitionJpy: 1_150_000,
    programYears: 4,
    jlptRequired: 'n2',
    ejuRequired: true,
    scholarshipIds: ['schol-jasso-honors', 'schol-it-women'],
    intlSupport: 'good',
    employmentOutcome: { value: 0.9, isDemo: true },
    applicationMonths: [9, 10],
    descriptionEn:
      'Computer science and information design faculties with English-supported first-year courses and strong IT employer ties.',
    descriptionJa:
      '情報科学・情報デザイン学部を持ち、1年次は英語サポート科目あり。IT企業との結びつきが強い大学です。',
    livingCostMonthlyJpy: 130_000,
    careerSupportEn: 'Internship pipeline into Tokyo IT companies from year 3.',
    careerSupportJa: '3年次から都内IT企業へのインターンシップ制度があります。',
    provenance: demoProvenance(['src-demo-manual', 'src-mext-tuition']),
    sponsored: false,
  },
  {
    id: 'sch-chiba-hosp-u',
    institutionType: 'university',
    nameEn: 'Chiba Hospitality & Tourism University (Demo)',
    nameJa: '千葉ホスピタリティ観光大学（デモ）',
    city: 'chiba',
    fields: ['hospitality', 'foodservice'],
    firstYearCostJpy: 1_240_000,
    annualTuitionJpy: 940_000,
    programYears: 4,
    jlptRequired: 'n2',
    ejuRequired: false,
    scholarshipIds: ['schol-kanto-future', 'schol-hosp-industry'],
    intlSupport: 'excellent',
    employmentOutcome: { value: 0.84, isDemo: true },
    applicationMonths: [10, 11, 12],
    descriptionEn:
      'Tourism management university near Narita with hotel partnerships and paid practicum placements for international students.',
    descriptionJa:
      '成田近郊の観光経営大学。ホテルとの提携があり、留学生向けの有給実習制度があります。',
    livingCostMonthlyJpy: 95_000,
    careerSupportEn: 'Hotel and airline placement desk; kanji support classes for service Japanese.',
    careerSupportJa: 'ホテル・航空業界への就職デスクと、接客日本語の漢字サポート授業があります。',
    provenance: demoProvenance(['src-demo-manual', 'src-mext-tuition']),
    sponsored: true,
  },
  {
    id: 'sch-akiba-it-college',
    institutionType: 'vocational',
    nameEn: 'Akihabara IT College (Demo)',
    nameJa: '秋葉原ITカレッジ（デモ）',
    city: 'tokyo',
    fields: ['it'],
    firstYearCostJpy: 1_080_000,
    annualTuitionJpy: 920_000,
    programYears: 2,
    jlptRequired: 'n3',
    ejuRequired: false,
    scholarshipIds: ['schol-it-women'],
    intlSupport: 'good',
    employmentOutcome: { value: 0.88, isDemo: true },
    applicationMonths: [9, 10, 11, 12, 1, 2],
    descriptionEn:
      'Two-year software vocational school (専門士) accepting N3; graduates qualify for the Engineer/Specialist in Humanities residence status when hired in-field.',
    descriptionJa:
      'N3から出願できる2年制のソフトウェア専門学校（専門士）。専攻分野での就職により「技術・人文知識・国際業務」への変更対象になります。',
    livingCostMonthlyJpy: 120_000,
    careerSupportEn: 'Job-hunting bootcamp each autumn; portfolio review with partner companies.',
    careerSupportJa: '毎年秋に就活ブートキャンプを実施。提携企業とのポートフォリオ審査があります。',
    provenance: demoProvenance(['src-demo-manual']),
    sponsored: false,
  },
  {
    id: 'sch-shinjuku-biz-college',
    institutionType: 'vocational',
    nameEn: 'Shinjuku Business College (Demo)',
    nameJa: '新宿ビジネス専門学校（デモ）',
    city: 'tokyo',
    fields: ['business', 'realestate'],
    firstYearCostJpy: 980_000,
    annualTuitionJpy: 850_000,
    programYears: 2,
    jlptRequired: 'n3',
    ejuRequired: false,
    scholarshipIds: ['schol-kanto-future'],
    intlSupport: 'basic',
    employmentOutcome: { value: 0.77, isDemo: true },
    applicationMonths: [10, 11, 12, 1, 2, 3],
    descriptionEn:
      'International trade and office administration diplomas; includes bookkeeping (Nissho Boki) and real-estate transaction agent exam preparation.',
    descriptionJa:
      '国際貿易・オフィス事務の専門課程。日商簿記や宅地建物取引士の試験対策も含まれます。',
    livingCostMonthlyJpy: 118_000,
    careerSupportEn: 'Resume and keigo coaching; job fairs twice a year.',
    careerSupportJa: '履歴書・敬語指導と年2回の合同企業説明会があります。',
    provenance: demoProvenance(['src-demo-manual']),
    sponsored: false,
  },
  {
    id: 'sch-yokohama-hosp-college',
    institutionType: 'vocational',
    nameEn: 'Yokohama Hospitality College (Demo)',
    nameJa: '横浜ホスピタリティ専門学校（デモ）',
    city: 'yokohama',
    fields: ['hospitality', 'foodservice'],
    firstYearCostJpy: 1_020_000,
    annualTuitionJpy: 880_000,
    programYears: 2,
    jlptRequired: 'n3',
    ejuRequired: false,
    scholarshipIds: ['schol-hosp-industry'],
    intlSupport: 'excellent',
    employmentOutcome: { value: 0.85, isDemo: true },
    applicationMonths: [9, 10, 11, 12, 1, 2, 3],
    descriptionEn:
      'Hotel, bridal, and restaurant service programs with in-school training floors and many international classmates.',
    descriptionJa:
      'ホテル・ブライダル・レストランサービス学科。校内実習フロアがあり、留学生の在籍が多い学校です。',
    livingCostMonthlyJpy: 105_000,
    careerSupportEn: 'Dedicated international career staff; hotel internship guarantee program.',
    careerSupportJa: '留学生専任のキャリアスタッフとホテルインターンシップ保証制度があります。',
    provenance: demoProvenance(['src-demo-manual']),
    sponsored: false,
  },
  {
    id: 'sch-saitama-food-college',
    institutionType: 'vocational',
    nameEn: 'Saitama Food Business College (Demo)',
    nameJa: '埼玉フードビジネス専門学校（デモ）',
    city: 'saitama',
    fields: ['foodservice', 'business'],
    firstYearCostJpy: 890_000,
    annualTuitionJpy: 780_000,
    programYears: 2,
    jlptRequired: 'n3',
    ejuRequired: false,
    scholarshipIds: [],
    intlSupport: 'good',
    employmentOutcome: { value: 0.8, isDemo: true },
    applicationMonths: [10, 11, 12, 1, 2, 3],
    descriptionEn:
      'Restaurant management diploma covering store operations, food safety licensing, and franchise business planning. Lowest tuition in the demo set.',
    descriptionJa:
      '店舗運営・食品衛生・フランチャイズ経営を学ぶレストランマネジメント課程。デモデータの中で最も学費が低い学校です。',
    livingCostMonthlyJpy: 90_000,
    careerSupportEn: 'Placement desk with national restaurant chains hiring store-manager candidates.',
    careerSupportJa: '店長候補を採用する全国チェーンとの就職デスクがあります。',
    provenance: demoProvenance(['src-demo-manual']),
    sponsored: false,
  },
];

export const scholarships: Scholarship[] = [
  {
    id: 'schol-jasso-honors',
    nameEn: 'JASSO Honors Scholarship (reference)',
    nameJa: 'JASSO 学習奨励費（参考）',
    provider: 'JASSO',
    amountJpy: 48_000,
    per: 'month',
    eligibilityEn: 'Privately financed international students with strong grades and attendance.',
    eligibilityJa: '成績・出席率が良好な私費外国人留学生。',
    deadlineEn: 'Applied through your school, usually April–May.',
    deadlineJa: '在籍校を通じて申請（通常4〜5月）。',
    region: 'national',
    institutionTypes: ['university', 'vocational'],
    nationalityRestricted: false,
    minJlpt: 'n3',
    provenance: demoProvenance(['src-jasso']),
  },
  {
    id: 'schol-kanto-future',
    nameEn: 'Kanto Future Leaders Grant (Demo)',
    nameJa: '関東未来リーダー奨学金（デモ）',
    provider: 'Kanto Education Foundation (fictional)',
    amountJpy: 300_000,
    per: 'year',
    eligibilityEn: 'International students entering business programs in Kanto; essay + interview.',
    eligibilityJa: '関東のビジネス系課程に進学する留学生。小論文と面接があります。',
    deadlineEn: 'November 30 each year.',
    deadlineJa: '毎年11月30日締切。',
    region: 'kanto',
    institutionTypes: ['university', 'vocational'],
    nationalityRestricted: false,
    minJlpt: 'n2',
    provenance: demoProvenance(['src-demo-manual']),
  },
  {
    id: 'schol-it-women',
    nameEn: 'Tokyo IT Talent Scholarship (Demo)',
    nameJa: '東京ITタレント奨学金（デモ）',
    provider: 'Tokyo IT Industry Association (fictional)',
    amountJpy: 500_000,
    per: 'once',
    eligibilityEn: 'Students entering IT programs who pass a basic programming aptitude test.',
    eligibilityJa: 'IT系課程に進学し、基礎プログラミング適性試験に合格した学生。',
    deadlineEn: 'January 15 each year.',
    deadlineJa: '毎年1月15日締切。',
    region: 'kanto',
    institutionTypes: ['university', 'vocational'],
    nationalityRestricted: false,
    minJlpt: 'n3',
    provenance: demoProvenance(['src-demo-manual']),
  },
  {
    id: 'schol-hosp-industry',
    nameEn: 'Hospitality Industry Support Scholarship (Demo)',
    nameJa: 'ホスピタリティ業界支援奨学金（デモ）',
    provider: 'Kanto Hotel Association (fictional)',
    amountJpy: 30_000,
    per: 'month',
    eligibilityEn: 'Hospitality students who commit to a partner-hotel internship.',
    eligibilityJa: '提携ホテルでのインターンシップに参加するホスピタリティ系学生。',
    deadlineEn: 'Rolling, tied to school enrollment.',
    deadlineJa: '随時（入学手続きと同時）。',
    region: 'kanto',
    institutionTypes: ['university', 'vocational'],
    nationalityRestricted: false,
    minJlpt: 'n3',
    provenance: demoProvenance(['src-demo-manual']),
  },
];

const demoSalaryNote = { isDemo: true };

export const careers: CareerProfile[] = [
  {
    id: 'car-business',
    field: 'business',
    nameEn: 'Business & office work',
    nameJa: 'ビジネス・事務職',
    dailyWorkEn:
      'Sales support, trade documentation, customer coordination, internal reporting, and meetings — mostly in Japanese with some English for international clients.',
    dailyWorkJa:
      '営業サポート、貿易書類、顧客対応、社内報告、会議など。業務は主に日本語で、海外顧客対応では英語も使います。',
    demandScore: 70,
    minJlptEntry: 'n2',
    degreePathways: { university: true, vocational: true, direct: false },
    levels: [
      {
        id: 'biz-1', titleEn: 'Sales / office assistant', titleJa: '営業アシスタント・一般事務',
        yearsFromEntry: 0, salaryJpy: { min: 3_000_000, max: 3_600_000, ...demoSalaryNote },
        jlptTypical: 'n2', skillsEn: ['Business email', 'Excel', 'Keigo'], skillsJa: ['ビジネスメール', 'Excel', '敬語'],
        qualificationsEn: ['Nissho Boki 3 (helpful)'], qualificationsJa: ['日商簿記3級（あると有利）'],
        obstaclesEn: 'Keigo speed and internal document formats take time to master.',
        obstaclesJa: '敬語のスピードと社内文書の形式に慣れるまで時間がかかります。',
        visaNoteEn: 'Typically Engineer/Specialist in Humanities/International Services.',
        visaNoteJa: '通常「技術・人文知識・国際業務」の在留資格が該当します。',
      },
      {
        id: 'biz-2', titleEn: 'Account executive', titleJa: '営業担当',
        yearsFromEntry: 3, salaryJpy: { min: 3_800_000, max: 4_800_000, ...demoSalaryNote },
        jlptTypical: 'n2', skillsEn: ['Negotiation', 'Proposal writing'], skillsJa: ['交渉', '提案書作成'],
        qualificationsEn: [], qualificationsJa: [],
        obstaclesEn: 'Quota pressure; relationship-building in Japanese business culture.',
        obstaclesJa: 'ノルマのプレッシャーと日本的な取引先との関係構築。',
        visaNoteEn: 'Same status; renewals become smoother with stable employment.',
        visaNoteJa: '在留資格は同じ。安定した雇用で更新は円滑になります。',
      },
      {
        id: 'biz-3', titleEn: 'Team leader / section manager', titleJa: '主任・課長',
        yearsFromEntry: 7, salaryJpy: { min: 5_500_000, max: 7_500_000, ...demoSalaryNote },
        jlptTypical: 'n1', skillsEn: ['People management', 'P&L basics'], skillsJa: ['マネジメント', '損益管理の基礎'],
        qualificationsEn: ['MBA (optional)'], qualificationsJa: ['MBA（任意）'],
        obstaclesEn: 'Management roles usually expect near-native Japanese.',
        obstaclesJa: '管理職はほぼネイティブレベルの日本語が求められることが多いです。',
        visaNoteEn: 'Long-term employment history supports permanent-residence applications (individual review).',
        visaNoteJa: '長期の就労実績は永住申請の際に考慮されます（個別審査）。',
      },
    ],
    workLifeEn: 'Standard office hours; overtime varies by company. Transfers possible in larger firms.',
    workLifeJa: '基本は日勤。残業は会社により異なります。大企業では転勤の可能性があります。',
    settlementRelevanceEn:
      'Stable full-time office employment on a work status is a common long-term settlement path; final decisions always rest with immigration authorities.',
    settlementRelevanceJa:
      '就労資格での安定したフルタイム雇用は長期定住の一般的な経路ですが、最終判断は出入国在留管理庁が行います。',
    provenance: demoProvenance(['src-demo-manual', 'src-mhlw-wage']),
  },
  {
    id: 'car-it',
    field: 'it',
    nameEn: 'IT & software',
    nameJa: 'IT・ソフトウェア',
    dailyWorkEn:
      'Coding, testing, code review, stand-ups, and documentation. Many teams accept JLPT N3–N2 if technical skills are strong; some use English internally.',
    dailyWorkJa:
      'コーディング、テスト、コードレビュー、朝会、ドキュメント作成。技術力があればN3〜N2で採用するチームも多く、社内英語の会社もあります。',
    demandScore: 90,
    minJlptEntry: 'n3',
    degreePathways: { university: true, vocational: true, direct: false },
    levels: [
      {
        id: 'it-1', titleEn: 'Junior developer', titleJa: 'ジュニアエンジニア',
        yearsFromEntry: 0, salaryJpy: { min: 3_200_000, max: 4_200_000, ...demoSalaryNote },
        jlptTypical: 'n3', skillsEn: ['One programming language', 'Git', 'Basic SQL'], skillsJa: ['プログラミング言語1つ', 'Git', '基本的なSQL'],
        qualificationsEn: ['FE (基本情報) helpful'], qualificationsJa: ['基本情報技術者（あると有利）'],
        obstaclesEn: 'First job is the hardest step; portfolio quality matters more than grades.',
        obstaclesJa: '最初の就職が最大の関門。成績よりポートフォリオの質が重要です。',
        visaNoteEn: 'Engineer/Specialist in Humanities; a related degree or 専門士 is the usual basis.',
        visaNoteJa: '「技術・人文知識・国際業務」。関連する学位または専門士が一般的な根拠になります。',
      },
      {
        id: 'it-2', titleEn: 'Mid-level engineer', titleJa: '中堅エンジニア',
        yearsFromEntry: 3, salaryJpy: { min: 4_500_000, max: 6_500_000, ...demoSalaryNote },
        jlptTypical: 'n2', skillsEn: ['System design', 'Cloud services'], skillsJa: ['システム設計', 'クラウド'],
        qualificationsEn: ['AWS/Azure certificates (optional)'], qualificationsJa: ['AWS/Azure認定（任意）'],
        obstaclesEn: 'Choosing between SES contracting and product companies affects growth.',
        obstaclesJa: 'SES系か自社開発かの選択がキャリアの伸びに影響します。',
        visaNoteEn: 'Highly-Skilled Professional points may become relevant at this stage.',
        visaNoteJa: 'この段階から高度専門職ポイント制度が視野に入ります。',
      },
      {
        id: 'it-3', titleEn: 'Senior engineer / tech lead', titleJa: 'シニアエンジニア・テックリード',
        yearsFromEntry: 6, salaryJpy: { min: 6_500_000, max: 9_500_000, ...demoSalaryNote },
        jlptTypical: 'n2', skillsEn: ['Architecture', 'Mentoring'], skillsJa: ['アーキテクチャ設計', 'メンタリング'],
        qualificationsEn: [], qualificationsJa: [],
        obstaclesEn: 'Leadership communication in Japanese; keeping skills current.',
        obstaclesJa: '日本語でのリーダーシップと技術の継続学習。',
        visaNoteEn: 'High salaries can qualify for Highly-Skilled Professional status (individual review).',
        visaNoteJa: '高収入は高度専門職の要件になり得ます（個別審査）。',
      },
    ],
    workLifeEn: 'Flexible/remote options are common in product companies; SES placements vary.',
    workLifeJa: '自社開発企業ではフレックス・リモートが一般的。SESは配属先によります。',
    settlementRelevanceEn:
      'IT careers can reach Highly-Skilled Professional points thresholds relatively quickly, which may shorten some settlement timelines; individual review always applies.',
    settlementRelevanceJa:
      'IT職は高度専門職ポイントに比較的早く到達でき、定住までの期間が短くなる場合があります。常に個別審査です。',
    provenance: demoProvenance(['src-demo-manual', 'src-mhlw-wage']),
  },
  {
    id: 'car-hospitality',
    field: 'hospitality',
    nameEn: 'Hospitality & tourism',
    nameJa: 'ホスピタリティ・観光',
    dailyWorkEn:
      'Front desk, guest relations, reservations, and concierge work in hotels; multilingual staff are valued in Kanto tourism hubs.',
    dailyWorkJa:
      'ホテルのフロント、ゲスト対応、予約管理、コンシェルジュ業務など。関東の観光地では多言語スタッフが重宝されます。',
    demandScore: 80,
    minJlptEntry: 'n2',
    degreePathways: { university: true, vocational: true, direct: true },
    levels: [
      {
        id: 'hosp-1', titleEn: 'Front desk staff', titleJa: 'フロントスタッフ',
        yearsFromEntry: 0, salaryJpy: { min: 2_800_000, max: 3_400_000, ...demoSalaryNote },
        jlptTypical: 'n2', skillsEn: ['Service Japanese', 'PMS systems', 'English service'], skillsJa: ['接客日本語', 'PMS操作', '英語接客'],
        qualificationsEn: [], qualificationsJa: [],
        obstaclesEn: 'Shift work including nights; high keigo standard.',
        obstaclesJa: '夜勤を含むシフト勤務と高い敬語水準。',
        visaNoteEn:
          'Often Engineer/Specialist in Humanities using language skills; Specified Skilled Worker (accommodation) is another path.',
        visaNoteJa:
          '語学力を活かした「技術・人文知識・国際業務」のほか、特定技能（宿泊）という経路もあります。',
      },
      {
        id: 'hosp-2', titleEn: 'Guest relations / shift leader', titleJa: 'ゲストリレーションズ・シフトリーダー',
        yearsFromEntry: 3, salaryJpy: { min: 3_400_000, max: 4_200_000, ...demoSalaryNote },
        jlptTypical: 'n2', skillsEn: ['Complaint handling', 'Team coordination'], skillsJa: ['クレーム対応', 'チーム調整'],
        qualificationsEn: [], qualificationsJa: [],
        obstaclesEn: 'Promotion speed depends on hotel brand and turnover.',
        obstaclesJa: '昇進スピードはホテルブランドと離職率に左右されます。',
        visaNoteEn: 'Same status; managerial duties strengthen renewals.',
        visaNoteJa: '在留資格は同じ。管理的業務は更新の際にプラスになります。',
      },
      {
        id: 'hosp-3', titleEn: 'Front office manager', titleJa: 'フロントオフィスマネージャー',
        yearsFromEntry: 7, salaryJpy: { min: 4_500_000, max: 6_000_000, ...demoSalaryNote },
        jlptTypical: 'n1', skillsEn: ['Revenue basics', 'Staff training'], skillsJa: ['レベニュー管理の基礎', 'スタッフ育成'],
        qualificationsEn: [], qualificationsJa: [],
        obstaclesEn: 'Fewer management seats; relocation between properties is common.',
        obstaclesJa: '管理職ポストが限られ、施設間の異動が一般的です。',
        visaNoteEn: 'Stable management employment supports long-term settlement (individual review).',
        visaNoteJa: '安定した管理職雇用は長期定住の材料になります（個別審査）。',
      },
    ],
    workLifeEn: 'Shift-based including weekends/holidays; staff housing sometimes provided.',
    workLifeJa: '土日祝を含むシフト制。社員寮が提供される場合もあります。',
    settlementRelevanceEn:
      'Hospitality offers direct-entry paths (Specified Skilled Worker) but their settlement implications differ from work statuses — professional advice is important here.',
    settlementRelevanceJa:
      '特定技能など直接就職の経路がありますが、在留資格によって定住への影響が異なるため、専門家への相談が重要です。',
    provenance: demoProvenance(['src-demo-manual', 'src-mhlw-wage']),
  },
  {
    id: 'car-foodservice',
    field: 'foodservice',
    nameEn: 'Restaurant & food-service management',
    nameJa: '飲食・フードサービスマネジメント',
    dailyWorkEn:
      'Store operations, staff scheduling, inventory, food safety, and customer service — a clear ladder from staff to area manager in national chains.',
    dailyWorkJa:
      '店舗運営、シフト管理、在庫、食品衛生、接客。全国チェーンではスタッフからエリアマネージャーまでの明確な昇進ラダーがあります。',
    demandScore: 75,
    minJlptEntry: 'n3',
    degreePathways: { university: true, vocational: true, direct: true },
    levels: [
      {
        id: 'food-1', titleEn: 'Restaurant staff', titleJa: 'レストランスタッフ',
        yearsFromEntry: 0, salaryJpy: { min: 2_700_000, max: 3_200_000, ...demoSalaryNote },
        jlptTypical: 'n3', skillsEn: ['Service basics', 'POS'], skillsJa: ['接客基礎', 'POS操作'],
        qualificationsEn: [], qualificationsJa: [],
        obstaclesEn: 'Physically demanding; evening/weekend shifts.',
        obstaclesJa: '体力的にきつく、夜間・週末シフトがあります。',
        visaNoteEn:
          'Direct food-service work usually requires Specified Skilled Worker (food service) — different from office work statuses.',
        visaNoteJa:
          '現場の飲食業務は通常「特定技能（外食業）」が必要で、事務系の在留資格とは異なります。',
      },
      {
        id: 'food-2', titleEn: 'Shift leader', titleJa: 'シフトリーダー',
        yearsFromEntry: 2, salaryJpy: { min: 3_100_000, max: 3_600_000, ...demoSalaryNote },
        jlptTypical: 'n3', skillsEn: ['Scheduling', 'Training'], skillsJa: ['シフト作成', '新人教育'],
        qualificationsEn: ['Food safety supervisor (食品衛生責任者)'], qualificationsJa: ['食品衛生責任者'],
        obstaclesEn: 'Balancing floor work with admin duties.',
        obstaclesJa: '現場業務と管理業務の両立。',
        visaNoteEn: 'Check carefully which status covers supervisory duties.',
        visaNoteJa: '管理的業務がどの在留資格に該当するか必ず確認してください。',
      },
      {
        id: 'food-3', titleEn: 'Store manager', titleJa: '店長',
        yearsFromEntry: 4, salaryJpy: { min: 3_800_000, max: 5_000_000, ...demoSalaryNote },
        jlptTypical: 'n2', skillsEn: ['P&L management', 'Hiring'], skillsJa: ['損益管理', '採用'],
        qualificationsEn: [], qualificationsJa: [],
        obstaclesEn: 'Long hours in some chains; responsibility for results.',
        obstaclesJa: 'チェーンによっては長時間労働。業績への責任があります。',
        visaNoteEn:
          'Headquarters/management roles may fit Engineer/Specialist in Humanities — a key transition point.',
        visaNoteJa:
          '本部・管理職は「技術・人文知識・国際業務」に該当する場合があり、重要な転換点です。',
      },
      {
        id: 'food-4', titleEn: 'Area manager', titleJa: 'エリアマネージャー',
        yearsFromEntry: 8, salaryJpy: { min: 5_000_000, max: 7_000_000, ...demoSalaryNote },
        jlptTypical: 'n2', skillsEn: ['Multi-store operations', 'Coaching managers'], skillsJa: ['複数店舗運営', '店長育成'],
        qualificationsEn: [], qualificationsJa: [],
        obstaclesEn: 'Frequent travel across the region.',
        obstaclesJa: '担当エリア内の移動が多くなります。',
        visaNoteEn: 'Long stable management careers support settlement applications (individual review).',
        visaNoteJa: '長期の管理職キャリアは定住申請の材料になります（個別審査）。',
      },
    ],
    workLifeEn: 'Shift-heavy early, more regular at HQ level; chains offer structured training.',
    workLifeJa: '初期はシフト中心、本部勤務では規則的に。チェーンは研修制度が整っています。',
    settlementRelevanceEn:
      'The staff→manager ladder crosses residence-status boundaries; planning the status transition early matters more here than in other fields.',
    settlementRelevanceJa:
      'スタッフから店長への昇進は在留資格の切り替えを伴うため、早めの計画が他の分野以上に重要です。',
    provenance: demoProvenance(['src-demo-manual', 'src-mhlw-wage']),
  },
  {
    id: 'car-realestate',
    field: 'realestate',
    nameEn: 'Real estate',
    nameJa: '不動産',
    dailyWorkEn:
      'Property sales/leasing for international and domestic clients, contract paperwork, and property viewings. Multilingual agents serve foreign residents.',
    dailyWorkJa:
      '国内外の顧客向け売買・賃貸仲介、契約書類、内見対応。多言語対応の営業は外国人居住者からの需要があります。',
    demandScore: 65,
    minJlptEntry: 'n2',
    degreePathways: { university: true, vocational: true, direct: false },
    levels: [
      {
        id: 're-1', titleEn: 'Leasing agent', titleJa: '賃貸営業',
        yearsFromEntry: 0, salaryJpy: { min: 3_000_000, max: 3_800_000, ...demoSalaryNote },
        jlptTypical: 'n2', skillsEn: ['Sales', 'Contract basics'], skillsJa: ['営業', '契約の基礎'],
        qualificationsEn: [], qualificationsJa: [],
        obstaclesEn: 'Commission pressure; weekend work.',
        obstaclesJa: '歩合のプレッシャーと週末勤務。',
        visaNoteEn: 'Engineer/Specialist in Humanities using language + business knowledge.',
        visaNoteJa: '語学力とビジネス知識を根拠とする「技術・人文知識・国際業務」。',
      },
      {
        id: 're-2', titleEn: 'Licensed agent (宅建士)', titleJa: '宅地建物取引士',
        yearsFromEntry: 2, salaryJpy: { min: 4_000_000, max: 5_500_000, ...demoSalaryNote },
        jlptTypical: 'n1', skillsEn: ['Property law', 'Important-matter explanation'], skillsJa: ['不動産法務', '重要事項説明'],
        qualificationsEn: ['Takken license (national exam, Japanese)'], qualificationsJa: ['宅建士（国家試験・日本語）'],
        obstaclesEn: 'The Takken exam is in Japanese with a ~17% pass rate — a major hurdle and a major differentiator.',
        obstaclesJa: '宅建試験は日本語で合格率約17%。大きな壁であり、大きな差別化要因です。',
        visaNoteEn: 'The license itself does not change status but strengthens employment stability.',
        visaNoteJa: '資格自体は在留資格を変えませんが、雇用の安定性を高めます。',
      },
      {
        id: 're-3', titleEn: 'Sales manager', titleJa: '営業マネージャー',
        yearsFromEntry: 6, salaryJpy: { min: 5_500_000, max: 8_000_000, ...demoSalaryNote },
        jlptTypical: 'n1', skillsEn: ['Team management', 'Investment sales'], skillsJa: ['チームマネジメント', '投資用物件営業'],
        qualificationsEn: [], qualificationsJa: [],
        obstaclesEn: 'Results-driven culture; high variance in earnings.',
        obstaclesJa: '成果主義の文化で収入の変動が大きいです。',
        visaNoteEn: 'High, stable income supports long-term applications (individual review).',
        visaNoteJa: '高く安定した収入は長期在留の申請材料になります（個別審査）。',
      },
    ],
    workLifeEn: 'Weekend-centric schedule with weekday off days; commission can significantly raise pay.',
    workLifeJa: '週末中心の勤務で平日休み。歩合により収入が大きく伸びることがあります。',
    settlementRelevanceEn:
      'Multilingual real-estate careers in Kanto are durable; income stability is the key settlement factor (individual review).',
    settlementRelevanceJa:
      '関東の多言語不動産営業は息の長い仕事です。定住では収入の安定性が鍵になります（個別審査）。',
    provenance: demoProvenance(['src-demo-manual', 'src-mhlw-wage']),
  },
];

export const jobListings: JobListing[] = [
  {
    id: 'job-1', careerId: 'car-it',
    titleEn: 'Junior web developer (training program)', titleJa: 'ジュニアWebエンジニア（研修あり）',
    company: 'Demo Tech KK', city: 'tokyo',
    salaryJpy: { min: 3_300_000, max: 4_000_000 }, jlpt: 'n3',
    applyUrl: '',  // demonstration record — no external application
    provenance: demoProvenance(['src-demo-manual']),
  },
  {
    id: 'job-2', careerId: 'car-hospitality',
    titleEn: 'Hotel front desk (multilingual)', titleJa: 'ホテルフロント（多言語対応）',
    company: 'Demo Hotels Yokohama', city: 'yokohama',
    salaryJpy: { min: 2_900_000, max: 3_300_000 }, jlpt: 'n2',
    applyUrl: '',  // demonstration record — no external application
    provenance: demoProvenance(['src-demo-manual']),
  },
  {
    id: 'job-3', careerId: 'car-business',
    titleEn: 'International sales assistant', titleJa: '海外営業アシスタント',
    company: 'Demo Trading Co.', city: 'tokyo',
    salaryJpy: { min: 3_100_000, max: 3_700_000 }, jlpt: 'n2',
    applyUrl: '',  // demonstration record — no external application
    provenance: demoProvenance(['src-demo-manual']),
  },
  {
    id: 'job-4', careerId: 'car-foodservice',
    titleEn: 'Store manager candidate (national chain)', titleJa: '店長候補（全国チェーン）',
    company: 'Demo Foods Inc.', city: 'saitama',
    salaryJpy: { min: 3_200_000, max: 3_800_000 }, jlpt: 'n3',
    applyUrl: '',  // demonstration record — no external application
    provenance: demoProvenance(['src-demo-manual']),
  },
  {
    id: 'job-5', careerId: 'car-realestate',
    titleEn: 'Leasing agent for international residents', titleJa: '外国人向け賃貸営業',
    company: 'Demo Estate Tokyo', city: 'tokyo',
    salaryJpy: { min: 3_200_000, max: 4_200_000 }, jlpt: 'n2',
    applyUrl: '',  // demonstration record — no external application
    provenance: demoProvenance(['src-demo-manual']),
  },
];

/**
 * Sources exposed to the app. The demo sources above back the demonstration
 * institutions; MEXT_REGISTRY_SOURCE backs the 825 real, identity-verified
 * universities in the registry (see src/lib/data/universities) so the decision
 * report can cite a real official source. Registry universities carry no
 * demonstration figures — their eligibility/cost fields stay "not verified".
 */
export const allSources: SourceRecord[] = [
  ...sources,
  MEXT_REGISTRY_SOURCE,
  SCHOLARSHIP_VERIFICATION_SOURCE,
];

export const dataset: Dataset = {
  sources: allSources,
  schools,
  scholarships,
  careers,
  jobListings,
};
