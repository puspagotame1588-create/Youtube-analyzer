import { useEffect, useRef, useState } from 'react'
import { useAnimationFrame, useReducedMotion } from 'framer-motion'
import { hero } from '../config/content'

/**
 * Interactive 3D "AI Operations Command Center" — the hero visual.
 *
 * A living workflow diagram: the real nodes of my automation pipeline
 * (Gmail, RAG Docs, Sheets, Calendar, Human Review, Dashboard) orbit
 * the LLM core (a digital torii). Three ways to explore:
 *   - drag to rotate the whole scene (inertia, auto-spin when idle)
 *   - hover/tap a node → its connection lights up + role explained
 *   - tap Gmail → a LIVE RUN: a glowing packet travels the pipeline
 *     stage by stage (LLM processing → human review → dashboard →
 *     calendar) with a narrated caption. Sequence lives in content.js.
 *
 * Implementation: hand-rolled 3D projection per frame (crisp DOM text),
 * CSS 3D for the torii. No WebGL — fast on mobile.
 */

const TILT = 0.22
const PERSP = 950
const AUTO_SPEED = 0.00022 // idle spin, rad per ms

const SLOTS = [
  { angle: 0, y: -102 },
  { angle: Math.PI / 3, y: -18 },
  { angle: (Math.PI * 2) / 3, y: 76 },
  { angle: Math.PI, y: -78 },
  { angle: (Math.PI * 4) / 3, y: 10 },
  { angle: (Math.PI * 5) / 3, y: 96 },
]

const NODES = hero.nodes.slice(0, 6).map((n, i) => ({ ...n, ...SLOTS[i] }))
const RUN = hero.run.steps

function project(x, y, z) {
  const cy = y * Math.cos(TILT) + z * Math.sin(TILT)
  const cz = z * Math.cos(TILT) - y * Math.sin(TILT)
  const s = PERSP / (PERSP - cz)
  return { x: x * s, y: cy * s, s, z: cz }
}

const smooth = (p) => p * p * (3 - 2 * p) // smoothstep easing

