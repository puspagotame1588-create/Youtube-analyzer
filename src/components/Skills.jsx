import { motion } from 'framer-motion'
import SectionHeading from './SectionHeading'
import { fadeUp, stagger, viewportOnce } from '../lib/anim'

const GROUPS = [
  {
    title: 'AI & Data',
    ja: 'AI・データ',
    tone: 'text-pulse-300',
    dot: 'bg-pulse-400',
    skills: ['LLMs (OpenAI / Claude)', 'Prompt engineering', 'RAG pipelines', 'Vector databases', 'Python', 'Data analysis', 'Output evaluation'],
  },
  {
    title: 'Automation',
    ja: '自動化',
    tone: 'text-cyan-glow',
    dot: 'bg-cyan-glow',
    skills: ['n8n workflows', 'REST APIs', 'Gmail API', 'Google Sheets', 'Google Calendar', 'Webhooks', 'Workflow design'],
  },
  {
    title: 'Product & Consulting',
    ja: 'プロダクト・コンサル',
    tone: 'text-beni-400',
    dot: 'bg-beni-400',
    skills: ['Problem discovery', 'Business process mapping', 'KPI thinking', 'UX basics', 'Documentation', 'Stakeholder communication'],
  },
  {
    title: 'Languages',
    ja: '言語',
    tone: 'text-white',
    dot: 'bg-white',
    skills: ['Japanese — JLPT N1', 'English — TOEIC 905', 'Nepali — native', 'Hindi — conversational'],
  },
]

const CERTS = ['JLPT N1', 'TOEIC 905', 'MOS Excel', 'MOS Word']

export default function Skills() {
  return (
    <section id="skills" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          kicker="Skills"
          kickerJa="スキル"
          title="Business fluency meets technical build skills"
          lead="Not a checklist — a toolkit organized the way AI/DX consulting work is actually structured."
        />

        <motion.div
          className="grid gap-5 md:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={stagger}
        >
          {GROUPS.map((g, i) => (
            <motion.div
              key={g.title}
              variants={fadeUp}
              custom={i}
              whileHover={{ y: -5, transition: { duration: 0.25 } }}
              className="rounded-2xl glass p-6 hover:border-white/18 transition-colors"
            >
              <div className="flex items-baseline gap-2">
                <span className={`h-2 w-2 rounded-full ${g.dot}`} />
                <h3 className={`text-[15.5px] font-bold ${g.tone}`}>{g.title}</h3>
                <span lang="ja" className="text-[11px] text-mist-500">{g.ja}</span>
              </div>
              <ul className="mt-4 space-y-2">
                {g.skills.map((s) => (
                  <li key={s} className="flex items-center gap-2.5 text-[13px] text-mist-300">
                    <span className="h-px w-3 bg-white/20" />
                    {s}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* certification strip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist-500">
            Certified
          </span>
          {CERTS.map((c) => (
            <span
              key={c}
              className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-1.5 text-[12.5px] font-semibold text-white"
            >
              {c}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
