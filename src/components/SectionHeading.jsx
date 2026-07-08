import { motion } from 'framer-motion'
import { fadeUp, viewportOnce } from '../lib/anim'

/**
 * Consistent section header: small JP kicker + EN title + supporting line.
 */
export default function SectionHeading({ kicker, kickerJa, title, lead, align = 'center' }) {
  const alignCls = align === 'left' ? 'text-left items-start' : 'text-center items-center'
  return (
    <motion.div
      className={`flex flex-col ${alignCls} gap-4 mb-12 md:mb-16`}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
    >
      <motion.div
        variants={fadeUp}
        className="inline-flex items-center gap-2.5 rounded-full glass px-4 py-1.5 text-[13px] font-medium tracking-wide text-pulse-300"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-glow animate-pulse-soft" />
        {kicker}
        {kickerJa && (
          <span lang="ja" className="text-mist-400 border-l border-white/10 pl-2.5">
            {kickerJa}
          </span>
        )}
      </motion.div>
      <motion.h2
        variants={fadeUp}
        custom={1}
        className="text-3xl md:text-[2.6rem] font-bold tracking-tight leading-[1.15] max-w-3xl"
      >
        {title}
      </motion.h2>
      {lead && (
        <motion.p variants={fadeUp} custom={2} className="text-mist-400 max-w-2xl text-[15.5px] md:text-base leading-relaxed">
          {lead}
        </motion.p>
      )}
    </motion.div>
  )
}
