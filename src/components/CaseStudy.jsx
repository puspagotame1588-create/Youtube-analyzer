import { motion } from 'framer-motion'
import SectionHeading from './SectionHeading'
import WorkflowDemo from './WorkflowDemo'
import { useCountUp, fadeUp, stagger, viewportOnce } from '../lib/anim'

const FLOW = [
  { step: '01', title: 'Problem', ja: '課題', desc: 'Important emails, deadlines, and actions get missed in a crowded inbox.', tone: 'text-beni-400 border-beni-500/30' },
  { step: '02', title: 'Workflow', ja: '設計', desc: 'n8n watches Gmail and routes every new message into the pipeline.', tone: 'text-pulse-300 border-pulse-500/30' },
  { step: '03', title: 'AI Decision', ja: 'AI判定', desc: 'The LLM classifies priority, extracts deadlines, and proposes the next action.', tone: 'text-pulse-300 border-pulse-500/30' },
  { step: '04', title: 'Human Review', ja: '人の承認', desc: 'Nothing is sent automatically — a person approves or edits every draft.', tone: 'text-cyan-glow border-cyan-glow/30' },
  { step: '05', title: 'Output', ja: '実行', desc: 'Sheets log, Calendar tasks, and polished replies — all traceable.', tone: 'text-cyan-glow border-cyan-glow/30' },
  { step: '06', title: 'Business Impact', ja: '効果', desc: 'Fewer missed deadlines, faster responses, and hours back every month.', tone: 'text-white border-white/25' },
]

const METRICS = [
  { value: 80, suffix: '%', label: 'faster first response', note: 'target vs. manual triage' },
  { value: 95, suffix: '%', label: 'fewer missed deadlines', note: 'target after full rollout' },
  { value: 90, suffix: '%+', label: 'auto-classification accuracy', note: 'measured on pilot inbox' },
  { value: 5, suffix: 'h', label: 'saved per month', note: 'pilot estimate, per user' },
]

function MetricCard({ value, suffix, label, note, i }) {
  const { ref, value: v } = useCountUp(value, { duration: 1.8 })
  return (
    <motion.div
      variants={fadeUp}
      custom={i}
      ref={ref}
      className="rounded-2xl glass px-5 py-5 text-center hover:border-pulse-400/30 transition-colors"
    >
      <p className="font-mono text-3xl md:text-[2.1rem] font-bold text-gradient">
        {v}
        <span className="text-xl">{suffix}</span>
      </p>
      <p className="mt-2 text-[13.5px] font-semibold text-white">{label}</p>
      <p className="mt-1 font-mono text-[10.5px] text-mist-500">{note}</p>
    </motion.div>
  )
}

export default function CaseStudy() {
  return (
    <section id="case-study" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          kicker="Flagship Case Study"
          kickerJa="ケーススタディ"
          title="AI Email-to-Action Operations Agent"
          lead="How I approach automation like a consultant: define the problem, design the workflow, put AI where it earns its keep, and keep a human accountable for every outgoing action."
        />

        {/* Flow diagram — 3D-tilted row of connected steps */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={stagger}
          className="perspective-1200"
        >
          <div className="preserve-3d grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            {FLOW.map((f, i) => (
              <motion.div
                key={f.step}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className={`relative rounded-xl glass border px-4 py-4 ${f.tone.split(' ')[1]}`}
              >
                <p className={`font-mono text-[11px] font-semibold ${f.tone.split(' ')[0]}`}>
                  {f.step}
                </p>
                <p className="mt-1.5 text-[14px] font-bold text-white leading-tight">
                  {f.title}
                  <span lang="ja" className="ml-1.5 text-[10.5px] font-medium text-mist-500">{f.ja}</span>
                </p>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-mist-400">{f.desc}</p>
                {i < FLOW.length - 1 && (
                  <span className="absolute -right-2.5 top-1/2 hidden lg:grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full bg-ink-900 border border-white/12 text-[9px] text-mist-400 z-10">
                    →
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Interactive demo */}
        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <WorkflowDemo />
        </motion.div>

        {/* Metrics */}
        <motion.div
          className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4"
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={stagger}
        >
          {METRICS.map((m, i) => (
            <MetricCard key={m.label} {...m} i={i} />
          ))}
        </motion.div>
        <p className="mt-4 text-center font-mono text-[11px] text-mist-500">
          Targets are stated as design goals and updated with measured results as the pilot expands.
        </p>
      </div>
    </section>
  )
}
