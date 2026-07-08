import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import site from '../config/site'
import SectionHeading from './SectionHeading'
import { useCountUp, viewportOnce } from '../lib/anim'

const PROJECTS = [
  {
    id: 'emailAgent',
    tone: { text: 'text-pulse-300', bg: 'from-pulse-500/15', border: 'hover:border-pulse-400/40', chip: 'bg-pulse-500/12 text-pulse-300' },
    tag: 'Flagship · GenAI Automation',
    title: 'AI Email-to-Action Operations Agent',
    titleJa: 'メール自動アクション化エージェント',
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
  },
  {
    id: 'trainingCoach',
    tone: { text: 'text-beni-400', bg: 'from-beni-500/12', border: 'hover:border-beni-400/40', chip: 'bg-beni-500/12 text-beni-400' },
    tag: 'Frontline DX · Japan Context',
    title: 'Japanese Convenience Store AI Training Coach',
    titleJa: 'コンビニ接客AIトレーニングコーチ',
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
  },
  {
    id: 'ragAssistant',
    tone: { text: 'text-cyan-glow', bg: 'from-cyan-glow/10', border: 'hover:border-cyan-glow/40', chip: 'bg-cyan-glow/10 text-cyan-glow' },
    tag: 'Enterprise GenAI · Knowledge',
    title: 'RAG Company Knowledge Assistant',
    titleJa: '社内ナレッジRAGアシスタント',
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
  },
]

function TiltCard({ children, className }) {
  const ref = useRef(null)
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rotateY = useSpring(useTransform(mx, [0, 1], [-4.5, 4.5]), { stiffness: 150, damping: 20 })
  const rotateX = useSpring(useTransform(my, [0, 1], [4, -4]), { stiffness: 150, damping: 20 })

  return (
    <motion.div
      ref={ref}
      className="perspective-1200 h-full"
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        mx.set((e.clientX - r.left) / r.width)
        my.set((e.clientY - r.top) / r.height)
      }}
      onMouseLeave={() => {
        mx.set(0.5)
        my.set(0.5)
      }}
    >
      <motion.div style={{ rotateX, rotateY }} className={`preserve-3d h-full ${className}`}>
        {children}
      </motion.div>
    </motion.div>
  )
}

function Metric({ value, suffix, label, toneText }) {
  const { ref, value: v } = useCountUp(value)
  return (
    <div ref={ref} className="rounded-xl bg-ink-950/50 border border-white/6 px-3 py-2.5">
      <p className={`font-mono text-[17px] font-semibold ${toneText}`}>
        {v}
        <span className="text-[12px]">{suffix}</span>
      </p>
      <p className="mt-0.5 text-[10.5px] leading-snug text-mist-500">{label}</p>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist-500">{label}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-mist-300">{children}</p>
    </div>
  )
}

export default function Projects() {
  return (
    <section id="projects" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          kicker="Featured Projects"
          kickerJa="プロジェクト"
          title="Built from real problems, not tutorials"
          lead="Each project starts with an operational problem I personally experienced, and ends with a measurable business outcome. Every card is an interview conversation I'm ready to have."
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {PROJECTS.map((p, i) => {
            const links = site.projects[p.id]
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                <TiltCard
                  className={`rounded-2xl glass ${p.tone.border} transition-colors duration-300 flex flex-col overflow-hidden`}
                >
                  {/* header band */}
                  <div className={`bg-gradient-to-b ${p.tone.bg} to-transparent px-6 pt-6 pb-4`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold tracking-wide ${p.tone.chip}`}>
                        {p.tag}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] ${p.status.live ? 'text-cyan-glow' : 'text-mist-400'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${p.status.live ? 'bg-cyan-glow animate-pulse-soft' : 'bg-mist-500'}`} />
                        {p.status.label}
                      </span>
                    </div>
                    <h3 className="mt-4 text-[19px] font-bold leading-snug text-white">{p.title}</h3>
                    <p lang="ja" className="mt-1 text-[12px] text-mist-400">{p.titleJa}</p>
                  </div>

                  <div className="flex flex-col gap-4 px-6 pb-6 grow">
                    <Row label="Problem">{p.problem}</Row>
                    <Row label="Solution">{p.solution}</Row>
                    <Row label="Business value">{p.value}</Row>

                    {/* floating tech tags */}
                    <div className="flex flex-wrap gap-1.5" style={{ transform: 'translateZ(24px)' }}>
                      {p.tools.map((t, ti) => (
                        <motion.span
                          key={t}
                          animate={{ y: [0, -2.5, 0] }}
                          transition={{ duration: 3 + (ti % 3), repeat: Infinity, ease: 'easeInOut', delay: ti * 0.25 }}
                          className="rounded-md border border-white/8 bg-ink-950/60 px-2 py-1 font-mono text-[10.5px] text-mist-300"
                        >
                          {t}
                        </motion.span>
                      ))}
                    </div>

                    {/* metrics */}
                    <div className="grid grid-cols-2 gap-2.5" style={{ transform: 'translateZ(18px)' }}>
                      {p.metrics.map((m) => (
                        <Metric key={m.label} {...m} toneText={p.tone.text} />
                      ))}
                    </div>

                    {/* interview talking point */}
                    <blockquote className="rounded-xl border-l-2 border-white/15 bg-white/[0.03] px-4 py-3 text-[12.5px] italic leading-relaxed text-mist-300">
                      {p.talkingPoint}
                    </blockquote>

                    <p className="font-mono text-[10.5px] leading-relaxed text-mist-500">
                      <span className={p.tone.text}>Hiring signal —</span> {p.signal}
                    </p>

                    {/* links */}
                    <div className="mt-auto flex gap-2.5 pt-1">
                      <a
                        href={links.demo}
                        className="flex-1 rounded-lg bg-white/8 hover:bg-white/14 border border-white/10 px-3 py-2 text-center text-[12.5px] font-semibold text-white transition-colors"
                      >
                        Demo / Walkthrough
                      </a>
                      <a
                        href={links.github}
                        className="flex-1 rounded-lg glass hover:border-white/25 px-3 py-2 text-center text-[12.5px] font-semibold text-mist-300 hover:text-white transition-colors"
                      >
                        GitHub
                      </a>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            )
          })}
        </div>

        <p className="mt-6 text-center font-mono text-[11px] text-mist-500">
          Metrics marked “target / pilot est.” are measured goals, updated as each project ships.
        </p>
      </div>
    </section>
  )
}
