import { motion } from 'framer-motion'
import SectionHeading from './SectionHeading'
import { fadeUp, stagger, viewportOnce } from '../lib/anim'

const REASONS = [
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
    desc: 'JLPT N1 Japanese for client conversations and documentation; TOEIC 905 English for global teams and technical sources.',
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
]

export default function JapanFit() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          kicker="Japan Fit"
          kickerJa="日本のAI/DX職への適性"
          title="Why I fit AI/DX roles in Japan"
          lead="Consulting firms in Japan need people who can hold a client conversation in Japanese, understand the operation, and prototype the fix. That intersection is exactly what I've been building."
        />

        <motion.div
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={stagger}
        >
          {REASONS.map((r, i) => (
            <motion.div
              key={r.title}
              variants={fadeUp}
              custom={i}
              whileHover={{ y: -5, transition: { duration: 0.25 } }}
              className="rounded-2xl glass p-6 hover:border-beni-400/30 transition-colors"
            >
              <span
                lang="ja"
                className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-beni-500/25 to-beni-500/5 border border-beni-400/25 text-[19px] font-bold text-beni-400"
              >
                {r.icon}
              </span>
              <h3 className="mt-4 text-[15px] font-bold leading-snug text-white">{r.title}</h3>
              <p lang="ja" className="mt-1 font-mono text-[10.5px] text-mist-500">{r.ja}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-mist-400">{r.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
