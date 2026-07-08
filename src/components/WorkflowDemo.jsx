import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Interactive mini-demo: recruiter clicks "Run AI Workflow" and watches a
 * sample email travel through the automation pipeline, with a live log.
 * Pure front-end simulation — no API calls.
 */

const STAGES = [
  { id: 'inbox', label: 'Email received', ja: '受信' },
  { id: 'classify', label: 'AI classification', ja: '優先度判定' },
  { id: 'extract', label: 'Deadline extraction', ja: '期限抽出' },
  { id: 'log', label: 'Sheets + Calendar', ja: '記録・登録' },
  { id: 'draft', label: 'Draft reply', ja: '返信案作成' },
  { id: 'review', label: 'Human review', ja: '人による承認' },
]

const SAMPLES = [
  {
    from: 'prof.tanaka@teikyo-u.ac.jp',
    subject: '【重要】期末レポート提出について',
    preview: 'レポートは7月18日（金）17:00までに提出してください…',
    log: [
      '→ New email from prof.tanaka@teikyo-u.ac.jp',
      '✓ Priority: HIGH · Category: Academic / Deadline',
      '✓ Deadline found: Jul 18 (Fri) 17:00 JST',
      '✓ Logged to Sheets · Calendar task “期末レポート提出” created',
      '✓ Draft reply (polite JP): 「承知いたしました。期限までに提出いたします。」',
      '⏸ Waiting for human approval… nothing is sent automatically.',
    ],
    result: { priority: 'HIGH', action: 'Calendar task + drafted reply', decision: 'Human approves → sent' },
  },
  {
    from: 'manager@store-shift.jp',
    subject: 'シフト変更のお願い（今週土曜）',
    preview: '今週土曜日のシフトを17時からに変更できますか…',
    log: [
      '→ New email from manager@store-shift.jp',
      '✓ Priority: MEDIUM · Category: Work / Scheduling',
      '✓ Date reference found: Saturday 17:00 (tentative)',
      '✓ Logged to Sheets · Calendar hold created (pending confirm)',
      '✓ Draft reply: availability confirmation in polite Japanese',
      '⏸ Waiting for human approval… you decide, the AI prepares.',
    ],
    result: { priority: 'MEDIUM', action: 'Calendar hold + drafted confirmation', decision: 'Human edits → sent' },
  },
  {
    from: 'newsletter@shopping-mall.com',
    subject: '☆今週のセール情報☆',
    preview: '今だけ全品20%オフ！お見逃しなく…',
    log: [
      '→ New email from newsletter@shopping-mall.com',
      '✓ Priority: LOW · Category: Promotion',
      '– No deadline relevant to the user',
      '✓ Logged to Sheets (archive) · no calendar action',
      '– No reply needed',
      '✓ Auto-archived. Knowing when NOT to act is part of the design.',
    ],
    result: { priority: 'LOW', action: 'Archived, zero noise', decision: 'No human time used' },
  },
]

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
    if (done) setSampleIdx((i) => (i + 1) % SAMPLES.length)
    setStep(0)
  }

  return (
    <div className="rounded-2xl glass-strong overflow-hidden">
      {/* chrome */}
      <div className="flex flex-wrap items-center gap-3 border-b border-white/8 px-5 py-3">
        <span className="font-mono text-[11px] text-mist-400">workflow-simulator</span>
        <span lang="ja" className="font-mono text-[10.5px] text-mist-500">操作できるデモ</span>
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
            '▶ Run next sample'
          ) : (
            '▶ Run AI Workflow'
          )}
        </button>
      </div>

      <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
        {/* left: email + pipeline */}
        <div className="border-b lg:border-b-0 lg:border-r border-white/8 p-5">
          {/* sample email */}
          <motion.div
            key={sampleIdx}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            className={`rounded-xl border px-4 py-3 transition-colors ${
              step >= 0 ? 'border-pulse-500/40 bg-pulse-500/8' : 'border-white/10 bg-ink-950/50'
            }`}
          >
            <p className="font-mono text-[10.5px] text-mist-500">from: {sample.from}</p>
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
              <p className="text-mist-500">Press “Run AI Workflow” to process a sample email…</p>
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
