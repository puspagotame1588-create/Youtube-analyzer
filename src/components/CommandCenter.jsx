import { useRef, useState } from 'react'
import { useAnimationFrame, useReducedMotion } from 'framer-motion'
import { projects, hero } from '../config/content'

/**
 * Interactive 3D "AI Operations Command Center" — the hero visual.
 *
 * Drag (mouse or touch) to spin the scene. The three project modules
 * orbit a central "digital torii" — the gateway between business and
 * technology. Module names come from `projects` in config/content.js.
 *
 * Implementation: a tiny hand-rolled 3D projection (translate + scale
 * per frame) so the card text stays crisp DOM text, plus CSS 3D for
 * the torii itself. No WebGL — light and fast on mobile.
 */

const TILT = 0.22 // camera pitch in radians (looking slightly down)
const PERSP = 950 // perspective distance in px
const AUTO_SPEED = 0.00022 // idle spin, rad per ms
const CARD_W = 168

const TONES = {
  pulse: 'text-pulse-300 border-pulse-500/35',
  beni: 'text-beni-400 border-beni-500/35',
  cyan: 'text-cyan-glow border-cyan-glow/35',
}

// orbit slots for up to three modules: base angle + vertical offset
const SLOTS = [
  { angle: 0, y: -96 },
  { angle: (Math.PI * 2) / 3, y: -6 },
  { angle: (Math.PI * 4) / 3, y: 70 },
]

const MODULES = projects.slice(0, 3).map((p, i) => ({
  id: p.id,
  label: p.shortLabel,
  sub: p.shortSub,
  tone: p.tone,
  ...SLOTS[i],
}))

/* project a world point (x, y, z) through camera tilt + perspective */
function project(x, y, z) {
  const cy = y * Math.cos(TILT) + z * Math.sin(TILT)
  const cz = z * Math.cos(TILT) - y * Math.sin(TILT)
  const s = PERSP / (PERSP - cz)
  return { x: x * s, y: cy * s, s, z: cz }
}

