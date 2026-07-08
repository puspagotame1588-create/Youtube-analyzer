import { motion } from 'framer-motion'
import site from '../config/site'
import SectionHeading from './SectionHeading'
import { fadeUp, stagger, viewportOnce } from '../lib/anim'

const SUMMARY = [
  {
    q: 'Who I am',
    a: 'Business student in Japan (Teikyo University, Economics) with JLPT N1, TOEIC 905, and 2+ years of frontline operations at McDonald’s and a convenience store.',
  },
  {
    q: 'What I build',
    a: 'Practical AI automation — an email-to-action agent, a bilingual customer-service training coach, and a RAG knowledge assistant — all born from problems I saw at work.',
  },
  {
    q: 'Why AI/DX consulting',
    a: 'I sit between business and technology: I can map an operation in Japanese, spec the automation in English, and build the working prototype myself.',
  },
  {
    q: 'Roles I’m targeting',
    a: 'AI/DX Consultant · AI Solutions Consultant · AI Product & Automation roles — new-grad and internship positions in Japan.',
  },
]

export default function VideoSection() {
  return (
    <section id="video" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          kicker="Portfolio Video"
          kickerJa="自己紹介動画"
          title="Three minutes: who I am and what I build"
          lead="A short introduction covering my background, my three AI/DX projects, and why I fit AI consulting roles in Japan."
        />

        <motion.div
          className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] items-stretch"
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={stagger}
        >
          {/* Player */}
          <motion.div variants={fadeUp} className="relative rounded-2xl glass-strong p-2 ring-glow">
            <div className="relative aspect-video overflow-hidden rounded-xl bg-ink-900">
              {site.videoEmbedUrl ? (
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={site.videoEmbedUrl}
                  title="Portfolio introduction video — Puspa Gotame"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center px-6">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-pulse-500 to-pulse-600 shadow-[0_0_36px_-6px_rgba(61,118,232,0.8)]">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5.14v13.72L19 12 8 5.14z" />
                      </svg>
                    </div>
                    <p className="mt-4 text-[15px] font-semibold text-white">Portfolio video</p>
                    <p className="mt-1 text-[13px] text-mist-400">
                      Set <code className="font-mono text-pulse-300">videoEmbedUrl</code> in{' '}
                      <code className="font-mono text-pulse-300">src/config/site.js</code>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Summary */}
          <motion.aside variants={fadeUp} custom={1} className="rounded-2xl glass p-6 md:p-7 flex flex-col gap-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-pulse-300">
              Video summary
            </p>
            {SUMMARY.map((s) => (
              <div key={s.q}>
                <p className="text-[13.5px] font-semibold text-white">{s.q}</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-mist-400">{s.a}</p>
              </div>
            ))}
          </motion.aside>
        </motion.div>
      </div>
    </section>
  )
}
