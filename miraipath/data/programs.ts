/**
 * Seeded demo data. EVERY institution and program in this file is FICTIONAL
 * and exists only to demonstrate the product. Nothing here describes a real
 * school. All records carry isFictionalDemo / "Demo" labels and the UI
 * renders a "Fictional demo data" chip wherever they appear.
 */
import type {
  Institution,
  OfficialSource,
  Program,
  AdmissionRequirement,
} from "@/types";

// ---------------------------------------------------------------------------
// Sources (fictional URLs, clearly demo)
// ---------------------------------------------------------------------------

const mkSource = (
  id: string,
  title: string,
  owner: string,
  programScope: string,
  status: OfficialSource["verificationStatus"] = "institution_submitted",
  lastChecked = "2026-06-20"
): OfficialSource => ({
  id,
  url: `https://demo.invalid/sources/${id}`,
  title,
  owner,
  academicYear: "2027",
  publicationDate: "2026-04-01",
  lastCheckedDate: lastChecked,
  pageOrSection: "Admissions guide (demo)",
  geographicScope: "Japan",
  programScope,
  verificationStatus: status,
  notes:
    "Fictional demo source. In production this links to the institution's official admissions page.",
});

export const demoSources: OfficialSource[] = [
  mkSource("src-hgu-biz", "2027 International Admissions Guide (Demo)", "Harborlight Global University (Fictional)", "Digital Business Program / International route / AY2027", "officially_verified"),
  mkSource("src-hgu-eng", "2027 Engineering Faculty Requirements (Demo)", "Harborlight Global University (Fictional)", "Mechanical Engineering Program / International route / AY2027", "officially_verified"),
  mkSource("src-kmu-mgmt", "International Management Program Outline 2027 (Demo)", "Kawanami Metropolitan University (Fictional)", "International Management Program / AY2027", "institution_submitted"),
  mkSource("src-kmu-tour", "Tourism Sciences Admissions 2027 (Demo)", "Kawanami Metropolitan University (Fictional)", "Tourism Sciences Program / AY2027", "needs_confirmation"),
  mkSource("src-aidc", "AI Application Development Course Guide 2027 (Demo)", "Aozora AI Development College (Fictional)", "AI Application Development / AY2027", "officially_verified"),
  mkSource("src-aidc-web", "Web Systems Course Guide 2027 (Demo)", "Aozora AI Development College (Fictional)", "Web Systems Development / AY2027", "institution_submitted"),
  mkSource("src-shc", "Hotel & Bridal Course Admissions 2027 (Demo)", "Seiran Hospitality College (Fictional)", "Hotel Management / AY2027", "officially_verified"),
  mkSource("src-shc-tour", "Global Tourism Course Admissions 2027 (Demo)", "Seiran Hospitality College (Fictional)", "Global Tourism Service / AY2027", "institution_submitted"),
  mkSource("src-mdc", "Visual Design Department Guide 2027 (Demo)", "Mirai Design College (Fictional)", "Visual & UI Design / AY2027", "institution_submitted"),
  mkSource("src-mdc-game", "Game Graphics Course Guide 2027 (Demo)", "Mirai Design College (Fictional)", "Game Graphics / AY2027", "needs_confirmation"),
  mkSource("src-kcc", "Care Work Department Admissions 2027 (Demo)", "Kokoro Care College (Fictional)", "Certified Care Worker Course / AY2027", "officially_verified"),
  mkSource("src-tit", "Information Engineering Admissions 2027 (Demo)", "Tsubasa Institute of Technology (Fictional)", "Information Engineering Program / AY2027", "officially_verified"),
  mkSource("src-obc", "Global Business Department Guide 2026 (Demo)", "Oceanview Business College (Fictional)", "Global Business Practice / AY2026-2027", "outdated", "2025-11-10"),
];

// ---------------------------------------------------------------------------
// Institutions (all fictional)
// ---------------------------------------------------------------------------

