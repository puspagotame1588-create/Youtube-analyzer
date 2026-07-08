import { motion, useScroll, useTransform } from 'framer-motion'

/**
 * Fixed ambient layer: Tokyo grid (with scroll parallax), radial glows
 * (slow drift), falling data streams, floating particles.
 * Pure CSS animation + one scroll-linked transform — cheap on mobile.
 */
const STREAMS = [
  { left: '8%', duration: '11s', delay: '0s' },
  { left: '22%', duration: '14s', delay: '3s' },
  { left: '37%', duration: '10s', delay: '6s' },
  { left: '58%', duration: '13s', delay: '1.5s' },
  { left: '74%', duration: '12s', delay: '4.5s' },
  { left: '91%', duration: '15s', delay: '2s' },
]

const PARTICLES = [
  { left: '12%', top: '22%', size: 3, duration: '16s', delay: '0s' },
  { left: '28%', top: '64%', size: 2, duration: '21s', delay: '2s' },
  { left: '41%', top: '35%', size: 2, duration: '18s', delay: '5s' },
  { left: '55%', top: '78%', size: 3, duration: '23s', delay: '1s' },
  { left: '67%', top: '18%', size: 2, duration: '19s', delay: '7s' },
  { left: '79%', top: '52%', size: 3, duration: '17s', delay: '3.5s' },
  { left: '88%', top: '30%', size: 2, duration: '22s', delay: '6s' },
  { left: '18%', top: '85%', size: 2, duration: '20s', delay: '4s' },
]

export default function Background() {
  const { scrollY } = useScroll()
  const gridY = useTransform(scrollY, [0, 2000], [0, -110])

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
      {/* base glows — slow ambient drift */}
      <div className="absolute inset-0 animate-glow-drift bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(47,92,196,0.16),transparent_60%)]" />
      <div className="absolute inset-0 animate-glow-drift-alt bg-[radial-gradient(ellipse_50%_40%_at_85%_20%,rgba(79,216,208,0.06),transparent_65%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_35%_at_10%_75%,rgba(224,96,61,0.05),transparent_65%)]" />

      {/* Tokyo grid with gentle scroll parallax (depth layer) */}
      <motion.div style={{ y: gridY }} className="absolute -inset-y-32 inset-x-0 bg-tokyo-grid" />

      {/* data streams */}
      {STREAMS.map((s, i) => (
        <span
          key={i}
          className="data-stream"
          style={{ left: s.left, animationDuration: s.duration, animationDelay: s.delay }}
        />
      ))}

      {/* floating particles */}
      {PARTICLES.map((p, i) => (
        <span
          key={`p${i}`}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  )
}
