import { motion } from 'framer-motion'
import { impact } from '../config/content'
import SectionHeading from './SectionHeading'
import { useCountUp, fadeUp, stagger, viewportOnce } from '../lib/anim'

function Stat({ value, suffix, label, ja, i }) {
  const { ref, value: v } = useCountUp(value, { duration: 1.6 })
  return (
    <motion.div
      variants={fadeUp}
      custom={i}
      ref={ref}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="rounded-2xl glass px-4 py-5 text-center hover:border-pulse-400/30 transition-colors"
    >
      <p className="font-mono text-[2rem] md:text-[2.3rem] font-bold leading-none text-gradient">
        {v}
        <span className="text-[1.2rem]">{suffix}</span>
      </p>
      <p className="mt-2.5 text-[12.5px] font-semibold leading-snug text-white">{label}</p>
      <p lang="ja" className="mt-0.5 font-mono text-[10px] text-mist-500">{ja}</p>
    </motion.div>
  )
}

export default function Impact() {
  return (
    <section id="impact" className="relative py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          kicker="Impact"
          kickerJa="実績"
          title={impact.title}
          lead={impact.lead}
        />

        <motion.div
          className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6"
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={stagger}
        >
          {impact.stats.map((s, i) => (
            <Stat key={s.label} {...s} i={i} />
          ))}
        </motion.div>

        <p className="mt-5 text-center font-mono text-[11px] text-mist-500">{impact.note}</p>
      </div>
    </section>
  )
}