export const demoInstitutions: Institution[] = [
  {
    id: "inst-hgu",
    type: "university",
    name: "Harborlight Global University (Fictional Demo)",
    nameJa: "ハーバーライト国際大学（架空・デモ）",
    isFictionalDemo: true,
    campuses: [
      { id: "hgu-yokohama", name: "Yokohama Campus", nameJa: "横浜キャンパス", city: "Yokohama", region: "kanto" },
    ],
    description:
      "A fictional private university used to demonstrate university-type listings with English-taught and Japanese-taught programs.",
    descriptionJa: "デモ用の架空私立大学です。",
  },
  {
    id: "inst-kmu",
    type: "university",
    name: "Kawanami Metropolitan University (Fictional Demo)",
    nameJa: "川波都市大学（架空・デモ）",
    isFictionalDemo: true,
    campuses: [
      { id: "kmu-osaka", name: "Osaka Namba Campus", nameJa: "大阪なんばキャンパス", city: "Osaka", region: "kansai" },
    ],
    description:
      "A fictional mid-size university in Kansai used to demonstrate management and tourism programs.",
  },
  {
    id: "inst-aidc",
    type: "vocational_school",
    name: "Aozora AI Development College (Fictional Demo)",
    nameJa: "あおぞらAI開発カレッジ（架空・デモ）",
    isFictionalDemo: true,
    campuses: [
      { id: "aidc-tokyo", name: "Tokyo Shinjuku Campus", nameJa: "東京新宿キャンパス", city: "Tokyo", region: "kanto" },
    ],
    description:
      "A fictional professional training college focused on practical AI and web development skills.",
  },
  {
    id: "inst-shc",
    type: "vocational_school",
    name: "Seiran Hospitality College (Fictional Demo)",
    nameJa: "青嵐ホスピタリティカレッジ（架空・デモ）",
    isFictionalDemo: true,
    campuses: [
      { id: "shc-kyoto", name: "Kyoto Campus", nameJa: "京都キャンパス", city: "Kyoto", region: "kansai" },
      { id: "shc-fukuoka", name: "Fukuoka Campus", nameJa: "福岡キャンパス", city: "Fukuoka", region: "kyushu_okinawa" },
    ],
    description:
      "A fictional hospitality-focused vocational school with hotel, bridal and tourism courses.",
  },
  {
    id: "inst-mdc",
    type: "professional_training_college",
    name: "Mirai Design College (Fictional Demo)",
    nameJa: "みらいデザインカレッジ（架空・デモ）",
    isFictionalDemo: true,
    campuses: [
      { id: "mdc-nagoya", name: "Nagoya Campus", nameJa: "名古屋キャンパス", city: "Nagoya", region: "chubu" },
    ],
    description:
      "A fictional design college demonstrating portfolio-based admissions for creative fields.",
  },
  {
    id: "inst-kcc",
    type: "vocational_school",
    name: "Kokoro Care College (Fictional Demo)",
    nameJa: "こころ介護カレッジ（架空・デモ）",
    isFictionalDemo: true,
    campuses: [
      { id: "kcc-sendai", name: "Sendai Campus", nameJa: "仙台キャンパス", city: "Sendai", region: "hokkaido_tohoku" },
    ],
    description:
      "A fictional care-work college demonstrating national-certification-oriented courses.",
  },
  {
    id: "inst-tit",
    type: "university",
    name: "Tsubasa Institute of Technology (Fictional Demo)",
    nameJa: "つばさ工科大学（架空・デモ）",
    isFictionalDemo: true,
    campuses: [
      { id: "tit-hiroshima", name: "Hiroshima Campus", nameJa: "広島キャンパス", city: "Hiroshima", region: "chugoku_shikoku" },
    ],
    description:
      "A fictional engineering university demonstrating EJU-based admissions.",
  },
  {
    id: "inst-obc",
    type: "vocational_school",
    name: "Oceanview Business College (Fictional Demo)",
    nameJa: "オーシャンビュービジネスカレッジ（架空・デモ）",
    isFictionalDemo: true,
    campuses: [
      { id: "obc-okinawa", name: "Naha Campus", nameJa: "那覇キャンパス", city: "Naha", region: "kyushu_okinawa" },
    ],
    description:
      "A fictional business college demonstrating how outdated information is flagged.",
  },
];

// ---------------------------------------------------------------------------
// Requirement helpers
// ---------------------------------------------------------------------------

const reqJa = (id: string, min: "N1" | "N2" | "N3", extra = ""): AdmissionRequirement => ({
  id,
  kind: "japanese_level",
  description: `Japanese proficiency: JLPT ${min} or equivalent${extra ? ` (${extra})` : ""}`,
  descriptionJa: `日本語能力：JLPT ${min}相当以上${extra ? `（${extra}）` : ""}`,
  minJlpt: min,
  required: true,
});

const reqEdu = (id: string, min: AdmissionRequirement["minEducation"], desc: string, descJa: string): AdmissionRequirement => ({
  id,
  kind: "education",
  description: desc,
  descriptionJa: descJa,
  minEducation: min,
  required: true,
});

const req12y = (id: string) =>
  reqEdu(id, "high_school", "12 years of formal education completed (high-school graduation or equivalent)", "12年課程修了（高等学校卒業相当）");

const reqEju = (id: string, required: boolean): AdmissionRequirement => ({
  id,
  kind: "eju",
  description: required
    ? "EJU (Examination for Japanese University Admission) score required"
    : "EJU score optional; may strengthen the application",
  descriptionJa: required ? "日本留学試験（EJU）の受験が必要" : "EJUスコアは任意（提出可）",
  ejuRequired: required,
  required,
});

const reqInterview = (id: string): AdmissionRequirement => ({
  id,
  kind: "interview",
  description: "Interview (in person or online)",
  descriptionJa: "面接（対面またはオンライン）",
  required: true,
});

