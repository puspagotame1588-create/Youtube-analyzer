import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { projects, projectsSection, isPlaceholderLink } from '../config/content'
import SectionHeading from './SectionHeading'
import { useCountUp, viewportOnce } from '../lib/anim'

// tone name (from content.js) → presentation classes
const TONES = {
  pulse: { text: 'text-pulse-300', bg: 'from-pulse-500/15', border: 'hover:border-pulse-400/40', chip: 'bg-pulse-500/12 text-pulse-300' },
  beni: { text: 'text-beni-400', bg: 'from-beni-500/12', border: 'hover:border-beni-400/40', chip: 'bg-beni-500/12 text-beni-400' },
  cyan: { text: 'text-cyan-glow', bg: 'from-cyan-glow/10', border: 'hover:border-cyan-glow/40', chip: 'bg-cyan-glow/10 text-cyan-glow' },
}

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

function CardLink({ href, label, soonLabel, primary = false }) {
  if (isPlaceholderLink(href)) {
    return (
      <span
        lang="ja"
        className="flex-1 cursor-default rounded-lg border border-dashed border-white/12 px-3 py-2 text-center font-mono text-[10.5px] text-mist-500"
      >
        {soonLabel}
      </span>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={
        primary
          ? 'flex-1 rounded-lg bg-white/8 hover:bg-white/14 border border-white/10 px-3 py-2 text-center text-[12.5px] font-semibold text-white transition-colors'
          : 'flex-1 rounded-lg glass hover:border-white/25 px-3 py-2 text-center text-[12.5px] font-semibold text-mist-300 hover:text-white transition-colors'
      }
    >
      {label}
    </a>
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
          title={projectsSection.title}
          lead={projectsSection.lead}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {projects.map((p, i) => {
            const tone = TONES[p.tone]
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                <TiltCard
                  className={`rounded-2xl glass ${tone.border} transition-colors duration-300 flex flex-col overflow-hidden`}
                >
                  {/* header band */}
                  <div className={`bg-gradient-to-b ${tone.bg} to-transparent px-6 pt-6 pb-4`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold tracking-wide ${tone.chip}`}>
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
                    <Row label="Result">{p.result}</Row>
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
                        <Metric key={m.label} {...m} toneText={tone.text} />
                      ))}
                    </div>

                    {/* time saved */}
                    <div className="flex items-center justify-between rounded-xl border border-white/6 bg-ink-950/50 px-3.5 py-2.5">
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist-500">Time saved</span>
                      <span className={`font-mono text-[12px] font-semibold ${tone.text}`}>{p.timeSaved}</span>
                    </div>

                    {/* what I learned */}
                    <div className="rounded-xl border-l-2 border-white/15 bg-white/[0.03] px-4 py-3">
                      <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-mist-500">What I learned</p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-mist-300">{p.learned}</p>
                    </div>

                    <p className="font-mono text-[10.5px] leading-relaxed text-mist-500">
                      <span className={tone.text}>Hiring signal —</span> {p.signal}
                    </p>

                    {/* links — placeholder URLs render as "coming soon" */}
                    <div className="mt-auto flex gap-2.5 pt-1">
                      <CardLink href={p.demo} primary label="Demo / Walkthrough" soonLabel="Demo — 近日公開" />
                      <CardLink href={p.github} label="GitHub" soonLabel="Code — 近日公開" />
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            )
          })}
        </div>

        <p className="mt-6 text-center font-mono text-[11px] text-mist-500">
          {projectsSection.footnote}
        </p>
      </div>
    </section>
  )
}
