/**
 * ==================================================================
 *  SINGLE SOURCE OF TRUTH — edit THIS file, the whole site updates.
 *
 *  How it works:
 *  - Section 1 (PROFILE) holds facts used in many places at once.
 *    Change `certs.toeic` here and the hero badge, subheadline,
 *    skills list and fact sheet all change together.
 *  - Later sections reference `profile` and `projects`, so one edit
 *    ripples everywhere it should.
 *  - No component contains copy — they only render what's here.
 * ==================================================================
 */

/* ============ 1. PROFILE — edit once, used everywhere ============ */

export const profile = {
  name: 'Puspa Gotame',
  nameJa: 'プスパ・ゴタメ',
  initials: 'PG',
  roleTarget: 'AI/DX Consultant Candidate',
  roleTargetJa: 'AI・DXコンサルタント志望',
  location: 'Tokyo, Japan',
  locationJa: '東京',

  university: 'Teikyo University',
  degree: 'Economics / Business Administration',

  // Certifications & language scores (referenced all over the site)
  certs: {
    jlpt: 'N1',
    toeic: 905,
    mos: ['MOS Excel', 'MOS Word'],
  },
  languages: [
    { name: 'Japanese', level: 'JLPT N1' },
    { name: 'English', level: 'TOEIC 905' },
    { name: 'Nepali', level: 'native' },
    { name: 'Hindi', level: 'conversational' },
  ],
  frontline: 'McDonald’s (2+ yrs) · Convenience store operations',
  careerGoal: 'AI Product Manager / AI-DX Consultant',

  // ---- Contact & links (REPLACE with your real links) ----
  email: 'Puspagotame1588@gmail.com',
  github: 'https://github.com/puspagotame1588-create', // TODO: confirm your GitHub profile URL
  linkedin: 'https://www.linkedin.com/in/your-linkedin-id', // TODO: replace with your LinkedIn URL

  // ---- Resume: put your PDF at public/resume/Puspa_Gotame_Resume.pdf ----
  resumeUrl: '/resume/Puspa_Gotame_Resume.pdf',

  // ---- Portfolio video: YouTube embed URL, or '' for the placeholder ----
  // e.g. 'https://www.youtube.com/embed/VIDEO_ID'
  videoEmbedUrl: '',
}

// Small helpers so scores are always written consistently
const JLPT = `JLPT ${profile.certs.jlpt}`
const TOEIC = `TOEIC ${profile.certs.toeic}`

/* ============ 2. NAVIGATION (navbar + footer share this) ============ */

export const nav = [
  { href: '#video', label: 'Video' },
  { href: '#projects', label: 'Projects' },
  { href: '#case-study', label: 'Case Study' },
  { href: '#skills', label: 'Skills' },
  { href: '#about', label: 'About' },
  { href: '#roadmap', label: 'Roadmap' },
  { href: '#contact', label: 'Contact' },
]

/* ============ 3. HERO ============ */

export const hero = {
  availability: {
    en: 'Open to 2026 new-grad & internship roles',
    ja: '26卒・インターン',
  },
  // headline = plain part + gradient part
  headline: { pre: 'I turn real workplace problems into ', gradient: 'working AI automation.' },
  // subheadline segments; bold: true renders emphasized
  sub: [
    { t: 'AI/DX consultant candidate in Japan — combining ' },
    { t: `${JLPT} Japanese`, bold: true },
    { t: ', ' },
    { t: `${TOEIC} English`, bold: true },
    { t: ', a business degree, and 2+ years of frontline operations into practical AI tools: email-to-action agents, RAG assistants, and bilingual training automation.' },
  ],
  // trust badges (JLPT/TOEIC pulled from profile automatically)
  badges: [
    { label: JLPT, ja: '日本語能力試験' },
    { label: TOEIC },
    { label: 'Japan-based', ja: profile.locationJa },
    { label: 'AI/DX Portfolio' },
    { label: 'Business × Automation' },
  ],
  commandCenterCaption: 'Drag the command center — my three systems orbit one core. Explore them below.',
  // the 3D core in the middle of the command center (a torii gate = the
  // "bridge between business and technology")
  core: { label: 'AI CORE', sub: 'business ⇄ technology · 橋渡し' },
  dragHint: 'drag to rotate · 回転できます',
}

