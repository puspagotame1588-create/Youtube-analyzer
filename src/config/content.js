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
  { href: '#proof', label: 'Proof' },
  { href: '#skills', label: 'Skills' },
  { href: '#about', label: 'About' },
  { href: '#roadmap', label: 'Roadmap' },
  { href: '#contact', label: 'Contact' },
]

/* ============ 2.5 LIVE OPS TICKER (navbar microactivity) ============ */

export const ops = [
  'email received',
  'agent thinking…',
  'classification complete',
  'knowledge retrieved',
  'task executed',
  'calendar updated',
  'workflow complete ✓',
]


/* ============ 3. HERO ============ */

export const hero = {
  availability: {
    en: 'Open to 2026 new-grad & internship roles',
    ja: '26卒・インターン',
  },
  // headline = plain part + gradient part, with a Japanese line below it
  headline: { pre: 'I build AI/DX systems that turn messy information into ', gradient: 'clear actions.' },
  headlineJa: '複雑な業務情報を、確実なアクションへ。',
  // subheadline segments; bold: true renders emphasized
  sub: [
    { t: 'Building practical AI systems for Japanese businesses — workflow automation, bilingual experiences, operational efficiency. ' },
    { t: `${JLPT} Japanese`, bold: true },
    { t: ' · ' },
    { t: `${TOEIC} English`, bold: true },
    { t: ', a business degree, and 2+ years of frontline operations behind every build: email-to-action agents, RAG assistants, bilingual training automation.' },
  ],
  // trust badges (JLPT/TOEIC pulled from profile automatically)
  badges: [
    { label: JLPT, ja: '日本語能力試験' },
    { label: TOEIC },
    { label: 'Japan-based', ja: profile.locationJa },
    { label: 'AI/DX Portfolio' },
    { label: 'Business × Automation' },
  ],
  commandCenterCaption: 'Drag to rotate · hover or tap a node to see its role in the workflow.',
  // the 3D core in the middle of the command center (a torii gate = the
  // "bridge between business and technology"). It represents the LLM.
  core: {
    label: 'LLM CORE',
    sub: 'classify · extract · draft',
    desc: 'The language model at the center: it classifies priority, extracts deadlines and key facts, and drafts responses — but never acts alone.',
  },
  // the workflow nodes orbiting the core; hover/tap reveals `desc`
  nodes: [
    { id: 'gmail', label: 'Gmail', ja: '受信', icon: 'mail', desc: 'Entry point — watches the inbox and feeds every new message into the pipeline.' },
    { id: 'rag', label: 'RAG Docs', ja: '文書検索', icon: 'docs', desc: 'Retrieves relevant company documents so every answer can cite a real source.' },
    { id: 'sheets', label: 'Sheets', ja: '記録', icon: 'table', desc: 'Structured log — every decision lands in an auditable row, nothing disappears.' },
    { id: 'calendar', label: 'Calendar', ja: '予定登録', icon: 'calendar', desc: 'Extracted deadlines become scheduled tasks with reminders, automatically.' },
    { id: 'review', label: 'Human Review', ja: '人の承認', icon: 'user', desc: 'The safety gate — a person approves every outgoing action. AI proposes, humans decide.' },
    { id: 'dashboard', label: 'Dashboard', ja: '可視化', icon: 'gauge', desc: 'Status and metrics at a glance, so the workflow stays measurable and improvable.' },
  ],
  nodeHint: 'Hover or tap any node · ノードをタップ',
  dragHint: 'drag to rotate · 回転できます',
  // live workflow run: tapping the trigger node animates a packet through
  // the pipeline, stage by stage. Edit captions/timings freely.
  run: {
    trigger: 'gmail',
    hint: 'Tap Gmail to watch a live run ▶ · Gmailをタップして実行',
    steps: [
      { type: 'travel', from: 'gmail', to: 'core', ms: 950, caption: 'New email received → routed to the LLM core' },
      { type: 'process', at: 'core', ms: 1600, caption: 'LLM classifying… priority HIGH · deadline found · reply drafted' },
      { type: 'travel', from: 'core', to: 'review', ms: 850, caption: 'Proposed action sent to human review' },
      { type: 'process', at: 'review', ms: 1300, caption: 'Human approves ✓ — nothing executes without a person' },
      { type: 'travel', from: 'review', to: 'dashboard', ms: 1000, caption: 'Result pushed to the dashboard' },
      { type: 'process', at: 'dashboard', ms: 900, caption: 'Dashboard updated — the run is logged and measurable' },
      { type: 'travel', from: 'dashboard', to: 'calendar', ms: 1000, caption: 'Deadline handed to Calendar' },
      { type: 'process', at: 'calendar', ms: 1200, caption: 'Calendar task created ✓ — workflow complete' },
    ],
    done: 'Email → classified → approved → logged → scheduled. This is the system I build.',
  },
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

/* ============ 4.5 IMPACT ============
   Animated counters shown above Projects. KEEP THESE HONEST —
   update the numbers here as your work grows. */

export const impact = {
  title: 'Measured in outcomes, not technologies',
  lead: 'What the systems on this page add up to — updated as the work grows.',
  note: 'Counts as of July 2026 · targets marked where measurement is still running.',
  stats: [
    { value: 11, suffix: '+', label: 'Projects built', ja: '制作プロジェクト' },
    { value: 15, suffix: '+', label: 'Automation workflows', ja: '自動化ワークフロー' },
    { value: 4, suffix: '', label: 'Working languages', ja: '使用言語' },
    { value: 20, suffix: '+', label: 'Tools in AI stack', ja: 'AIツール' },
    { value: 2, suffix: '+', label: 'Years frontline experience', ja: '現場経験' },
    { value: 5, suffix: 'h+', label: 'Saved monthly (pilot)', ja: '月間削減時間' },
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
    result: 'Working prototype processing a real inbox: deadlines land in Calendar, every decision is logged to Sheets, and drafts wait for my approval — nothing missed since the pilot began.',
    learned: 'Reliability beats cleverness: the human-review gate and the audit log did more for trust than any prompt tweak. Automation is a workflow-design problem first, an AI problem second.',
    timeSaved: '~5 hrs / month per user (pilot est.)',
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
    result: 'Scenario library built from real store situations; JP/EN roleplay loop working in prototype — feedback on politeness level, phrasing, and next-best response.',
    learned: 'Domain knowledge is the moat: the hardest part wasn’t the LLM, it was encoding what actually happens at a Japanese register — which I knew from experience.',
    timeSaved: 'onboarding weeks → days (target)',
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
    result: 'Prototype answers questions from uploaded documents with inline citations; wrong-answer rate drops sharply when retrieval is tuned before the prompt is.',
    learned: 'RAG quality is decided at ingestion: chunking and retrieval tuning moved accuracy more than model choice — and citations are what make enterprises trust the answer.',
    timeSaved: '60s → 5s per lookup (target)',
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
  // input tabs — each sample shows a different kind of messy input
  stages: [
    { id: 'input', label: 'Input received', ja: '受信' },
    { id: 'extract', label: 'AI extracts key info', ja: '情報抽出' },
    { id: 'categorize', label: 'Categorized', ja: '分類' },
    { id: 'action', label: 'Action created', ja: 'アクション作成' },
    { id: 'review', label: 'Human review', ja: '人による承認' },
    { id: 'log', label: 'Result logged', ja: '記録完了' },
  ],
  samples: [
    {
      type: 'email',
      tab: 'Email',
      tabJa: 'メール',
      source: 'prof.tanaka@teikyo-u.ac.jp',
      subject: '【重要】期末レポート提出について',
      preview: 'レポートは7月18日（金）17:00までに提出してください…',
      log: [
        '→ New email from prof.tanaka@teikyo-u.ac.jp',
        '✓ Extracted: deadline Jul 18 (Fri) 17:00 JST · required action: submit report',
        '✓ Category: Academic / Deadline · Priority: HIGH',
        '✓ Calendar task “期末レポート提出” created · reply drafted in polite Japanese',
        '⏸ Waiting for human approval… nothing is sent automatically.',
        '✓ Logged to Sheets: source, deadline, action, approval status.',
      ],
      result: { priority: 'HIGH', action: 'Calendar task + drafted reply', decision: 'Human approves → sent' },
    },
    {
      type: 'pdf',
      tab: 'PDF',
      tabJa: '英文PDF',
      source: 'invoices/supplier_invoice_0231.pdf',
      subject: 'Supplier invoice — ¥184,000 due',
      preview: 'Payment due within 14 days of issue date (July 3). Wire to account…',
      log: [
        '→ New PDF: supplier_invoice_0231.pdf (2 pages, English)',
        '✓ Extracted: ¥184,000 · due Jul 17 · vendor + PO number',
        '✓ Category: Finance / Payable · Priority: HIGH',
        '✓ Payment reminder created · row added to payables sheet',
        '⏸ Waiting for human approval… money never moves automatically.',
        '✓ Logged with source-page references — audit-ready.',
      ],
      result: { priority: 'HIGH', action: 'Payment reminder + payables row', decision: 'Human approves → scheduled' },
    },
    {
      type: 'document',
      tab: 'JP Doc',
      tabJa: '日本語文書',
      source: 'store-ops/レジ操作マニュアル_v3.pdf',
      subject: '新レジ操作マニュアル（改訂版・12ページ）',
      preview: 'レジ点検は毎週月曜 9:00 までに完了すること。未実施の場合は店長へ報告…',
      log: [
        '→ New document: レジ操作マニュアル_v3.pdf (12 pages)',
        '✓ Extracted: recurring rule — register check every Monday by 9:00, escalation: report to manager',
        '✓ Category: Operations / Recurring duty',
        '✓ Recurring calendar task created · checklist row added to Sheets',
        '⏸ Waiting for human approval… a person confirms the rule was read correctly.',
        '✓ Logged with citation: page 4, section 2.1 — verifiable, not a guess.',
      ],
      result: { priority: 'MEDIUM', action: 'Recurring task + cited checklist', decision: 'Human confirms → active' },
    },
    {
      type: 'video',
      tab: 'Video',
      tabJa: '動画',
      source: 'youtube.com/watch?v=seminar-recording',
      subject: 'ゼミ発表の録画（45分）',
      preview: '「…来週までに先行研究を3本まとめて、スライドを共有してください…」',
      log: [
        '→ New video: seminar recording, 45 min — transcript generated',
        '✓ Extracted: 3 action items · deadline “next week” resolved to Jul 15 (Wed)',
        '✓ Category: Academic / Task list',
        '✓ Summary + action list written to Sheets · calendar reminder created',
        '⏸ Waiting for human approval… I check the AI’s reading before it commits.',
        '✓ Logged: 45 minutes of video → 6 lines of accountable actions.',
      ],
      result: { priority: 'MEDIUM', action: '3 tasks + summary from 45-min video', decision: 'Human edits → saved' },
    },
  ],
}

/* ============ 6.5 TRY MY AI ============ */

export const tryMyAI = {
  kicker: 'Try My AI',
  kickerJa: '体験デモ',
  title: 'Experience a workflow, don’t just read about it',
  lead: 'Simulate an upload — an email, an invoice PDF, a Japanese manual, or a 45-minute video — and watch the pipeline extract, categorize, act, and log. Mocked data, real workflow design.',
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

/* ============ 12.5 PROOF ============
   Screenshots: drop PNG/JPG files into public/screenshots/ and set `src`
   below (e.g. '/screenshots/n8n-workflow.png'). Empty src = placeholder. */

export const proof = {
  title: 'Proof over promises',
  lead: 'Code, demos, and documentation you can inspect. If it can’t be verified, it isn’t on this page.',
  github: {
    label: 'GitHub repositories',
    desc: 'Source for each project, with commit history and READMEs that explain the architecture and setup.',
  },
  video: {
    label: 'Demo walkthroughs',
    desc: 'Short screen recordings of each system running end-to-end — set links in each project’s demo field.',
  },
  readme: {
    label: 'Written like handover docs',
    desc: 'Each README covers the problem, the workflow diagram, setup steps, and known limitations — the way client documentation should read.',
  },
  screens: [
    { src: '', caption: 'Email agent — n8n workflow canvas' },
    { src: '', caption: 'RAG assistant — answer with citations' },
    { src: '', caption: 'Sheets — auditable action log' },
  ],
  stack: ['Python', 'n8n', 'OpenAI API', 'Claude API', 'Gmail API', 'Google Sheets', 'Google Calendar', 'Vector DB', 'React', 'Tailwind CSS'],
}

/* ============ 13. FOOTER ============ */

export const footer = {
  tagline: 'Building practical AI automation from real workplace problems — targeting AI/DX consulting and AI product roles in Japan.',
  credits: 'Built with React + Tailwind + Framer Motion',
}
