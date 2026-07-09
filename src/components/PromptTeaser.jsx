import { motion } from 'framer-motion'
import { promptTeaser } from '../config/content'
import { prompts } from '../config/prompts'
import SectionHeading from './SectionHeading'
import { fadeUp, stagger, viewportOnce } from '../lib/anim'

/**
 * Surfaces the Prompt Vault as skill evidence (prompt-system design),
 * showing three free prompts as mini cards that link to #/vault.
 */
export default function PromptTeaser() {
  const featured = prompts.filter((p) => !p.isPremium).slice(0, 3)

  return (
    <section id="prompt-systems" className="relative py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          kicker="Prompt Systems"
          kickerJa="プロンプト設計"
          title={promptTeaser.title}
          lead={promptTeaser.lead}
        />

        <motion.div
          className="grid gap-4 sm:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={stagger}
        >
          {featured.map((p, i) => (
            <motion.a
              key={p.id}
              href="#/vault"
              variants={fadeUp}
              custom={i}
              whileHover={{ y: -5, transition: { duration: 0.25 } }}
              className="rounded-2xl glass p-5 hover:border-pulse-400/35 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span className="rounded-md border border-white/10 bg-ink-950/60 px-2 py-0.5 font-mono text-[10px] text-mist-400">
                  {p.tool}
                </span>
                <span className="rounded-md border border-cyan-glow/40 bg-cyan-glow/10 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-glow">
                  FREE
                </span>
              </div>
              <h3 className="mt-3 text-[15px] font-bold text-white leading-snug">{p.title}</h3>
              <p lang="ja" className="mt-0.5 text-[11px] text-mist-500">{p.titleJa}</p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-mist-400 line-clamp-2">{p.description}</p>
            </motion.a>
          ))}
        </motion.div>

        <div className="mt-7 text-center">
          <a
            href="#/vault"
            className="inline-flex items-center gap-2 rounded-full glass px-6 py-3 text-[13.5px] font-semibold text-white hover:border-pulse-400/40 transition-colors"
          >
            {promptTeaser.cta} <span lang="ja" className="text-[11px] text-mist-400">プロンプト保管庫</span> →
          </a>
        </div>
      </div>
    </section>
  )
}
