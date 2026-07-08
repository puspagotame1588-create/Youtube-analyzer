import { motion } from 'framer-motion'
import { caseStudy, flagship } from '../config/content'
import SectionHeading from './SectionHeading'
import { useCountUp, fadeUp, stagger, viewportOnce } from '../lib/anim'

// tone name (from content.js) → presentation classes
const FLOW_TONES = {
  beni: { text: 'text-beni-400', border: 'border-beni-500/30' },
  pulse: { text: 'text-pulse-300', border: 'border-pulse-500/30' },
  cyan: { text: 'text-cyan-glow', border: 'border-cyan-glow/30' },
  white: { text: 'text-white', border: 'border-white/25' },
}

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
          title={flagship.title}
          lead={caseStudy.lead}
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
            {caseStudy.flow.map((f, i) => {
              const tone = FLOW_TONES[f.tone]
              return (
                <motion.div
                  key={f.step}
                  variants={fadeUp}
                  custom={i}
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  className={`relative rounded-xl glass border px-4 py-4 ${tone.border}`}
                >
                  <p className={`font-mono text-[11px] font-semibold ${tone.text}`}>
                    {f.step}
                  </p>
                  <p className="mt-1.5 text-[14px] font-bold text-white leading-tight">
                    {f.title}
                    <span lang="ja" className="ml-1.5 text-[10.5px] font-medium text-mist-500">{f.ja}</span>
                  </p>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-mist-400">{f.desc}</p>
                  {i < caseStudy.flow.length - 1 && (
                    <span className="absolute -right-2.5 top-1/2 hidden lg:grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full bg-ink-900 border border-white/12 text-[9px] text-mist-400 z-10">
                      →
                    </span>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Metrics */}
        <motion.div
          className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4"
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={stagger}
        >
          {caseStudy.metrics.map((m, i) => (
            <MetricCard key={m.label} {...m} i={i} />
          ))}
        </motion.div>
        <p className="mt-4 text-center font-mono text-[11px] text-mist-500">
          {caseStudy.metricsFootnote}
        </p>
      </div>
    </section>
  )
}