export default function CommandCenter() {
  const stageRef = useRef(null)
  const toriiRef = useRef(null)
  const cardRefs = useRef([])
  const lineRefs = useRef([])
  const dotRefs = useRef([])
  const rotY = useRef(0.6)
  const velocity = useRef(0)
  const dragging = useRef(false)
  const lastX = useRef(0)
  const lastInteract = useRef(0)
  const [hasDragged, setHasDragged] = useState(false)
  const reduced = useReducedMotion()

  useAnimationFrame((t, dt) => {
    const stage = stageRef.current
    if (!stage || dt > 200) return
    const w = stage.clientWidth
    const radius = Math.min(215, Math.max(96, w * 0.3))

    // idle auto-rotation + inertia
    if (!dragging.current) {
      if (Math.abs(velocity.current) > 0.00001) {
        rotY.current += velocity.current * dt
        velocity.current *= Math.pow(0.994, dt)
      } else if (!reduced && t - lastInteract.current > 1800) {
        rotY.current += AUTO_SPEED * dt
      }
    }

    // torii rotates in true CSS 3D
    if (toriiRef.current) {
      toriiRef.current.style.transform = `translate(-50%, -50%) rotateX(${TILT}rad) rotateY(${rotY.current}rad)`
    }

    const core = project(0, -18, 0)

    MODULES.forEach((m, i) => {
      const a = m.angle + rotY.current
      const p = project(radius * Math.sin(a), m.y, radius * Math.cos(a))
      const el = cardRefs.current[i]
      if (el) {
        el.style.transform = `translate(-50%, -50%) translate(${p.x}px, ${p.y}px) scale(${p.s})`
        el.style.zIndex = p.z > 0 ? 30 : 10
        el.style.opacity = p.z > 0 ? 1 : 0.28
      }
      const line = lineRefs.current[i]
      if (line) {
        line.setAttribute('x1', core.x)
        line.setAttribute('y1', core.y)
        line.setAttribute('x2', p.x)
        line.setAttribute('y2', p.y)
        line.setAttribute('opacity', p.z > 0 ? 0.5 : 0.18)
      }
      const dot = dotRefs.current[i]
      if (dot) {
        const k = reduced ? 0.65 : ((t * 0.00035 + i / 3) % 1)
        dot.setAttribute('cx', core.x + (p.x - core.x) * k)
        dot.setAttribute('cy', core.y + (p.y - core.y) * k)
        dot.setAttribute('opacity', p.z > 0 ? 0.9 : 0.3)
      }
    })
  })

  const onPointerDown = (e) => {
    dragging.current = true
    lastX.current = e.clientX
    velocity.current = 0
    lastInteract.current = performance.now()
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!dragging.current) return
    const dx = e.clientX - lastX.current
    lastX.current = e.clientX
    rotY.current += dx * 0.006
    velocity.current = dx * 0.0004
    lastInteract.current = performance.now()
    if (!hasDragged && Math.abs(dx) > 2) setHasDragged(true)
  }
  const endDrag = () => {
    dragging.current = false
    lastInteract.current = performance.now()
  }

  return (
    <div className="relative rounded-2xl glass-strong ring-glow overflow-hidden select-none">
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

      {/* 3D stage — drag to rotate */}
      <div
        ref={stageRef}
        className="relative h-[380px] sm:h-[420px] cursor-grab active:cursor-grabbing touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
      >
        {/* soft core glow (billboard) */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(61,118,232,0.28) 0%, rgba(79,216,208,0.08) 45%, transparent 70%)',
          }}
        />

        {/* connection lines + data dots (screen space, projected) */}
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full"
          style={{ zIndex: 15, overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="cc-edge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#3d76e8" />
              <stop offset="1" stopColor="#4fd8d0" />
            </linearGradient>
          </defs>
          <g style={{ transform: 'translate(50%, 50%)' }}>
            {MODULES.map((m, i) => (
              <g key={m.id}>
                <line
                  ref={(el) => (lineRefs.current[i] = el)}
                  stroke="url(#cc-edge)"
                  strokeWidth="1"
                />
                <circle ref={(el) => (dotRefs.current[i] = el)} r="2.5" fill="#8ab8ff" />
              </g>
            ))}
          </g>
        </svg>

        {/* the digital torii — CSS 3D core */}
        <div
          className="absolute left-1/2 top-1/2 h-0 w-0"
          style={{ perspective: `${PERSP}px`, zIndex: 20 }}
        >
          <div ref={toriiRef} className="absolute preserve-3d">
            <Torii />
          </div>
        </div>

        {/* core label */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 text-center pointer-events-none"
          style={{ marginTop: 84, zIndex: 21 }}
        >
          <p className="font-mono text-[10px] tracking-[0.28em] text-pulse-300">{hero.core.label}</p>
          <p lang="ja" className="mt-0.5 font-mono text-[9.5px] text-mist-500">{hero.core.sub}</p>
        </div>

        {/* orbiting project modules (crisp DOM text, billboarded) */}
        {MODULES.map((m, i) => (
          <button
            key={m.id}
            ref={(el) => (cardRefs.current[i] = el)}
            type="button"
            onClick={() => document.querySelector('#projects')?.scrollIntoView({ behavior: 'smooth' })}
            className={`absolute left-1/2 top-1/2 rounded-xl glass border px-3 py-2.5 text-left transition-[opacity] duration-200 hover:!opacity-100 ${TONES[m.tone]}`}
            style={{ width: `clamp(136px, 36vw, ${CARD_W}px)`, willChange: 'transform' }}
          >
            <p className="text-[12px] font-semibold leading-tight text-white">{m.label}</p>
            <p lang="ja" className="mt-1 font-mono text-[10px] text-mist-400">{m.sub}</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-current animate-pulse-soft" />
              <span className="font-mono text-[9.5px] uppercase tracking-wider opacity-80">running</span>
            </div>
          </button>
        ))}

        {/* drag hint — fades after first interaction */}
        <div
          className={`absolute bottom-2.5 right-3.5 flex items-center gap-1.5 font-mono text-[10px] text-mist-400 transition-opacity duration-700 ${
            hasDragged ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ zIndex: 22 }}
        >
          <RotateIcon />
          {hero.dragHint}
        </div>
      </div>

      {/* bottom readout */}
      <div className="relative flex items-center justify-between border-t border-white/8 bg-ink-950/40 px-4 py-2 font-mono text-[10px] text-mist-400" style={{ zIndex: 25 }}>
        <span className="truncate">in: gmail · docs · 店舗運営</span>
        <span className="hidden sm:inline">out: sheets · calendar · replies</span>
      </div>
    </div>
  )
}

/* ---------- Digital torii gate, built from CSS 3D cuboids ---------- */

const FACE_FRONT = 'linear-gradient(135deg, #4a86f0, #37c9c0)'
const FACE_SIDE = 'linear-gradient(135deg, #24478f, #1d6f75)'
const FACE_TOP = 'linear-gradient(135deg, #8ab8ff, #4fd8d0)'

function Face({ w, h, transform, bg, opacity = 1 }) {
  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{
        width: w,
        height: h,
        transform,
        background: bg,
        opacity,
        backfaceVisibility: 'hidden',
      }}
    />
  )
}

function Cuboid({ w, h, d, x = 0, y = 0, z = 0 }) {
  return (
    <div className="absolute preserve-3d" style={{ transform: `translate3d(${x}px, ${y}px, ${z}px)` }}>
      <Face w={w} h={h} bg={FACE_FRONT} transform={`translate(-50%,-50%) translateZ(${d / 2}px)`} />
      <Face w={w} h={h} bg={FACE_FRONT} transform={`translate(-50%,-50%) rotateY(180deg) translateZ(${d / 2}px)`} />
      <Face w={d} h={h} bg={FACE_SIDE} transform={`translate(-50%,-50%) rotateY(90deg) translateZ(${w / 2}px)`} />
      <Face w={d} h={h} bg={FACE_SIDE} transform={`translate(-50%,-50%) rotateY(-90deg) translateZ(${w / 2}px)`} />
      <Face w={w} h={d} bg={FACE_TOP} transform={`translate(-50%,-50%) rotateX(90deg) translateZ(${h / 2}px)`} />
      <Face w={w} h={d} bg={FACE_SIDE} transform={`translate(-50%,-50%) rotateX(-90deg) translateZ(${h / 2}px)`} opacity={0.7} />
    </div>
  )
}

function Torii() {
  return (
    <>
      {/* kasagi (top lintel) + shimaki below it */}
      <Cuboid w={184} h={12} d={18} y={-64} />
      <Cuboid w={158} h={8} d={14} y={-53} />
      {/* nuki (tie beam) */}
      <Cuboid w={148} h={8} d={11} y={-24} />
      {/* gakuzuka (center strut) */}
      <Cuboid w={9} h={21} d={8} y={-38} />
      {/* pillars */}
      <Cuboid w={12} h={96} d={12} x={-56} y={4} />
      <Cuboid w={12} h={96} d={12} x={56} y={4} />
      {/* glowing platform ring under the gate (flat in 3D) */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 rounded-full border border-cyan-glow/40"
        style={{
          width: 190,
          height: 190,
          transform: 'translate(-50%,-50%) translateY(54px) rotateX(90deg)',
          boxShadow: '0 0 24px rgba(79,216,208,0.35), inset 0 0 24px rgba(61,118,232,0.3)',
        }}
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 rounded-full border border-pulse-500/25"
        style={{
          width: 250,
          height: 250,
          transform: 'translate(-50%,-50%) translateY(54px) rotateX(90deg)',
        }}
      />
    </>
  )
}

function RotateIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85 1 6.57 2.57L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  )
}
