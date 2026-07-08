import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { projects } from '../config/content'

/**
 * 3D "AI Operations Command Center" — the hero visual.
 * Projects rendered as live modules wired into a central AI core.
 * Module names/subtitles come from `projects` in config/content.js —
 * edit a project there and this visual updates too.
 * CSS 3D + SVG animation only (no WebGL) for stability and mobile perf.
 */

// screen positions for up to three modules (presentation only)
const SLOTS = [
  { x: 4, y: 12 },
  { x: 64, y: 8 },
  { x: 8, y: 66 },
]

const MODULES = projects.slice(0, 3).map((p, i) => ({
  id: p.id,
  label: p.shortLabel,
  sub: p.shortSub,
  tone: p.tone,
  ...SLOTS[i],
}))

const CORE = { x: 58, y: 52 } // % coordinates of the AI core center

function edgePath(m) {
  // smooth curve from module center-ish to core
  const mx = m.x + 16
  const my = m.y + 9
  const cx = (mx + CORE.x) / 2
  return `M ${mx} ${my} Q ${cx} ${(my + CORE.y) / 2 - 6} ${CORE.x} ${CORE.y}`
}

const toneCls = {
  pulse: 'text-pulse-300 border-pulse-500/30',
  beni: 'text-beni-400 border-beni-500/30',
  cyan: 'text-cyan-glow border-cyan-glow/30',
}

export default function CommandCenter() {
  const ref = useRef(null)
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rotateY = useSpring(useTransform(mx, [0, 1], [-7, 7]), { stiffness: 120, damping: 18 })
  const rotateX = useSpring(useTransform(my, [0, 1], [6, -6]), { stiffness: 120, damping: 18 })

  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    mx.set((e.clientX - r.left) / r.width)
    my.set((e.clientY - r.top) / r.height)
  }
  const onLeave = () => {
    mx.set(0.5)
    my.set(0.5)
  }

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className="perspective-1200">
      <motion.div
        style={{ rotateX, rotateY }}
        className="preserve-3d relative rounded-2xl glass-strong ring-glow overflow-hidden"
      >
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-white/8 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="ml-2 font-mono text-[11px] text-mist-400">
            ai-operations — command center
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10.5px] text-cyan-glow">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-glow animate-pulse-soft" />
            LIVE
          </span>
        </div>

        {/* stage */}
        <div className="relative h-[340px] sm:h-[380px]">
          {/* wiring */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#3d76e8" stopOpacity="0.55" />
                <stop offset="1" stopColor="#4fd8d0" stopOpacity="0.55" />
              </linearGradient>
            </defs>
            {MODULES.map((m, i) => (
              <g key={m.id}>
                <path d={edgePath(m)} fill="none" stroke="url(#edge)" strokeWidth="0.35" opacity="0.6" />
                <circle r="0.9" fill="#8ab8ff">
                  <animateMotion dur={`${3 + i * 0.9}s`} repeatCount="indefinite" path={edgePath(m)} />
                </circle>
              </g>
            ))}
          </svg>

          {/* AI core */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${CORE.x}%`, top: `${CORE.y}%`, transform: 'translate(-50%,-50%) translateZ(40px)' }}
          >
            <div className="relative grid place-items-center">
              <span className="absolute h-24 w-24 rounded-full border border-pulse-500/25 animate-[spin_14s_linear_infinite]" style={{ borderTopColor: 'rgba(138,184,255,0.7)' }} />
              <span className="absolute h-[7.5rem] w-[7.5rem] rounded-full border border-cyan-glow/15 animate-[spin_22s_linear_infinite_reverse]" style={{ borderBottomColor: 'rgba(79,216,208,0.5)' }} />
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-pulse-500 to-pulse-600 shadow-[0_0_40px_-6px_rgba(61,118,232,0.8)]">
                <BrainIcon />
              </div>
            </div>
            <p className="mt-8 text-center font-mono text-[10px] tracking-widest text-pulse-300">AI CORE</p>
          </div>

          {/* project modules */}
          {MODULES.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.18, duration: 0.6 }}
              className={`absolute w-[168px] rounded-xl glass border px-3 py-2.5 ${toneCls[m.tone]}`}
              style={{ left: `${m.x}%`, top: `${m.y}%`, transform: 'translateZ(28px)' }}
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
              >
                <p className="text-[12px] font-semibold leading-tight text-white">{m.label}</p>
                <p lang="ja" className="mt-1 font-mono text-[10px] text-mist-400">{m.sub}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-current animate-pulse-soft" />
                  <span className="font-mono text-[9.5px] uppercase tracking-wider opacity-80">running</span>
                </div>
              </motion.div>
            </motion.div>
          ))}

          {/* bottom readout */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/8 bg-ink-950/40 px-4 py-2 font-mono text-[10px] text-mist-400">
            <span className="truncate">in: gmail · docs · 店舗運営</span>
            <span className="hidden sm:inline">out: sheets · calendar · replies</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function BrainIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08A2.5 2.5 0 0 0 12 19.5Z" />
      <path d="M12 4.5a2.5 2.5 0 0 1 4.96-.46 2.5 2.5 0 0 1 1.98 3 2.5 2.5 0 0 1 1.32 4.24 3 3 0 0 1-.34 5.58 2.5 2.5 0 0 1-2.96 3.08A2.5 2.5 0 0 1 12 19.5Z" />
      <path d="M12 4.5v15" />
    </svg>
  )
}
