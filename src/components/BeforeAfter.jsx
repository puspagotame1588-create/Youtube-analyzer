import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SectionHeading from './SectionHeading'
import { viewportOnce } from '../lib/anim'

const MODES = {
  before: {
    title: 'Manual workflow',
    ja: '手作業',
    tone: 'text-beni-400',
    time: '~45 min / day',
    steps: [
      { t: 'Open inbox, scan 40+ unread emails', cost: '10 min' },
      { t: 'Re-read important ones to find deadlines', cost: '10 min' },
      { t: 'Copy dates into calendar by hand', cost: '8 min' },
      { t: 'Write each reply from scratch', cost: '15 min' },
      { t: 'Hope nothing was missed', cost: 'risk: high' },
    ],
    verdict: 'Attention-dependent. One busy day = missed deadline.',
  },
  after: {
    title: 'AI-assisted workflow',
    ja: 'AI活用',
    tone: 'text-cyan-glow',
    time: '~8 min / day',
    steps: [
      { t: 'Agent triages every email on arrival', cost: 'auto' },
      { t: 'Deadlines extracted and logged to Sheets', cost: 'auto' },
      { t: 'Calendar tasks created with reminders', cost: 'auto' },
      { t: 'Replies pre-drafted in polite Japanese', cost: 'auto' },
      { t: 'Human reviews a short action list & approves', cost: '8 min' },
    ],
    verdict: 'Process-dependent. The system catches what attention misses.',
  },
}

export default function BeforeAfter() {
  const [mode, setMode] = useState('after')
  const m = MODES[mode]

  return (
    <section className="relative py-20 md:py-24">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <SectionHeading
          kicker="The Transformation"
          kickerJa="変革"
          title="Same inbox. Different system."
          lead="DX is not about tools — it's about redesigning who does what. Toggle to compare the daily routine before and after the agent."
        />

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.7 }}
          className="rounded-2xl glass-strong p-6 md:p-8"
        >
          {/* toggle */}
          <div className="mx-auto flex w-fit rounded-full glass p-1">
            {Object.entries(MODES).map(([key, v]) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`relative rounded-full px-5 py-2 text-[13px] font-semibold transition-colors ${
                  mode === key ? 'text-white' : 'text-mist-400 hover:text-mist-100'
                }`}
              >
                {mode === key && (
                  <motion.span
                    layoutId="ba-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-pulse-500 to-pulse-600"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative">
                  {v.title} <span lang="ja" className="text-[11px] opacity-70">{v.ja}</span>
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="mt-7"
            >
              <div className="flex items-baseline justify-between">
                <p className={`font-mono text-[13px] font-semibold ${m.tone}`}>{m.title}</p>
                <p className={`font-mono text-xl font-bold ${m.tone}`}>{m.time}</p>
              </div>
              <ul className="mt-4 space-y-2.5">
                {m.steps.map((s, i) => (
                  <motion.li
                    key={s.t}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-center justify-between gap-4 rounded-xl border border-white/7 bg-white/[0.03] px-4 py-3"
                  >
                    <span className="text-[13.5px] text-mist-100">{s.t}</span>
                    <span className={`shrink-0 font-mono text-[11px] ${s.cost === 'auto' ? 'text-cyan-glow' : 'text-mist-400'}`}>
                      {s.cost}
                    </span>
                  </motion.li>
                ))}
              </ul>
              <p className="mt-5 text-center text-[13px] italic text-mist-400">{m.verdict}</p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