/* ============ 4. PORTFOLIO VIDEO ============ */

export const video = {
  title: 'Three minutes: who I am and what I build',
  lead: 'A short introduction covering my background, my three AI/DX projects, and why I fit AI consulting roles in Japan.',
  summary: [
    {
      q: 'Who I am',
      a: `Business student in Japan (${profile.university}, ${profile.degree.split(' / ')[0]}) with ${JLPT}, ${TOEIC}, and 2+ years of frontline operations at McDonald’s and a convenience store.`,
    },
    {
      q: 'What I build',
      a: 'Practical AI automation — an email-to-action agent, a bilingual customer-service training coach, and a RAG knowledge assistant — all born from problems I saw at work.',
    },
    {
      q: 'Why AI/DX consulting',
      a: 'I sit between business and technology: I can map an operation in Japanese, spec the automation in English, and build the working prototype myself.',
    },
    {
      q: 'Roles I’m targeting',
      a: 'AI/DX Consultant · AI Solutions Consultant · AI Product & Automation roles — new-grad and internship positions in Japan.',
    },
  ],
}

/* ============ 5. PROJECTS ============
   Each project also powers its module in the hero command center.
   The FIRST project is the flagship used by the case-study section. */

export const projects = [
  {
    id: 'emailAgent',
    tone: 'pulse', // pulse (blue) | beni (vermillion) | cyan
    tag: 'Flagship · GenAI Automation',
    title: 'AI Email-to-Action Operations Agent',
    titleJa: 'メール自動アクション化エージェント',
    shortLabel: 'Email → Action Agent', // used in hero command center
    shortSub: 'Gmail · Sheets · Calendar',
    problem: 'Students and workers miss important emails, deadlines, and required actions buried in crowded inboxes.',
    solution: 'An agent reads Gmail, classifies priority, extracts deadlines, logs everything to Google Sheets, creates Calendar tasks, and drafts replies — with a human approving before anything is sent.',
    tools: ['n8n', 'Gmail API', 'OpenAI/Claude API', 'Google Sheets', 'Google Calendar', 'Python'],
    value: 'Turns an unstructured inbox into a managed task pipeline — fewer missed deadlines, faster response, and an audit trail of every decision.',
    status: { label: 'Working prototype', live: true },
    metrics: [
      { value: 90, suffix: '%+', label: 'classification accuracy (target)' },
      { value: 5, suffix: ' hrs', label: 'saved per month (pilot est.)' },
    ],
    talkingPoint: '“I designed the workflow, the prompt logic, and the human-review step — I can walk through every node and explain why it exists from a business-risk perspective.”',
    signal: 'GenAI automation · workflow design · API integration · business process improvement',
    demo: '#', // TODO: live demo or Loom walkthrough link
    github: '#', // TODO: GitHub repo link
  },
  {
    id: 'trainingCoach',
    tone: 'beni',
    tag: 'Frontline DX · Japan Context',
    title: 'Japanese Convenience Store AI Training Coach',
    titleJa: 'コンビニ接客AIトレーニングコーチ',
    shortLabel: 'AI Training Coach',
    shortSub: '日本語接客 Roleplay',
    problem: 'Foreign staff struggle with Japanese customer-service phrases, payment situations, and reporting mistakes to managers — I lived this problem myself.',
    solution: 'An AI roleplay coach that simulates real store situations: greetings, customer questions, payments, complaint handling, and manager communication — with feedback on politeness and phrasing.',
    tools: ['LLM roleplay prompts', 'Speech-friendly UI', 'Scenario library', 'JP/EN localization'],
    value: 'Cuts onboarding time for foreign staff and reduces service errors — a real pain point for Japan’s labor-short retail sector.',
    status: { label: 'In development', live: false },
    metrics: [
      { value: 20, suffix: '+', label: 'real store scenarios' },
      { value: 2, suffix: ' langs', label: 'JP/EN bilingual feedback' },
    ],
    talkingPoint: '“This came from my own first weeks behind a register in Japan — I know exactly which situations break new foreign staff, so the scenarios are real, not invented.”',
    signal: 'Japanese context · frontline DX · training automation · localization',
    demo: '#',
    github: '#',
  },
  {
    id: 'ragAssistant',
    tone: 'cyan',
    tag: 'Enterprise GenAI · Knowledge',
    title: 'RAG Company Knowledge Assistant',
    titleJa: '社内ナレッジRAGアシスタント',
    shortLabel: 'RAG Knowledge Assistant',
    shortSub: 'Docs · Citations',
    problem: 'Employees waste time digging through manuals, rules, PDFs, and internal documents to answer routine questions.',
    solution: 'A retrieval-augmented assistant that answers questions from uploaded documents and always cites its sources, so answers stay verifiable and trustworthy.',
    tools: ['RAG pipeline', 'Vector database', 'Embeddings', 'Python', 'Citation UI'],
    value: 'Shrinks document-search time from minutes to seconds and keeps institutional knowledge accessible — with citations for responsible AI use.',
    status: { label: 'In development', live: false },
    metrics: [
      { value: 100, suffix: '%', label: 'answers with citations' },
      { value: 60, suffix: 's → 5s', label: 'target lookup time' },
    ],
    talkingPoint: '“I can explain chunking, embeddings, retrieval quality, and why citations matter for enterprise trust — in Japanese or English.”',
    signal: 'Enterprise GenAI · document AI · knowledge management · responsible AI',
    demo: '#',
    github: '#',
  },
]