export default function CommandCenter() {
  const stageRef = useRef(null)
  const toriiRef = useRef(null)
  const packetRef = useRef(null)
  const nodeRefs = useRef([])
  const lineRefs = useRef([])
  const dotRefs = useRef([])
  const rotY = useRef(0.6)
  const velocity = useRef(0)
  const dragging = useRef(false)
  const lastX = useRef(0)
  const lastInteract = useRef(0)
  // live-run state machine: idx -1 idle · 0..n running · n done-display
  const runRef = useRef({ idx: -1, start: null, applied: -1, doneAt: null })
  const resetTimer = useRef(null)
  const [hasDragged, setHasDragged] = useState(false)
  const [hasRun, setHasRun] = useState(false)
  const [selected, setSelected] = useState(null) // node object or 'core'
  const [runCaption, setRunCaption] = useState(null)
  const [activeId, setActiveId] = useState(null) // node highlighted by the run
  const [coreBusy, setCoreBusy] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => () => clearTimeout(resetTimer.current), [])

  const startRun = () => {
    const rs = runRef.current
    if (rs.idx !== -1) return
    clearTimeout(resetTimer.current)
    rs.idx = 0
    rs.start = null
    rs.applied = -1
    setHasRun(true)
    setSelected(null)
    lastInteract.current = performance.now()
  }

  useAnimationFrame((t, dt) => {
    const stage = stageRef.current
    if (!stage || dt > 200) return
    const w = stage.clientWidth
    const radius = Math.min(210, Math.max(96, w * 0.31))
    const rs = runRef.current
    const running = rs.idx >= 0 && rs.idx < RUN.length

    if (!dragging.current) {
      if (Math.abs(velocity.current) > 0.00001) {
        rotY.current += velocity.current * dt
        velocity.current *= Math.pow(0.994, dt)
      } else if (!reduced && !selected && t - lastInteract.current > 1800) {
        // keep spinning gently during a run — packets track the motion
        rotY.current += AUTO_SPEED * dt * (running ? 0.55 : 1)
      }
    }

    if (toriiRef.current) {
      toriiRef.current.style.transform = `translate(-50%, -50%) rotateX(${TILT}rad) rotateY(${rotY.current}rad)`
    }

    // project everything this frame
    const pos = { core: project(0, -18, 0) }
    NODES.forEach((n, i) => {
      const a = n.angle + rotY.current
      const p = project(radius * Math.sin(a), n.y, radius * Math.cos(a))
      pos[n.id] = p
      const el = nodeRefs.current[i]
      if (el) {
        el.style.transform = `translate(-50%, -50%) translate(${p.x}px, ${p.y}px) scale(${p.s})`
        el.style.zIndex = p.z > 0 ? 30 : 10
        el.style.opacity = p.z > 0 ? 1 : 0.35
      }
      // connection: brighter + thicker when this node is hovered/active
      const hot = selected?.id === n.id || activeId === n.id
      const line = lineRefs.current[i]
      if (line) {
        line.setAttribute('x1', pos.core.x)
        line.setAttribute('y1', pos.core.y)
        line.setAttribute('x2', p.x)
        line.setAttribute('y2', p.y)
        line.setAttribute('opacity', hot ? 0.95 : p.z > 0 ? 0.45 : 0.14)
        line.setAttribute('stroke-width', hot ? 1.8 : 1)
      }
      const dot = dotRefs.current[i]
      if (dot) {
        const speed = hot ? 0.0009 : 0.00035
        const k = reduced ? 0.65 : ((t * speed + i / 6) % 1)
        dot.setAttribute('cx', pos.core.x + (p.x - pos.core.x) * k)
        dot.setAttribute('cy', pos.core.y + (p.y - pos.core.y) * k)
        dot.setAttribute('r', hot ? 3.2 : 2.5)
        dot.setAttribute('opacity', hot ? 1 : p.z > 0 ? 0.85 : 0.22)
      }
    })

    /* ---------- live run state machine ---------- */
    const packet = packetRef.current
    if (rs.idx >= 0 && rs.idx < RUN.length) {
      const step = RUN[rs.idx]
      if (rs.start === null) rs.start = t
      // apply per-step side effects once
      if (rs.applied !== rs.idx) {
        rs.applied = rs.idx
        setRunCaption(step.caption)
        if (step.type === 'process') {
          setActiveId(step.at === 'core' ? null : step.at)
          setCoreBusy(step.at === 'core')
        } else {
          setActiveId(step.to === 'core' ? null : step.to)
          setCoreBusy(false)
        }
      }
      const ms = reduced ? Math.min(step.ms, 300) : step.ms
      const p = Math.min((t - rs.start) / ms, 1)

      if (packet) {
        if (step.type === 'travel') {
          const a = pos[step.from]
          const b = pos[step.to]
          let x, y
          if (step.from !== 'core' && step.to !== 'core') {
            // route via the core so packets follow the drawn spokes
            const c = pos.core
            if (p < 0.5) {
              const k = smooth(p * 2)
              x = a.x + (c.x - a.x) * k
              y = a.y + (c.y - a.y) * k
            } else {
              const k = smooth((p - 0.5) * 2)
              x = c.x + (b.x - c.x) * k
              y = c.y + (b.y - c.y) * k
            }
          } else {
            const k = smooth(p)
            x = a.x + (b.x - a.x) * k
            y = a.y + (b.y - a.y) * k
          }
          packet.style.display = 'block'
          packet.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`
        } else {
          packet.style.display = 'none'
        }
      }

      if (p >= 1) {
        rs.idx += 1
        rs.start = null
      }
    } else if (rs.idx === RUN.length) {
      // run finished — show completion, then reset after a beat
      rs.idx = -2
      if (packet) packet.style.display = 'none'
      setActiveId(null)
      setCoreBusy(false)
      setRunCaption(hero.run.done)
      resetTimer.current = setTimeout(() => {
        setRunCaption(null)
        runRef.current.idx = -1
      }, 3200)
    }
  })

  const onPointerDown = (e) => {
    // NOTE: no pointer capture here — capturing retargets pointerup to the
    // stage and swallows click/tap events on the node buttons.
    dragging.current = true
    lastX.current = e.clientX
    velocity.current = 0
    lastInteract.current = performance.now()
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

  const info = selected === 'core' ? hero.core : selected
  const isRunning = runCaption !== null

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
        <span className={`ml-auto inline-flex items-center gap-1.5 font-mono text-[10.5px] ${isRunning ? 'text-beni-400' : 'text-cyan-glow'}`}>
          <span className={`h-1.5 w-1.5 rounded-full animate-pulse-soft ${isRunning ? 'bg-beni-400' : 'bg-cyan-glow'}`} />
          {isRunning ? 'RUNNING' : 'LIVE'}
        </span>
      </div>

      {/* 3D stage */}
      <div
        ref={stageRef}
        className="relative h-[400px] sm:h-[430px] cursor-grab active:cursor-grabbing touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={(e) => {
          endDrag()
          if (e.pointerType === 'mouse') setSelected(null)
        }}
        onPointerCancel={endDrag}
      >
        {/* soft core glow — brightens while the LLM processes */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-500"
          style={{
            background:
              'radial-gradient(circle, rgba(61,118,232,0.28) 0%, rgba(79,216,208,0.08) 45%, transparent 70%)',
            opacity: coreBusy ? 1.6 : 1,
          }}
        />

        {/* connection lines + ambient data dots */}
        <svg aria-hidden className="absolute inset-0 h-full w-full" style={{ zIndex: 15, overflow: 'visible' }}>
          <defs>
            <linearGradient id="cc-edge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#3d76e8" />
              <stop offset="1" stopColor="#4fd8d0" />
            </linearGradient>
          </defs>
          <g style={{ transform: 'translate(50%, 50%)' }}>
            {NODES.map((n, i) => (
              <g key={n.id}>
                <line ref={(el) => (lineRefs.current[i] = el)} stroke="url(#cc-edge)" strokeWidth="1" />
                <circle ref={(el) => (dotRefs.current[i] = el)} r="2.5" fill="#8ab8ff" />
              </g>
            ))}
          </g>
        </svg>

        {/* the digital torii — CSS 3D LLM core */}
        <div className="absolute left-1/2 top-1/2 h-0 w-0" style={{ perspective: `${PERSP}px`, zIndex: 20 }}>
          <div ref={toriiRef} className="absolute preserve-3d">
            <Torii />
          </div>
        </div>

        {/* LLM processing ring — appears while the core is classifying */}
        <div
          aria-hidden
          className={`absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-cyan-glow/70 transition-opacity duration-300 ${
            coreBusy ? 'opacity-100 animate-[spin_1.3s_linear_infinite]' : 'opacity-0'
          }`}
          style={{ zIndex: 20 }}
        />

        {/* core hit area */}
        <button
          type="button"
          aria-label={hero.core.label}
          onPointerEnter={() => setSelected('core')}
          onClick={() => setSelected(selected === 'core' ? null : 'core')}
          className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ zIndex: 21 }}
        />

        {/* core label */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 text-center pointer-events-none"
          style={{ marginTop: 84, zIndex: 21 }}
        >
          <p className={`font-mono text-[10px] tracking-[0.28em] transition-colors duration-300 ${coreBusy ? 'text-cyan-glow' : 'text-pulse-300'}`}>
            {coreBusy ? 'PROCESSING' : hero.core.label}
          </p>
          <p lang="ja" className="mt-0.5 font-mono text-[9.5px] text-mist-500">{hero.core.sub}</p>
        </div>

        {/* travelling packet (live run) */}
        <div
          ref={packetRef}
          aria-hidden
          className="absolute left-1/2 top-1/2 h-3 w-3 rounded-full bg-cyan-glow shadow-[0_0_18px_5px_rgba(79,216,208,0.55)]"
          style={{ zIndex: 32, display: 'none' }}
        />

        {/* orbiting workflow nodes */}
        {NODES.map((n, i) => {
          const isTrigger = n.id === hero.run.trigger
          const hot = selected?.id === n.id || activeId === n.id
          return (
            <button
              key={n.id}
              ref={(el) => (nodeRefs.current[i] = el)}
              type="button"
              onPointerEnter={() => setSelected(n)}
              onClick={() => (isTrigger ? startRun() : setSelected(selected?.id === n.id ? null : n))}
              className={`absolute left-1/2 top-1/2 flex items-center gap-2 rounded-lg glass border px-2.5 py-2 text-left transition-[opacity,border-color,box-shadow] duration-300 hover:!opacity-100 ${
                hot
                  ? 'border-cyan-glow/70 shadow-[0_0_18px_-4px_rgba(79,216,208,0.7)]'
                  : 'border-white/12'
              }`}
              style={{ willChange: 'transform' }}
            >
              {isTrigger && !hasRun && (
                <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-gradient-to-br from-pulse-500 to-pulse-600 text-[7px] text-white animate-pulse-soft">
                  ▶
                </span>
              )}
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-pulse-500/15 text-pulse-300">
                <NodeIcon name={n.icon} />
              </span>
              <span>
                <span className="block text-[11.5px] font-semibold leading-tight text-white whitespace-nowrap">
                  {n.label}
                </span>
                <span lang="ja" className="block font-mono text-[9.5px] text-mist-500">{n.ja}</span>
              </span>
            </button>
          )
        })}

        {/* info / run-caption panel */}
        <div
          className="absolute left-3 top-3 max-w-[250px] rounded-xl glass-strong px-3.5 py-3 pointer-events-none"
          style={{ zIndex: 35 }}
        >
          {isRunning ? (
            <>
              <p className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-beni-400">
                <span className="h-1.5 w-1.5 rounded-full bg-beni-400 animate-pulse-soft" />
                Live run
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-white">{runCaption}</p>
            </>
          ) : info ? (
            <>
              <p className="text-[12px] font-bold text-cyan-glow">
                {info.label}
                {info.ja && (
                  <span lang="ja" className="ml-2 font-mono text-[10px] font-medium text-mist-500">
                    {info.ja}
                  </span>
                )}
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-mist-300">{info.desc}</p>
            </>
          ) : (
            <p className="font-mono text-[10.5px] leading-relaxed text-mist-400">{hero.run.hint}</p>
          )}
        </div>

        {/* drag hint */}
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
        <span className="truncate">in: gmail · docs · video · 店舗運営</span>
        <span className="hidden sm:inline">out: actions · logs · drafts</span>
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
      style={{ width: w, height: h, transform, background: bg, opacity, backfaceVisibility: 'hidden' }}
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
      <Cuboid w={184} h={12} d={18} y={-64} />
      <Cuboid w={158} h={8} d={14} y={-53} />
      <Cuboid w={148} h={8} d={11} y={-24} />
      <Cuboid w={9} h={21} d={8} y={-38} />
      <Cuboid w={12} h={96} d={12} x={-56} y={4} />
      <Cuboid w={12} h={96} d={12} x={56} y={4} />
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
        style={{ width: 250, height: 250, transform: 'translate(-50%,-50%) translateY(54px) rotateX(90deg)' }}
      />
    </>
  )
}

/* ---------- tiny stroke icon set ---------- */

function NodeIcon({ name }) {
  const common = {
    width: 13,
    height: 13,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  switch (name) {
    case 'mail':
      return (
        <svg {...common}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-10 6L2 7" />
        </svg>
      )
    case 'docs':
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
        </svg>
      )
    case 'table':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="12" y1="3" x2="12" y2="21" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    case 'user':
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <polyline points="16 11 18 13 22 9" />
        </svg>
      )
    case 'gauge':
      return (
        <svg {...common}>
          <path d="M12 15l3.5-3.5" />
          <path d="M20.3 18a9 9 0 1 0-16.6 0" />
        </svg>
      )
    default:
      return null
  }
}

function RotateIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85 1 6.57 2.57L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  )
}
