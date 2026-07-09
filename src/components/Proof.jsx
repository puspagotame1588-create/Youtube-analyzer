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

          {/* right column: screenshots (designed previews until real images are set) */}
          <motion.div variants={fadeUp} custom={1} className="grid gap-4">
            {proof.screens.map((sc, i) => (
              <figure
                key={sc.caption}
                className={`rounded-2xl glass overflow-hidden ${i === 0 ? '' : 'hidden sm:block'}`}
              >
                <div className="relative aspect-[21/9] bg-ink-900 overflow-hidden">
                  {sc.src ? (
                    <img src={sc.src} alt={sc.caption} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <MockPreview kind={i} />
                  )}
                </div>
                <figcaption className="flex items-center justify-between border-t border-white/6 px-4 py-2.5 font-mono text-[11px] text-mist-400">
                  {sc.caption}
                  {!sc.src && <span className="text-[9.5px] text-mist-500">illustrative preview</span>}
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

/* Stylized system previews shown until real screenshots replace them.
   kind 0: workflow canvas · kind 1: RAG answer with citations · kind 2: log sheet */
function MockPreview({ kind }) {
  if (kind === 0) {
    const nodes = [
      { x: '8%', y: '38%', label: 'Gmail' },
      { x: '30%', y: '18%', label: 'Classify' },
      { x: '30%', y: '58%', label: 'Extract' },
      { x: '54%', y: '38%', label: 'Review' },
      { x: '78%', y: '18%', label: 'Calendar' },
      { x: '78%', y: '58%', label: 'Sheets' },
    ]
    return (
      <div className="absolute inset-0 p-4">
        <svg className="absolute inset-0 h-full w-full" aria-hidden>
          {[
            ['12%', '48%', '32%', '30%'],
            ['12%', '48%', '32%', '68%'],
            ['36%', '28%', '56%', '48%'],
            ['36%', '66%', '56%', '48%'],
            ['60%', '46%', '80%', '28%'],
            ['60%', '48%', '80%', '66%'],
          ].map(([x1, y1, x2, y2], j) => (
            <line key={j} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(94,150,245,0.35)" strokeWidth="1.5" strokeDasharray="4 3" />
          ))}
        </svg>
        {nodes.map((n) => (
          <span
            key={n.label}
            className="absolute rounded-md border border-pulse-500/40 bg-ink-950/80 px-2 py-1 font-mono text-[9px] text-pulse-300"
            style={{ left: n.x, top: n.y }}
          >
            {n.label}
          </span>
        ))}
      </div>
    )
  }
  if (kind === 1) {
    return (
      <div className="absolute inset-0 flex flex-col justify-center gap-2 p-5">
        <div lang="ja" className="self-end max-w-[55%] rounded-lg rounded-br-sm bg-pulse-500/25 px-3 py-1.5 text-[10px] text-mist-100">
          返品対応の手順を教えてください
        </div>
        <div className="self-start max-w-[70%] rounded-lg rounded-bl-sm border border-white/8 bg-ink-950/70 px-3 py-2 text-[10px] leading-relaxed text-mist-300">
          <span lang="ja">レシートを確認し、7日以内であれば返金処理を行います。店長承認が必要です。</span>
          <span className="mt-1.5 flex gap-1.5">
            <span className="rounded border border-cyan-glow/40 px-1.5 py-0.5 font-mono text-[8px] text-cyan-glow">返品規定.pdf · p.3</span>
            <span className="rounded border border-cyan-glow/40 px-1.5 py-0.5 font-mono text-[8px] text-cyan-glow">店舗マニュアル · §2.4</span>
          </span>
        </div>
      </div>
    )
  }
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-1 px-5">
      {[
        ['09:14', 'prof.tanaka@…', 'HIGH', '期末レポート', 'approved ✓'],
        ['10:02', 'store-shift…', 'MED', 'シフト変更', 'approved ✓'],
        ['11:47', 'newsletter…', 'LOW', '—', 'archived'],
        ['13:21', 'invoice_0231', 'HIGH', '支払期限 7/17', 'pending ⏳'],
      ].map((row, j) => (
        <div key={j} className={`grid grid-cols-[38px_1fr_36px_1fr_64px] gap-2 rounded border border-white/6 px-2.5 py-1 font-mono text-[8.5px] ${j === 0 ? 'bg-pulse-500/10 text-mist-200' : 'bg-ink-950/50 text-mist-400'}`}>
          {row.map((cell, k) => (
            <span key={k} lang="ja" className="truncate">{cell}</span>
          ))}
        </div>
      ))}
    </div>
  )
}
