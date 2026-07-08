import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { roadmap } from '../config/content'
import SectionHeading from './SectionHeading'
import { viewportOnce } from '../lib/anim'

const MONTHS = roadmap.months

const statusStyle = {
  done: { dot: 'bg-cyan-glow border-cyan-glow', label: 'Completed', text: 'text-cyan-glow' },
  now: { dot: 'bg-pulse-500 border-pulse-300 shadow-[0_0_16px_-2px_rgba(94,150,245,0.9)]', label: 'In progress', text: 'text-pulse-300' },
  next: { dot: 'bg-ink-800 border-white/20', label: 'Upcoming', text: 'text-mist-500' },
}

export default function Roadmap() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 60%'] })
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <section id="roadmap" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <SectionHeading
          kicker="Build Roadmap"
          kickerJa="ロードマップ"
          title={roadmap.title}
          lead={roadmap.lead}
        />

        <div ref={ref} className="relative pl-8 md:pl-10">
          {/* progress line */}
          <div className="absolute left-[9px] md:left-[13px] top-1 bottom-1 w-px bg-white/10" />
          <motion.div
            style={{ scaleY: lineScale }}
            className="absolute left-[9px] md:left-[13px] top-1 bottom-1 w-px origin-top bg-gradient-to-b from-cyan-glow via-pulse-400 to-pulse-600"
          />

          <div className="space-y-8">
            {MONTHS.map((item, i) => {
              const s = statusStyle[item.status]
              return (
                <motion.div
                  key={item.m}
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={viewportOnce}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="relative"
                >
                  <span
                    className={`absolute -left-8 md:-left-10 top-1.5 grid h-[19px] w-[19px] md:h-[27px] md:w-[27px] place-items-center rounded-full border-2 ${s.dot}`}
                  >
                    {item.status === 'done' && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#060a14" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {item.status === 'now' && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse-soft" />}
                  </span>

                  <div className="rounded-2xl glass px-5 py-4 hover:border-white/18 transition-colors">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-mono text-[11px] font-semibold text-mist-400">{item.m}</span>
                      <span className={`font-mono text-[10px] uppercase tracking-wider ${s.text}`}>● {s.label}</span>
                    </div>
                    <h3 className="mt-1.5 text-[16px] font-bold text-white">
                      {item.title}
                      <span lang="ja" className="ml-2 text-[11.5px] font-medium text-mist-500">{item.ja}</span>
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-mist-400">{item.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
