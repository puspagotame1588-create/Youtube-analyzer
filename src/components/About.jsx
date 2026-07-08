import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SectionHeading from './SectionHeading'
import { viewportOnce } from '../lib/anim'

const CONTENT = {
  en: {
    lead: 'Business student in Japan. Builder of practical AI automation.',
    paras: [
      'I am a Nepali international student at Teikyo University (Economics / Business Administration), living and working in Japan. Alongside my degree, I have spent 2+ years on the frontline — McDonald’s and convenience store operations — learning how Japanese workplaces actually run: the standards, the pace, and the small failures that cost real money.',
      'That frontline view is where my AI work starts. I don’t build demos for technology’s sake — I build tools for problems I have personally watched happen: missed emails and deadlines, foreign staff struggling with customer-service Japanese, teams losing time searching internal documents.',
      'My goal is to grow into an AI Product Manager / AI-DX Consultant — the person who can sit with business stakeholders in Japanese, define the problem precisely, and then build (or direct) the automation that solves it.',
    ],
  },
  ja: {
    lead: '現場を知る、AI自動化を作るビジネス学生です。',
    paras: [
      '帝京大学で経済学・経営学を学ぶ、ネパール出身の留学生です。日本語（JLPT N1）と英語（TOEIC 905）でのコミュニケーションに加え、マクドナルドで2年以上、コンビニエンスストアでの勤務を通じて、日本の現場のオペレーションを実際に経験してきました。',
      'その経験から「現場の課題を理解し、テクノロジーで解決する」ことに強い関心を持ち、現在はメール自動処理エージェント、RAGナレッジアシスタント、接客トレーニングAIなど、実務に直結するAIツールを自ら開発しています。',
      '将来の目標は、ビジネスと技術の橋渡しができるAI/DXコンサルタント・AIプロダクトマネージャーとして、日本企業のDX推進に貢献することです。',
    ],
  },
}

const FACTS = [
  { k: 'University', v: 'Teikyo University — Economics / Business Administration' },
  { k: 'Languages', v: 'Japanese (JLPT N1) · English (TOEIC 905) · Nepali · Hindi' },
  { k: 'Frontline experience', v: 'McDonald’s (2+ yrs) · Convenience store operations' },
  { k: 'Certifications', v: 'JLPT N1 · TOEIC 905 · MOS Excel · MOS Word' },
  { k: 'Career goal', v: 'AI Product Manager / AI-DX Consultant' },
]

export default function About() {
  const [lang, setLang] = useState('en')
  const c = CONTENT[lang]

  return (
    <section id="about" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          kicker="About Me"
          kickerJa="自己紹介"
          title="Frontline experience is my unfair advantage"
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
