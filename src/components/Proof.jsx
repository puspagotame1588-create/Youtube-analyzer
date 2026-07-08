import { motion } from 'framer-motion'
import { proof, profile } from '../config/content'
import SectionHeading from './SectionHeading'
import { fadeUp, stagger, viewportOnce } from '../lib/anim'

/**
 * Evidence section: GitHub, demo videos, screenshots, docs, tech stack.
 * Screenshots: drop images into public/screenshots/ and set `src` in
 * config/content.js (proof.screens). Empty src renders a placeholder.
 */
export default function Proof() {
  return (
    <section id="proof" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          kicker="Proof"
          kickerJa="実績の証拠"
          title={proof.title}
          lead={proof.lead}
        />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={stagger}
          className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]"
        >
          {/* left column: inspectable sources */}
          <div className="flex flex-col gap-4">
            <motion.a
              variants={fadeUp}
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className="group rounded-2xl glass p-6 hover:border-pulse-400/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-bold text-white">{proof.github.label}</p>
                <span className="text-mist-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-white">→</span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-mist-400">{proof.github.desc}</p>
            </motion.a>

            <motion.div variants={fadeUp} custom={1} className="rounded-2xl glass p-6">
              <p className="text-[15px] font-bold text-white">{proof.video.label}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-mist-400">{proof.video.desc}</p>
            </motion.div>

            <motion.div variants={fadeUp} custom={2} className="rounded-2xl glass p-6">
              <p className="text-[15px] font-bold text-white">{proof.readme.label}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-mist-400">{proof.readme.desc}</p>
            </motion.div>
          </div>

          {/* right column: screenshots */}
          <motion.div variants={fadeUp} custom={1} className="grid gap-4">
            {proof.screens.map((sc, i) => (
              <figure
                key={sc.caption}
                className={`rounded-2xl glass overflow-hidden ${i === 0 ? '' : 'hidden sm:block'}`}
              >
                <div className="relative aspect-[21/9] bg-ink-900">
                  {sc.src ? (
                    <img src={sc.src} alt={sc.caption} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="text-center px-6">
                        <span className="mx-auto grid h-10 w-10 place-items-center rounded-lg border border-white/12 text-mist-500">
                          <ImageIcon />
                        </span>
                        <p className="mt-2.5 font-mono text-[10.5px] text-mist-500">
                          screenshot placeholder — add to <span className="text-pulse-300">public/screenshots/</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <figcaption className="border-t border-white/6 px-4 py-2.5 font-mono text-[11px] text-mist-400">
                  {sc.caption}
                </figcaption>
              </figure>
            ))}
          </motion.div>
        </motion.div>

        {/* tech stack strip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-2.5"
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist-500">Stack</span>
          {proof.stack.map((t) => (
            <span
              key={t}
              className="rounded-md border border-white/8 bg-ink-950/60 px-2.5 py-1.5 font-mono text-[11px] text-mist-300"
            >
              {t}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function ImageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  )
}
