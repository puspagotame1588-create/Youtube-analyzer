import { motion } from 'framer-motion'
import { ctaBanner, profile } from '../config/content'
import { viewportOnce } from '../lib/anim'

/**
 * Mid-page recruiter conversion point — appears after the interactive
 * demo, while interest is highest, instead of only at the page bottom.
 */
export default function CtaBanner() {
  return (
    <section className="relative py-10 md:py-14">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-center gap-5 rounded-2xl glass-strong px-7 py-8 text-center md:flex-row md:justify-between md:text-left"
        >
          <div>
            <p className="text-[17px] md:text-[18px] font-bold text-white leading-snug">{ctaBanner.text}</p>
            <p lang="ja" className="mt-1.5 text-[12.5px] text-mist-400">{ctaBanner.ja}</p>
          </div>
          <div className="flex shrink-0 gap-2.5">
            <a
              href={profile.resumeUrl}
              download
              className="rounded-full bg-gradient-to-r from-pulse-500 to-pulse-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_6px_20px_-6px_rgba(61,118,232,0.7)] hover:scale-[1.03] transition-transform"
            >
              Resume
            </a>
            <a
              href="#contact"
              className="rounded-full glass px-5 py-2.5 text-[13px] font-semibold text-white hover:border-pulse-400/40 transition-colors"
            >
              Contact →
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
