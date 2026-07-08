import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { about } from '../config/content'
import SectionHeading from './SectionHeading'
import { viewportOnce } from '../lib/anim'

const CONTENT = { en: about.en, ja: about.ja }
const FACTS = about.facts

export default function About() {
  const [lang, setLang] = useState('en')
  const c = CONTENT[lang]

  return (
    <section id="about" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          kicker="About Me"
          kickerJa="自己紹介"
          title={about.title}
        />

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          {/* bio with language toggle */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.7 }}
            className="rounded-2xl glass-strong p-7 md:p-9"
          >
            <div className="flex w-fit rounded-full glass p-1">
              {[
                { id: 'en', label: 'English' },
                { id: 'ja', label: '日本語' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setLang(t.id)}
                  className={`relative rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-colors ${
                    lang === t.id ? 'text-white' : 'text-mist-400 hover:text-mist-100'
                  }`}
                >
                  {lang === t.id && (
                    <motion.span
                      layoutId="lang-pill"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-pulse-500 to-pulse-600"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative" lang={t.id}>{t.label}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={lang}
                lang={lang}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <p className="mt-6 text-[19px] font-bold text-white leading-snug">{c.lead}</p>
                {c.paras.map((p, i) => (
                  <p key={i} className="mt-4 text-[14.5px] leading-[1.85] text-mist-300">
                    {p}
                  </p>
                ))}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* fact sheet */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="rounded-2xl glass p-7 h-fit lg:sticky lg:top-24"
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-pulse-300">
              Fact sheet
            </p>
            <dl className="mt-5 space-y-4">
              {FACTS.map((f) => (
                <div key={f.k} className="border-b border-white/6 pb-4 last:border-0 last:pb-0">
                  <dt className="text-[11.5px] font-medium text-mist-500">{f.k}</dt>
                  <dd className="mt-1 text-[13.5px] font-semibold text-white leading-relaxed">{f.v}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