const reqPortfolio = (id: string): AdmissionRequirement => ({
  id,
  kind: "portfolio",
  description: "Portfolio of creative work (5–10 pieces)",
  descriptionJa: "作品ポートフォリオ（5〜10点）",
  required: true,
});

const reqAttendance = (id: string): AdmissionRequirement => ({
  id,
  kind: "attendance",
  description: "Language-school attendance of 90% or higher recommended",
  descriptionJa: "日本語学校の出席率90%以上を推奨",
  required: false,
});

// ---------------------------------------------------------------------------
// Programs (14 fictional demo programs)
// ---------------------------------------------------------------------------

export const demoPrograms: Program[] = [
  {
    id: "prog-hgu-digital-business",
    institutionId: "inst-hgu",
    name: "Digital Business Program (BBA)",
    nameJa: "デジタルビジネス学科（経営学士）",
    field: "business",
    campusId: "hgu-yokohama",
    languageOfInstruction: "bilingual",
    durationYears: 4,
    degreeOrCredential: "Bachelor of Business Administration",
    careerDirections: ["Product operations", "Digital marketing", "Business planning"],
    careerDirectionsJa: ["プロダクト運営", "デジタルマーケティング", "経営企画"],
    admissionRoutes: [
      {
        id: "route-hgu-biz-intl",
        name: "International Student Entrance Exam (April intake)",
        nameJa: "外国人留学生入試（4月入学）",
        academicYear: "2027",
        applicationPeriodStart: "2026-09-01",
        applicationPeriodEnd: "2026-11-14",
        intakeDate: "2027-04-01",
        examType: "Document screening + essay + interview",
        requirements: [req12y("r-hgu-biz-edu"), reqJa("r-hgu-biz-ja", "N2"), reqEju("r-hgu-biz-eju", false), reqInterview("r-hgu-biz-int"), reqAttendance("r-hgu-biz-att")],
        sourceIds: ["src-hgu-biz"],
      },
    ],
    tuition: {
      id: "tui-hgu-biz",
      academicYear: "2027",
      currency: "JPY",
      tuitionFirstYear: 980000,
      mandatoryFeesFirstYear: 320000,
      estimatedFirstYearTotal: 1300000,
      verificationStatus: "officially_verified",
      sourceIds: ["src-hgu-biz"],
    },
    scholarships: [
      {
        id: "sch-hgu-intl",
        name: "International Student Tuition Reduction (Demo)",
        nameJa: "留学生授業料減免（デモ）",
        provider: "Harborlight Global University (Fictional)",
        amountDescription: "30% tuition reduction, first year",
        eligibilityNote: "Selection-based; typically requires strong grades and attendance. Never guaranteed.",
        competitive: true,
        verificationStatus: "institution_submitted",
        sourceIds: ["src-hgu-biz"],
      },
    ],
    sourceIds: ["src-hgu-biz"],
    sponsored: true,
    summary:
      "A four-year bilingual business degree combining Japanese business practice with digital-product coursework.",
    summaryJa: "日本のビジネス実務とデジタル領域を組み合わせた4年制のバイリンガル経営学プログラム。",
    uncertaintyNotes:
      "Scholarship selection ratios are not published; treat scholarship availability as uncertain.",
  },
  {
    id: "prog-hgu-mech",
    institutionId: "inst-hgu",
    name: "Mechanical Engineering Program (BEng)",
    nameJa: "機械工学科（工学士）",
    field: "engineering",
    campusId: "hgu-yokohama",
    languageOfInstruction: "japanese",
    durationYears: 4,
    degreeOrCredential: "Bachelor of Engineering",
    careerDirections: ["Manufacturing engineering", "CAD design", "Quality engineering"],
    admissionRoutes: [
      {
        id: "route-hgu-mech-intl",
        name: "International Student Entrance Exam (April intake)",
        nameJa: "外国人留学生入試（4月入学）",
        academicYear: "2027",
        applicationPeriodStart: "2026-10-01",
        applicationPeriodEnd: "2026-12-05",
        intakeDate: "2027-04-01",
        examType: "EJU (Science + Math 2) + interview",
        requirements: [req12y("r-hgu-mech-edu"), reqJa("r-hgu-mech-ja", "N2"), reqEju("r-hgu-mech-eju", true), reqInterview("r-hgu-mech-int")],
        sourceIds: ["src-hgu-eng"],
      },
    ],
    tuition: {
      id: "tui-hgu-mech",
      academicYear: "2027",
      currency: "JPY",
      tuitionFirstYear: 1150000,
      mandatoryFeesFirstYear: 400000,
      estimatedFirstYearTotal: 1550000,
      verificationStatus: "officially_verified",
      sourceIds: ["src-hgu-eng"],
    },
    scholarships: [],
    sourceIds: ["src-hgu-eng"],
    sponsored: false,
    summary:
      "A Japanese-taught engineering degree with EJU-based screening and strong manufacturing links.",
  },
  {
    id: "prog-kmu-mgmt",
    institutionId: "inst-kmu",
    name: "International Management Program (BA)",
    nameJa: "国際経営学科（学士）",
    field: "business",
    campusId: "kmu-osaka",
    languageOfInstruction: "japanese",
    durationYears: 4,
    degreeOrCredential: "Bachelor of Arts in Management",
    careerDirections: ["Trading company staff", "Logistics coordination", "Retail management"],
    admissionRoutes: [
      {
        id: "route-kmu-mgmt-intl",
        name: "International Student Recommendation Route",
        nameJa: "留学生推薦入試",
        academicYear: "2027",
        applicationPeriodStart: "2026-08-20",
        applicationPeriodEnd: "2026-10-30",
        intakeDate: "2027-04-01",
        examType: "Language-school recommendation + document screening + interview",
        requirements: [req12y("r-kmu-mgmt-edu"), reqJa("r-kmu-mgmt-ja", "N2"), reqInterview("r-kmu-mgmt-int"), reqAttendance("r-kmu-mgmt-att")],
        sourceIds: ["src-kmu-mgmt"],
      },
    ],
    tuition: {
      id: "tui-kmu-mgmt",
      academicYear: "2027",
      currency: "JPY",
      tuitionFirstYear: 850000,
      mandatoryFeesFirstYear: 280000,
      estimatedFirstYearTotal: 1130000,
      verificationStatus: "institution_submitted",
      sourceIds: ["src-kmu-mgmt"],
    },
    scholarships: [
      {
        id: "sch-kmu-kansai",
        name: "Kansai Study Support Grant (Demo)",
        provider: "Kawanami Metropolitan University (Fictional)",
        amountDescription: "¥30,000/month for selected students",
        eligibilityNote: "Limited slots; selection after enrollment. Never guaranteed.",
        competitive: true,
        verificationStatus: "needs_confirmation",
        sourceIds: ["src-kmu-mgmt"],
      },
    ],
    sourceIds: ["src-kmu-mgmt"],
    sponsored: false,
    summary:
      "A Kansai-based management degree with a recommendation route designed for language-school graduates.",
  },
  {
    id: "prog-kmu-tourism",
    institutionId: "inst-kmu",
    name: "Tourism Sciences Program (BA)",
    nameJa: "観光学科（学士）",
    field: "tourism",
    campusId: "kmu-osaka",
    languageOfInstruction: "japanese",
    durationYears: 4,
    degreeOrCredential: "Bachelor of Arts in Tourism",
    careerDirections: ["Tourism planning", "Airline ground staff", "Regional revitalization"],
    admissionRoutes: [
      {
        id: "route-kmu-tour-intl",
        name: "International Student Entrance Exam",
        nameJa: "外国人留学生入試",
        academicYear: "2027",
        applicationPeriodStart: "2026-09-10",
        applicationPeriodEnd: "2026-11-28",
        intakeDate: "2027-04-01",
        examType: "Japanese essay + interview",
        requirements: [req12y("r-kmu-tour-edu"), reqJa("r-kmu-tour-ja", "N2"), reqInterview("r-kmu-tour-int")],
        sourceIds: ["src-kmu-tour"],
      },
    ],
    tuition: {
      id: "tui-kmu-tour",
      academicYear: "2027",
      currency: "JPY",
      tuitionFirstYear: 820000,
      mandatoryFeesFirstYear: 260000,
      estimatedFirstYearTotal: 1080000,
      verificationStatus: "needs_confirmation",
      sourceIds: ["src-kmu-tour"],
      notes: "Fee table for AY2027 not yet published; figures based on AY2026.",
    },
    scholarships: [],
    sourceIds: ["src-kmu-tour"],
    sponsored: false,
    summary:
      "A tourism degree connected to Kansai's tourism industry, with fieldwork from the second year.",
    uncertaintyNotes: "AY2027 fees are estimated from AY2026 figures and need confirmation.",
  },
  {
    id: "prog-aidc-ai",
    institutionId: "inst-aidc",
    name: "AI Application Development (2-year Diploma)",
    nameJa: "AIアプリケーション開発コース（専門士・2年）",
    field: "it",
    campusId: "aidc-tokyo",
    languageOfInstruction: "japanese",
    durationYears: 2,
    degreeOrCredential: "Diploma (Senmonshi)",
    careerDirections: ["Junior AI engineer", "Web application developer", "Data annotation lead"],
    careerDirectionsJa: ["ジュニアAIエンジニア", "Webアプリ開発者", "データ運用リーダー"],
    admissionRoutes: [
      {
        id: "route-aidc-ai-intl",
        name: "International Student AO Route (April intake)",
        nameJa: "留学生AO入試（4月入学）",
        academicYear: "2027",
        applicationPeriodStart: "2026-09-01",
        applicationPeriodEnd: "2027-01-31",
        intakeDate: "2027-04-01",
        examType: "AO interview + basic logic test",
        requirements: [req12y("r-aidc-ai-edu"), reqJa("r-aidc-ai-ja", "N3", "N2 recommended for job hunting"), reqInterview("r-aidc-ai-int"), reqAttendance("r-aidc-ai-att")],
        sourceIds: ["src-aidc"],
      },
    ],
    tuition: {
      id: "tui-aidc-ai",
      academicYear: "2027",
      currency: "JPY",
      tuitionFirstYear: 780000,
      mandatoryFeesFirstYear: 350000,
      estimatedFirstYearTotal: 1130000,
      verificationStatus: "officially_verified",
      sourceIds: ["src-aidc"],
    },
    scholarships: [
      {
        id: "sch-aidc-early",
        name: "Early Application Fee Waiver (Demo)",
        provider: "Aozora AI Development College (Fictional)",
        amountDescription: "¥100,000 admission-fee waiver for applications before Nov 30",
        eligibilityNote: "Applies automatically to early complete applications. Confirm conditions with the school.",
        competitive: true,
        verificationStatus: "institution_submitted",
        sourceIds: ["src-aidc"],
      },
    ],
    sourceIds: ["src-aidc"],
    sponsored: true,
    summary:
      "A hands-on two-year course covering Python, machine-learning basics and web deployment, aimed at junior engineering roles.",
    summaryJa: "PythonとML基礎、Web開発を2年間で実践的に学び、ジュニアエンジニア就職を目指すコース。",
  },
  {
    id: "prog-aidc-web",
    institutionId: "inst-aidc",
    name: "Web Systems Development (2-year Diploma)",
    nameJa: "Webシステム開発コース（専門士・2年）",
    field: "it",
    campusId: "aidc-tokyo",
    languageOfInstruction: "japanese",
    durationYears: 2,
    degreeOrCredential: "Diploma (Senmonshi)",
    careerDirections: ["Frontend developer", "Backend developer", "QA engineer"],
    admissionRoutes: [
      {
        id: "route-aidc-web-intl",
        name: "International Student General Route",
        nameJa: "留学生一般入試",
        academicYear: "2027",
        applicationPeriodStart: "2026-10-01",
        applicationPeriodEnd: "2027-02-28",
        intakeDate: "2027-04-01",
        examType: "Document screening + interview",
        requirements: [req12y("r-aidc-web-edu"), reqJa("r-aidc-web-ja", "N3"), reqInterview("r-aidc-web-int")],
        sourceIds: ["src-aidc-web"],
      },
    ],
    tuition: {
      id: "tui-aidc-web",
      academicYear: "2027",
      currency: "JPY",
      tuitionFirstYear: 720000,
      mandatoryFeesFirstYear: 330000,
      estimatedFirstYearTotal: 1050000,
      verificationStatus: "institution_submitted",
      sourceIds: ["src-aidc-web"],
    },
    scholarships: [],
    sourceIds: ["src-aidc-web"],
    sponsored: false,
    summary:
      "A practical web-development course with team projects and a job-hunting support semester.",
  },
  {
    id: "prog-shc-hotel",
    institutionId: "inst-shc",
    name: "Hotel Management (2-year Diploma)",
    nameJa: "ホテルマネジメントコース（専門士・2年）",
    field: "hospitality",
    campusId: "shc-kyoto",
    languageOfInstruction: "japanese",
    durationYears: 2,
    degreeOrCredential: "Diploma (Senmonshi)",
    careerDirections: ["Hotel front desk", "Concierge", "Food & beverage supervisor"],
    careerDirectionsJa: ["ホテルフロント", "コンシェルジュ", "料飲サービス"],
    admissionRoutes: [
      {
        id: "route-shc-hotel-intl",
        name: "International Student AO Route",
        nameJa: "留学生AO入試",
        academicYear: "2027",
        applicationPeriodStart: "2026-09-01",
        applicationPeriodEnd: "2027-03-10",
        intakeDate: "2027-04-01",
        examType: "AO interview",
        requirements: [req12y("r-shc-hotel-edu"), reqJa("r-shc-hotel-ja", "N2", "customer-facing roles"), reqInterview("r-shc-hotel-int"), reqAttendance("r-shc-hotel-att")],
        sourceIds: ["src-shc"],
      },
    ],
    tuition: {
      id: "tui-shc-hotel",
      academicYear: "2027",
      currency: "JPY",
      tuitionFirstYear: 690000,
      mandatoryFeesFirstYear: 310000,
      estimatedFirstYearTotal: 1000000,
      verificationStatus: "officially_verified",
      sourceIds: ["src-shc"],
    },
    scholarships: [
      {
        id: "sch-shc-work",
        name: "Hotel Partner Work-Study Support (Demo)",
        provider: "Seiran Hospitality College (Fictional)",
        amountDescription: "Introduction to paid hotel internships (within legal work-hour limits)",
        eligibilityNote: "Availability depends on partner hotels and Japanese level. Not a scholarship payment.",
        competitive: true,
        verificationStatus: "institution_submitted",
        sourceIds: ["src-shc"],
      },
    ],
    sourceIds: ["src-shc"],
    sponsored: false,
    summary:
      "A Kyoto-based hotel course with practical training in partner hotels and strong hospitality-industry placement support.",
  },
  {
    id: "prog-shc-tourism",
    institutionId: "inst-shc",
    name: "Global Tourism Service (2-year Diploma)",
    nameJa: "グローバル観光サービスコース（専門士・2年）",
    field: "tourism",
    campusId: "shc-fukuoka",
    languageOfInstruction: "japanese",
    durationYears: 2,
    degreeOrCredential: "Diploma (Senmonshi)",
    careerDirections: ["Travel agency staff", "Airport ground service", "Inbound tour coordination"],
    admissionRoutes: [
      {
        id: "route-shc-tour-intl",
        name: "International Student General Route",
        nameJa: "留学生一般入試",
        academicYear: "2027",
        applicationPeriodStart: "2026-10-01",
        applicationPeriodEnd: "2027-02-20",
        intakeDate: "2027-04-01",
        examType: "Document screening + Japanese conversation check",
        requirements: [req12y("r-shc-tour-edu"), reqJa("r-shc-tour-ja", "N3", "N2 recommended"), reqInterview("r-shc-tour-int")],
        sourceIds: ["src-shc-tour"],
      },
    ],
    tuition: {
      id: "tui-shc-tour",
      academicYear: "2027",
      currency: "JPY",
      tuitionFirstYear: 650000,
      mandatoryFeesFirstYear: 300000,
      estimatedFirstYearTotal: 950000,
      verificationStatus: "institution_submitted",
      sourceIds: ["src-shc-tour"],
    },
    scholarships: [],
    sourceIds: ["src-shc-tour"],
    sponsored: false,
    summary:
      "A Fukuoka-based tourism-service course focused on inbound tourism and airport ground operations.",
  },
  {
    id: "prog-mdc-visual",
    institutionId: "inst-mdc",
    name: "Visual & UI Design (3-year Advanced Diploma)",
    nameJa: "ビジュアル＆UIデザインコース（高度専門士・3年）",
    field: "design",
    campusId: "mdc-nagoya",
    languageOfInstruction: "japanese",
    durationYears: 3,
    degreeOrCredential: "Advanced Diploma (Kodo Senmonshi)",
    careerDirections: ["UI designer", "Graphic designer", "Web designer"],
    admissionRoutes: [
      {
        id: "route-mdc-visual-intl",
        name: "International Student Portfolio Route",
        nameJa: "留学生ポートフォリオ入試",
        academicYear: "2027",
        applicationPeriodStart: "2026-09-15",
        applicationPeriodEnd: "2027-01-20",
        intakeDate: "2027-04-01",
        examType: "Portfolio review + interview",
        requirements: [req12y("r-mdc-visual-edu"), reqJa("r-mdc-visual-ja", "N3"), reqPortfolio("r-mdc-visual-port"), reqInterview("r-mdc-visual-int")],
        sourceIds: ["src-mdc"],
      },
    ],
    tuition: {
      id: "tui-mdc-visual",
      academicYear: "2027",
      currency: "JPY",
      tuitionFirstYear: 880000,
      mandatoryFeesFirstYear: 370000,
      estimatedFirstYearTotal: 1250000,
      verificationStatus: "institution_submitted",
      sourceIds: ["src-mdc"],
    },
    scholarships: [
      {
        id: "sch-mdc-portfolio",
        name: "Portfolio Excellence Award (Demo)",
        provider: "Mirai Design College (Fictional)",
        amountDescription: "Up to ¥200,000 tuition reduction for outstanding portfolios",
        eligibilityNote: "Awarded to a small number of applicants per year. Never guaranteed.",
        competitive: true,
        verificationStatus: "institution_submitted",
        sourceIds: ["src-mdc"],
      },
    ],
    sourceIds: ["src-mdc"],
    sponsored: false,
    summary:
      "A three-year design course combining graphic fundamentals with UI/UX practice and a graduation portfolio.",
  },
  {
    id: "prog-mdc-game",
    institutionId: "inst-mdc",
    name: "Game Graphics (2-year Diploma)",
    nameJa: "ゲームグラフィックコース（専門士・2年）",
    field: "design",
    campusId: "mdc-nagoya",
    languageOfInstruction: "japanese",
    durationYears: 2,
    degreeOrCredential: "Diploma (Senmonshi)",
    careerDirections: ["2D/3D artist", "Motion designer"],
    admissionRoutes: [
      {
        id: "route-mdc-game-intl",
        name: "International Student General Route",
        nameJa: "留学生一般入試",
        academicYear: "2027",
        applicationPeriodStart: "2026-10-01",
        applicationPeriodEnd: "2026-12-15",
        intakeDate: "2027-04-01",
        examType: "Drawing test + interview",
        requirements: [req12y("r-mdc-game-edu"), reqJa("r-mdc-game-ja", "N3"), reqInterview("r-mdc-game-int")],
        sourceIds: ["src-mdc-game"],
      },
    ],
    tuition: {
      id: "tui-mdc-game",
      academicYear: "2027",
      currency: "JPY",
      tuitionFirstYear: 860000,
      mandatoryFeesFirstYear: 360000,
      estimatedFirstYearTotal: 1220000,
      verificationStatus: "needs_confirmation",
      sourceIds: ["src-mdc-game"],
    },
    scholarships: [],
    sourceIds: ["src-mdc-game"],
    sponsored: false,
    summary: "A two-year game-art course covering 2D, 3D and motion graphics tools.",
    uncertaintyNotes: "AY2027 material fees are pending publication.",
  },
  {
    id: "prog-kcc-care",
    institutionId: "inst-kcc",
    name: "Certified Care Worker Course (2-year Diploma)",
    nameJa: "介護福祉士養成コース（専門士・2年）",
    field: "care",
    campusId: "kcc-sendai",
    languageOfInstruction: "japanese",
    durationYears: 2,
    degreeOrCredential: "Diploma + eligibility for national Care Worker exam",
    careerDirections: ["Certified care worker (kaigo fukushishi)", "Care facility staff"],
    careerDirectionsJa: ["介護福祉士", "介護施設スタッフ"],
    admissionRoutes: [
      {
        id: "route-kcc-care-intl",
        name: "International Student Route with Facility Scholarship",
        nameJa: "留学生入試（施設奨学金併願可）",
        academicYear: "2027",
        applicationPeriodStart: "2026-08-01",
        applicationPeriodEnd: "2027-02-15",
        intakeDate: "2027-04-01",
        examType: "Document screening + interview",
        requirements: [req12y("r-kcc-care-edu"), reqJa("r-kcc-care-ja", "N3", "N2 needed for national exam"), reqInterview("r-kcc-care-int")],
        sourceIds: ["src-kcc"],
      },
    ],
    tuition: {
      id: "tui-kcc-care",
      academicYear: "2027",
      currency: "JPY",
      tuitionFirstYear: 620000,
      mandatoryFeesFirstYear: 280000,
      estimatedFirstYearTotal: 900000,
      verificationStatus: "officially_verified",
      sourceIds: ["src-kcc"],
    },
    scholarships: [
      {
        id: "sch-kcc-facility",
        name: "Care Facility Sponsorship (Demo)",
        provider: "Partner care facilities (Fictional)",
        amountDescription: "Up to full tuition in exchange for post-graduation employment commitment",
        eligibilityNote: "Requires a separate contract with a care facility; conditions vary and include a work obligation. Read contracts carefully.",
        competitive: true,
        verificationStatus: "institution_submitted",
        sourceIds: ["src-kcc"],
      },
    ],
    sourceIds: ["src-kcc"],
    sponsored: false,
    summary:
      "A care-work course leading to national certification eligibility, with facility-sponsored scholarship options.",
    uncertaintyNotes:
      "Facility sponsorships involve employment obligations. The platform recommends reviewing contracts with a trusted adviser.",
  },
  {
    id: "prog-tit-info",
    institutionId: "inst-tit",
    name: "Information Engineering Program (BEng)",
    nameJa: "情報工学科（工学士）",
    field: "it",
    campusId: "tit-hiroshima",
    languageOfInstruction: "japanese",
    durationYears: 4,
    degreeOrCredential: "Bachelor of Engineering",
    careerDirections: ["Software engineer", "Systems engineer", "Embedded engineer"],
    admissionRoutes: [
      {
        id: "route-tit-info-intl",
        name: "International Student Entrance Exam (EJU route)",
        nameJa: "外国人留学生入試（EJU利用）",
        academicYear: "2027",
        applicationPeriodStart: "2026-11-01",
        applicationPeriodEnd: "2027-01-10",
        intakeDate: "2027-04-01",
        examType: "EJU (Japanese + Math 2) + interview",
        requirements: [req12y("r-tit-info-edu"), reqJa("r-tit-info-ja", "N2"), reqEju("r-tit-info-eju", true), reqInterview("r-tit-info-int")],
        sourceIds: ["src-tit"],
      },
    ],
    tuition: {
      id: "tui-tit-info",
      academicYear: "2027",
      currency: "JPY",
      tuitionFirstYear: 1050000,
      mandatoryFeesFirstYear: 380000,
      estimatedFirstYearTotal: 1430000,
      verificationStatus: "officially_verified",
      sourceIds: ["src-tit"],
    },
    scholarships: [
      {
        id: "sch-tit-merit",
        name: "Engineering Merit Scholarship (Demo)",
        provider: "Tsubasa Institute of Technology (Fictional)",
        amountDescription: "50% tuition reduction for top EJU scorers",
        eligibilityNote: "Limited to a small number of admitted students each year. Never guaranteed.",
        competitive: true,
        verificationStatus: "institution_submitted",
        sourceIds: ["src-tit"],
      },
    ],
    sourceIds: ["src-tit"],
    sponsored: false,
    summary:
      "A four-year information-engineering degree in Hiroshima with EJU-based merit scholarships.",
  },
  {
    id: "prog-obc-business",
    institutionId: "inst-obc",
    name: "Global Business Practice (2-year Diploma)",
    nameJa: "グローバルビジネス実務コース（専門士・2年）",
    field: "business",
    campusId: "obc-okinawa",
    languageOfInstruction: "japanese",
    durationYears: 2,
    degreeOrCredential: "Diploma (Senmonshi)",
    careerDirections: ["Trade operations", "Sales support", "Office administration"],
    admissionRoutes: [
      {
        id: "route-obc-biz-intl",
        name: "International Student General Route (October intake)",
        nameJa: "留学生一般入試（10月入学）",
        academicYear: "2026",
        applicationPeriodStart: "2026-03-01",
        applicationPeriodEnd: "2026-06-10",
        intakeDate: "2026-10-01",
        examType: "Document screening + interview",
        requirements: [req12y("r-obc-biz-edu"), reqJa("r-obc-biz-ja", "N3"), reqInterview("r-obc-biz-int")],
        sourceIds: ["src-obc"],
      },
    ],
    tuition: {
      id: "tui-obc-biz",
      academicYear: "2026",
      currency: "JPY",
      tuitionFirstYear: 600000,
      mandatoryFeesFirstYear: 250000,
      estimatedFirstYearTotal: 850000,
      verificationStatus: "outdated",
      sourceIds: ["src-obc"],
      notes: "Based on the AY2026 guide; the AY2027 guide has not been checked yet.",
    },
    scholarships: [],
    sourceIds: ["src-obc"],
    sponsored: false,
    summary:
      "A low-cost business-practice course in Okinawa. Shown to demonstrate deadline and outdated-data handling.",
    uncertaintyNotes:
      "The listed October 2026 application period may have passed and AY2027 information is not yet verified.",
  },
  {
    id: "prog-hgu-hospitality",
    institutionId: "inst-hgu",
    name: "Global Hospitality Management (BBA)",
    nameJa: "グローバルホスピタリティ経営学科（経営学士）",
    field: "hospitality",
    campusId: "hgu-yokohama",
    languageOfInstruction: "bilingual",
    durationYears: 4,
    degreeOrCredential: "Bachelor of Business Administration",
    careerDirections: ["Hotel management track", "Airline service planning", "Luxury retail"],
    admissionRoutes: [
      {
        id: "route-hgu-hosp-intl",
        name: "International Student Entrance Exam (April intake)",
        nameJa: "外国人留学生入試（4月入学）",
        academicYear: "2027",
        applicationPeriodStart: "2026-09-01",
        applicationPeriodEnd: "2026-11-14",
        intakeDate: "2027-04-01",
        examType: "Document screening + English or Japanese essay + interview",
        requirements: [req12y("r-hgu-hosp-edu"), reqJa("r-hgu-hosp-ja", "N2"), reqInterview("r-hgu-hosp-int")],
        sourceIds: ["src-hgu-biz"],
      },
    ],
    tuition: {
      id: "tui-hgu-hosp",
      academicYear: "2027",
      currency: "JPY",
      tuitionFirstYear: 1020000,
      mandatoryFeesFirstYear: 330000,
      estimatedFirstYearTotal: 1350000,
      verificationStatus: "officially_verified",
      sourceIds: ["src-hgu-biz"],
    },
    scholarships: [
      {
        id: "sch-hgu-hosp",
        name: "International Student Tuition Reduction (Demo)",
        provider: "Harborlight Global University (Fictional)",
        amountDescription: "30% tuition reduction, first year",
        eligibilityNote: "Selection-based. Never guaranteed.",
        competitive: true,
        verificationStatus: "institution_submitted",
        sourceIds: ["src-hgu-biz"],
      },
    ],
    sourceIds: ["src-hgu-biz"],
    sponsored: false,
    summary:
      "A four-year bilingual hospitality-management degree bridging hotel operations and business strategy.",
  },
];

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export function getInstitution(id: string): Institution | undefined {
  return demoInstitutions.find((i) => i.id === id);
}

export function getProgram(id: string): Program | undefined {
  return demoPrograms.find((p) => p.id === id);
}

export function getSource(id: string): OfficialSource | undefined {
  return demoSources.find((s) => s.id === id);
}

export function getCampus(program: Program) {
  const inst = getInstitution(program.institutionId);
  return inst?.campuses.find((c) => c.id === program.campusId);
}
