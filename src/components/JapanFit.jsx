import { motion } from 'framer-motion'
import { japanFit } from '../config/content'
import SectionHeading from './SectionHeading'
import { fadeUp, stagger, viewportOnce } from '../lib/anim'

const REASONS = japanFit.reasons

export default function JapanFit() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          kicker="Japan Fit"
          kickerJa="日本のAI/DX職への適性"
          title={japanFit.title}
          lead={japanFit.lead}
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
