import { motion } from 'framer-motion'
import { video, profile } from '../config/content'
import SectionHeading from './SectionHeading'
import { fadeUp, stagger, viewportOnce } from '../lib/anim'

export default function VideoSection() {
  return (
    <section id="video" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          kicker="Portfolio Video"
          kickerJa="自己紹介動画"
          title={video.title}
          lead={video.lead}
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
              {profile.videoEmbedUrl ? (
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={profile.videoEmbedUrl}
                  title={`Portfolio introduction video — ${profile.name}`}
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
                      Set <code className="font-mono text-pulse-300">profile.videoEmbedUrl</code> in{' '}
                      <code className="font-mono text-pulse-300">src/config/content.js</code>
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
            {video.summary.map((s) => (
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