export const projectsSection = {
  title: 'Built from real problems, not tutorials',
  lead: "Each project starts with an operational problem I personally experienced, and ends with a measurable business outcome. Every card is an interview conversation I'm ready to have.",
  footnote: 'Metrics marked “target / pilot est.” are measured goals, updated as each project ships.',
}

/* ============ 6. CASE STUDY (deep-dive on the flagship project) ============ */

export const flagship = projects[0] // ← case study follows the first project automatically

export const caseStudy = {
  lead: 'How I approach automation like a consultant: define the problem, design the workflow, put AI where it earns its keep, and keep a human accountable for every outgoing action.',
  flow: [
    { step: '01', title: 'Problem', ja: '課題', desc: 'Important emails, deadlines, and actions get missed in a crowded inbox.', tone: 'beni' },
    { step: '02', title: 'Workflow', ja: '設計', desc: 'n8n watches Gmail and routes every new message into the pipeline.', tone: 'pulse' },
    { step: '03', title: 'AI Decision', ja: 'AI判定', desc: 'The LLM classifies priority, extracts deadlines, and proposes the next action.', tone: 'pulse' },
    { step: '04', title: 'Human Review', ja: '人の承認', desc: 'Nothing is sent automatically — a person approves or edits every draft.', tone: 'cyan' },
    { step: '05', title: 'Output', ja: '実行', desc: 'Sheets log, Calendar tasks, and polished replies — all traceable.', tone: 'cyan' },
    { step: '06', title: 'Business Impact', ja: '効果', desc: 'Fewer missed deadlines, faster responses, and hours back every month.', tone: 'white' },
  ],
  metrics: [
    { value: 80, suffix: '%', label: 'faster first response', note: 'target vs. manual triage' },
    { value: 95, suffix: '%', label: 'fewer missed deadlines', note: 'target after full rollout' },
    { value: 90, suffix: '%+', label: 'auto-classification accuracy', note: 'measured on pilot inbox' },
    { value: 5, suffix: 'h', label: 'saved per month', note: 'pilot estimate, per user' },
  ],
  metricsFootnote: 'Targets are stated as design goals and updated with measured results as the pilot expands.',
}

/* ---- Interactive demo: pipeline stages + sample emails ---- */

