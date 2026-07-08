import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { demo } from '../config/content'

/**
 * Interactive mini-demo: recruiter clicks "Run AI Workflow" and watches a
 * sample email travel through the automation pipeline, with a live log.
 * Stages and sample emails live in config/content.js (demo.stages /
 * demo.samples). Pure front-end simulation — no API calls.
 */

const STAGES = demo.stages
const SAMPLES = demo.samples

const STEP_MS = 1100

export default function WorkflowDemo() {
  const [sampleIdx, setSampleIdx] = useState(0)
  const [step, setStep] = useState(-1) // -1 idle; 0..5 running; 6 done
  const timer = useRef(null)
  const running = step >= 0 && step < STAGES.length
  const done = step >= STAGES.length
  const sample = SAMPLES[sampleIdx]

  useEffect(() => () => clearTimeout(timer.current), [])

  useEffect(() => {
    if (step >= 0 && step < STAGES.length) {
      timer.current = setTimeout(() => setStep((s) => s + 1), STEP_MS)
      return () => clearTimeout(timer.current)
    }
  }, [step])

  const run = () => {
    if (running) return
    setStep(0)
  }

  const pickTab = (i) => {
    if (running || i === sampleIdx) return
    setSampleIdx(i)
    setStep(-1)
  }

  return (
    <div className="rounded-2xl glass-strong overflow-hidden">
      {/* chrome */}
      <div className="flex flex-wrap items-center gap-3 border-b border-white/8 px-5 py-3">
        <span className="font-mono text-[11px] text-mist-400">try-my-ai — upload simulator</span>
        <span lang="ja" className="font-mono text-[10.5px] text-mist-500">アップロード体験デモ</span>
        <button
          onClick={run}
          disabled={running}
          className={`ml-auto inline-flex items-center gap-2 rounded-full px-5 py-2 text-[13px] font-semibold transition-all ${
            running
              ? 'bg-white/8 text-mist-400 cursor-wait'
              : 'bg-gradient-to-r from-pulse-500 to-pulse-600 text-white shadow-[0_6px_20px_-6px_rgba(61,118,232,0.7)] hover:scale-[1.03] active:scale-[0.97]'
          }`}
        >
          {running ? (
            <>
              <Spinner /> Processing…
            </>
          ) : done ? (
            '▶ Run again'
          ) : (
            '▶ Run AI Workflow'
          )}
        </button>
      </div>

      <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
        {/* left: input + pipeline */}
        <div className="border-b lg:border-b-0 lg:border-r border-white/8 p-5">
          {/* input type tabs */}
          <div className="mb-4 flex rounded-full glass p-1">
            {SAMPLES.map((smp, i) => (
              <button
                key={smp.type}
                onClick={() => pickTab(i)}
                disabled={running}
                className={`relative flex-1 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                  sampleIdx === i ? 'text-white' : 'text-mist-400 hover:text-mist-100'
                } ${running ? 'cursor-wait' : ''}`}
              >
                {sampleIdx === i && (
                  <motion.span
                    layoutId="demo-tab"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-pulse-500 to-pulse-600"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative">
                  {smp.tab} <span lang="ja" className="text-[10px] opacity-70">{smp.tabJa}</span>
                </span>
              </button>
            ))}
          </div>

          {/* sample input */}
          <motion.div
            key={sampleIdx}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            className={`relative rounded-xl border border-dashed px-4 py-3 transition-colors ${
              step >= 0 ? 'border-pulse-500/50 bg-pulse-500/8' : 'border-white/15 bg-ink-950/50'
            }`}
          >
            <span className="absolute -top-2 right-3 rounded-full bg-ink-900 border border-white/10 px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-wider text-mist-500">
              simulated upload
            </span>
            <p className="font-mono text-[10.5px] text-mist-500">source: {sample.source}</p>
            <p lang="ja" className="mt-1 text-[13.5px] font-semibold text-white">{sample.subject}</p>
            <p lang="ja" className="mt-0.5 truncate text-[12px] text-mist-400">{sample.preview}</p>
          </motion.div>

          {/* pipeline stages */}
          <ol className="mt-5 space-y-0.5">
            {STAGES.map((s, i) => {
              const state = step > i ? 'done' : step === i ? 'active' : 'idle'
              return (
                <li key={s.id} className="flex items-stretch gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border font-mono text-[10px] transition-all duration-300 ${
                        state === 'done'
                          ? 'border-cyan-glow/60 bg-cyan-glow/15 text-cyan-glow'
                          : state === 'active'
                            ? 'border-pulse-400 bg-pulse-500/25 text-white shadow-[0_0_14px_-2px_rgba(94,150,245,0.8)]'
                            : 'border-white/12 text-mist-500'
                      }`}
                    >
                      {state === 'done' ? '✓' : i + 1}
                    </span>
                    {i < STAGES.length - 1 && (
                      <span className={`w-px grow min-h-3 transition-colors duration-300 ${step > i ? 'bg-cyan-glow/50' : 'bg-white/10'}`} />
                    )}
                  </div>
                  <div className="pb-3 pt-1">
                    <p className={`text-[13px] font-medium leading-none transition-colors ${state === 'idle' ? 'text-mist-500' : 'text-white'}`}>
                      {s.label}
                      <span lang="ja" className="ml-2 font-mono text-[10px] text-mist-500">{s.ja}</span>
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        {/* right: live log + outcome */}
        <div className="flex flex-col p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist-500">Agent log</p>
          <div className="mt-3 grow rounded-xl bg-ink-950/70 border border-white/6 p-4 font-mono text-[12px] leading-[1.9] min-h-[220px]">
            {step < 0 ? (
              <p className="text-mist-500">Choose an input type, then press “Run AI Workflow”…</p>
            ) : (
              sample.log.slice(0, Math.min(step + 1, sample.log.length)).map((line, i) => (
                <motion.p
                  key={`${sampleIdx}-${i}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={
                    line.startsWith('✓')
                      ? 'text-cyan-glow/90'
                      : line.startsWith('⏸')
                        ? 'text-beni-400'
                        : 'text-mist-300'
                  }
                >
                  {line}
                </motion.p>
              ))
            )}
          </div>

          <AnimatePresence>
            {done && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 grid grid-cols-3 gap-2.5"
              >
                <Outcome label="Priority" value={sample.result.priority} />
                <Outcome label="Automated" value={sample.result.action} />
                <Outcome label="Human decision" value={sample.result.decision} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function Outcome({ label, value }) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2.5">
      <p className="font-mono text-[9.5px] uppercase tracking-wider text-mist-500">{label}</p>
      <p className="mt-1 text-[11.5px] font-semibold leading-snug text-white">{value}</p>
    </div>
  )
}

function Spinner() {
  return (
    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-mist-400 border-t-transparent" />
  )
}
