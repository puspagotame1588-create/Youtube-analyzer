import { motion } from 'framer-motion'
import { hero, profile } from '../config/content'
import CommandCenter from './CommandCenter'
import { fadeUp, stagger } from '../lib/anim'

export default function Hero() {
  return (
    <section id="top" className="relative pt-32 pb-20 md:pt-40 md:pb-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8 grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Copy */}
        <motion.div initial="hidden" animate="show" variants={stagger}>
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[13px] font-medium text-mist-300"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-beni-400" />
            {hero.availability.en}
            <span lang="ja" className="border-l border-white/10 pl-2 text-mist-400">{hero.availability.ja}</span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="mt-6 text-[2.6rem] leading-[1.08] font-extrabold tracking-tight sm:text-5xl md:text-[3.6rem]"
          >
            {hero.headline.pre}
            <span className="text-gradient">{hero.headline.gradient}</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={1.5}
            lang="ja"
            className="mt-4 text-[19px] md:text-[22px] font-bold tracking-wide text-mist-100"
          >
            {hero.headlineJa}
          </motion.p>

          <motion.p variants={fadeUp} custom={2} className="mt-6 max-w-xl text-[16.5px] leading-relaxed text-mist-300">
            {hero.sub.map((seg, i) =>
              seg.bold ? (
                <strong key={i} className="font-semibold text-white">{seg.t}</strong>
              ) : (
                <span key={i}>{seg.t}</span>
              ),
            )}
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-wrap gap-3">
            <a
              href="#video"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pulse-500 to-pulse-600 px-6 py-3 text-[14px] font-semibold text-white shadow-[0_8px_28px_-8px_rgba(61,118,232,0.7)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              <PlayIcon /> Watch Portfolio Video
            </a>
            <a
              href="#projects"
              className="inline-flex items-center gap-2 rounded-full glass px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:border-pulse-400/40"
            >
              View Projects
            </a>
            <a
              href={profile.resumeUrl}
              download
              className="inline-flex items-center gap-2 rounded-full glass px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:border-pulse-400/40"
            >
              Download Resume
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold text-mist-300 hover:text-white transition-colors"
            >
              Contact Me →
            </a>
          </motion.div>

          {/* trust badges */}
          <motion.ul variants={fadeUp} custom={4} className="mt-10 flex flex-wrap gap-2.5">
            {hero.badges.map((b) => (
              <li
                key={b.label}
                className="inline-flex items-center gap-2 rounded-lg glass px-3.5 py-2 text-[12.5px] font-semibold text-mist-100"
              >
                <CheckIcon />
                {b.label}
                {b.ja && (
                  <span lang="ja" className="text-[11px] font-medium text-mist-400">
                    {b.ja}
                  </span>
                )}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* 3D command center */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <CommandCenter />
          <p className="mt-4 text-center font-mono text-[11px] text-mist-500">
            {hero.commandCenterCaption}
          </p>
        </motion.div>
      </div>
    </section>
  )
}

function PlayIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.14v13.72L19 12 8 5.14z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4fd8d0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