export const demo = {
  stages: [
    { id: 'inbox', label: 'Email received', ja: '受信' },
    { id: 'classify', label: 'AI classification', ja: '優先度判定' },
    { id: 'extract', label: 'Deadline extraction', ja: '期限抽出' },
    { id: 'log', label: 'Sheets + Calendar', ja: '記録・登録' },
    { id: 'draft', label: 'Draft reply', ja: '返信案作成' },
    { id: 'review', label: 'Human review', ja: '人による承認' },
  ],
  samples: [
    {
      from: 'prof.tanaka@teikyo-u.ac.jp',
      subject: '【重要】期末レポート提出について',
      preview: 'レポートは7月18日（金）17:00までに提出してください…',
      log: [
        '→ New email from prof.tanaka@teikyo-u.ac.jp',
        '✓ Priority: HIGH · Category: Academic / Deadline',
        '✓ Deadline found: Jul 18 (Fri) 17:00 JST',
        '✓ Logged to Sheets · Calendar task “期末レポート提出” created',
        '✓ Draft reply (polite JP): 「承知いたしました。期限までに提出いたします。」',
        '⏸ Waiting for human approval… nothing is sent automatically.',
      ],
      result: { priority: 'HIGH', action: 'Calendar task + drafted reply', decision: 'Human approves → sent' },
    },
    {
      from: 'manager@store-shift.jp',
      subject: 'シフト変更のお願い（今週土曜）',
      preview: '今週土曜日のシフトを17時からに変更できますか…',
      log: [
        '→ New email from manager@store-shift.jp',
        '✓ Priority: MEDIUM · Category: Work / Scheduling',
        '✓ Date reference found: Saturday 17:00 (tentative)',
        '✓ Logged to Sheets · Calendar hold created (pending confirm)',
        '✓ Draft reply: availability confirmation in polite Japanese',
        '⏸ Waiting for human approval… you decide, the AI prepares.',
      ],
      result: { priority: 'MEDIUM', action: 'Calendar hold + drafted confirmation', decision: 'Human edits → sent' },
    },
    {
      from: 'newsletter@shopping-mall.com',
      subject: '☆今週のセール情報☆',
      preview: '今だけ全品20%オフ！お見逃しなく…',
      log: [
        '→ New email from newsletter@shopping-mall.com',
        '✓ Priority: LOW · Category: Promotion',
        '– No deadline relevant to the user',
        '✓ Logged to Sheets (archive) · no calendar action',
        '– No reply needed',
        '✓ Auto-archived. Knowing when NOT to act is part of the design.',
      ],
      result: { priority: 'LOW', action: 'Archived, zero noise', decision: 'No human time used' },
    },
  ],
}

/* ============ 7. BEFORE / AFTER ============ */

export const beforeAfter = {
  title: 'Same inbox. Different system.',
  lead: "DX is not about tools — it's about redesigning who does what. Toggle to compare the daily routine before and after the agent.",
  modes: {
    before: {
      title: 'Manual workflow',
      ja: '手作業',
      time: '~45 min / day',
      steps: [
        { t: 'Open inbox, scan 40+ unread emails', cost: '10 min' },
        { t: 'Re-read important ones to find deadlines', cost: '10 min' },
        { t: 'Copy dates into calendar by hand', cost: '8 min' },
        { t: 'Write each reply from scratch', cost: '15 min' },
        { t: 'Hope nothing was missed', cost: 'risk: high' },
      ],
      verdict: 'Attention-dependent. One busy day = missed deadline.',
    },
    after: {
      title: 'AI-assisted workflow',
      ja: 'AI活用',
      time: '~8 min / day',
      steps: [
        { t: 'Agent triages every email on arrival', cost: 'auto' },
        { t: 'Deadlines extracted and logged to Sheets', cost: 'auto' },
        { t: 'Calendar tasks created with reminders', cost: 'auto' },
        { t: 'Replies pre-drafted in polite Japanese', cost: 'auto' },
        { t: 'Human reviews a short action list & approves', cost: '8 min' },
      ],
      verdict: 'Process-dependent. The system catches what attention misses.',
    },
  },
}

/* ============ 8. SKILLS ============ */

export const skills = {
  title: 'Business fluency meets technical build skills',
  lead: 'Not a checklist — a toolkit organized the way AI/DX consulting work is actually structured.',
  groups: [
    {
      title: 'AI & Data',
      ja: 'AI・データ',
      tone: 'pulse',
      items: ['LLMs (OpenAI / Claude)', 'Prompt engineering', 'RAG pipelines', 'Vector databases', 'Python', 'Data analysis', 'Output evaluation'],
    },
    {
      title: 'Automation',
      ja: '自動化',
      tone: 'cyan',
      items: ['n8n workflows', 'REST APIs', 'Gmail API', 'Google Sheets', 'Google Calendar', 'Webhooks', 'Workflow design'],
    },
    {
      title: 'Product & Consulting',
      ja: 'プロダクト・コンサル',
      tone: 'beni',
      items: ['Problem discovery', 'Business process mapping', 'KPI thinking', 'UX basics', 'Documentation', 'Stakeholder communication'],
    },
    {
      title: 'Languages',
      ja: '言語',
      tone: 'white',
      // ← derived from profile.languages: edit there, updates here
      items: profile.languages.map((l) => `${l.name} — ${l.level}`),
    },
  ],
  // ← derived from profile.certs
  certs: [JLPT, TOEIC, ...profile.certs.mos],
}

/* ============ 9. ABOUT ============ */

export const about = {
  title: 'Frontline experience is my unfair advantage',
  en: {
    lead: 'Business student in Japan. Builder of practical AI automation.',
    paras: [
      `I am a Nepali international student at ${profile.university} (${profile.degree}), living and working in Japan. Alongside my degree, I have spent 2+ years on the frontline — McDonald’s and convenience store operations — learning how Japanese workplaces actually run: the standards, the pace, and the small failures that cost real money.`,
      'That frontline view is where my AI work starts. I don’t build demos for technology’s sake — I build tools for problems I have personally watched happen: missed emails and deadlines, foreign staff struggling with customer-service Japanese, teams losing time searching internal documents.',
      `My goal is to grow into an ${profile.careerGoal} — the person who can sit with business stakeholders in Japanese, define the problem precisely, and then build (or direct) the automation that solves it.`,
    ],
  },
  ja: {
    lead: '現場を知る、AI自動化を作るビジネス学生です。',
    paras: [
      `帝京大学で経済学・経営学を学ぶ、ネパール出身の留学生です。日本語（${JLPT}）と英語（${TOEIC}）でのコミュニケーションに加え、マクドナルドで2年以上、コンビニエンスストアでの勤務を通じて、日本の現場のオペレーションを実際に経験してきました。`,
      'その経験から「現場の課題を理解し、テクノロジーで解決する」ことに強い関心を持ち、現在はメール自動処理エージェント、RAGナレッジアシスタント、接客トレーニングAIなど、実務に直結するAIツールを自ら開発しています。',
      '将来の目標は、ビジネスと技術の橋渡しができるAI/DXコンサルタント・AIプロダクトマネージャーとして、日本企業のDX推進に貢献することです。',
    ],
  },
  // fact sheet — derived from profile where possible
  facts: [
    { k: 'University', v: `${profile.university} — ${profile.degree}` },
    { k: 'Languages', v: profile.languages.map((l) => (l.level.startsWith('JLPT') || l.level.startsWith('TOEIC') ? `${l.name} (${l.level})` : l.name)).join(' · ') },
    { k: 'Frontline experience', v: profile.frontline },
    { k: 'Certifications', v: [JLPT, TOEIC, ...profile.certs.mos].join(' · ') },
    { k: 'Career goal', v: profile.careerGoal },
  ],
}

/* ============ 10. ROADMAP ============
   status: 'done' | 'now' | 'next' — move 'now' forward as you progress */

export const roadmap = {
  title: 'A deliberate 5-month path to the target role',
  lead: 'Not casual learning — a scheduled build program where every month produces something a recruiter can inspect.',
  months: [
    {
      m: 'Month 1',
      title: 'AI automation foundations',
      ja: '自動化の基礎',
      desc: 'n8n, APIs, Gmail/Sheets/Calendar integration, prompt design. Shipped the first working email pipeline.',
      status: 'done',
    },
    {
      m: 'Month 2',
      title: 'RAG + document AI',
      ja: 'RAG・文書AI',
      desc: 'Embeddings, vector search, chunking strategy, citation UX. Building the knowledge assistant.',
      status: 'done',
    },
    {
      m: 'Month 3',
      title: 'Agents + evaluation',
      ja: 'エージェント・評価',
      desc: 'Multi-step agent design, human-in-the-loop patterns, measuring accuracy and failure cases.',
      status: 'now',
    },
    {
      m: 'Month 4',
      title: 'Portfolio case studies',
      ja: 'ケーススタディ化',
      desc: 'Turning each build into a documented case study: metrics, demo videos, and write-ups.',
      status: 'next',
    },
    {
      m: 'Month 5',
      title: 'Applications + interviews',
      ja: '応募・面接',
      desc: 'Targeting AI/DX consulting and AI product roles — ready to demo, explain, and defend every project.',
      status: 'next',
    },
  ],
}

/* ============ 11. JAPAN FIT ============ */

export const japanFit = {
  title: 'Why I fit AI/DX roles in Japan',
  lead: "Consulting firms in Japan need people who can hold a client conversation in Japanese, understand the operation, and prototype the fix. That intersection is exactly what I've been building.",
  reasons: [
    {
      icon: '接',
      title: 'I know Japanese service culture from the inside',
      ja: '接客文化の理解',
      desc: '2+ years serving Japanese customers — omotenashi, hourensou, and operational standards are lived experience, not textbook knowledge.',
    },
    {
      icon: '語',
      title: 'Bilingual at a professional level',
      ja: 'バイリンガル',
      desc: `${JLPT} Japanese for client conversations and documentation; ${TOEIC} English for global teams and technical sources.`,
    },
    {
      icon: '営',
      title: 'Business first, technology second',
      ja: 'ビジネス視点',
      desc: 'Economics/Business Administration training means I frame every AI idea as cost, risk, and process improvement — the way clients think.',
    },
    {
      icon: '現',
      title: 'Real frontline operations experience',
      ja: '現場経験',
      desc: 'I have executed the workflows that DX projects try to improve. I know where digital tools break down at the counter.',
    },
    {
      icon: '築',
      title: 'I build, not just propose',
      ja: '実装力',
      desc: 'Working prototypes with n8n, Python, LLM APIs, and RAG — I can demo the solution, not only describe it on a slide.',
    },
    {
      icon: '橋',
      title: 'Motivated to bridge business and technology',
      ja: '橋渡し',
      desc: 'My goal is the translator role: turning stakeholder needs into AI systems, and AI capabilities into business language.',
    },
  ],
}

/* ============ 12. RECRUITER / CONTACT ============ */

export const recruiter = {
  title: 'Everything you need to evaluate me, in one place',
  lead: 'Resume, code, and a direct line. If my profile looks like a fit, I can walk you through any project live — in Japanese or English.',
  status: [
    { text: 'Available for internship / new-grad opportunities', ja: 'インターン・新卒応募可' },
    { text: 'Based in Japan — no relocation needed', ja: '日本在住' },
    { text: 'Open to AI/DX, automation, and product roles', ja: 'AI/DX・自動化・プロダクト職' },
  ],
  resumeNote: 'PDF · one page, updated regularly',
  githubNote: 'Project source code & activity',
  linkedinNote: 'Profile, education & experience',
  closingJa: 'カジュアル面談も歓迎です。ポートフォリオの詳細について、日本語でも英語でもご説明できます。',
}

/* ============ 13. FOOTER ============ */

export const footer = {
  tagline: 'Building practical AI automation from real workplace problems — targeting AI/DX consulting and AI product roles in Japan.',
  credits: 'Built with React + Tailwind + Framer Motion',
}
