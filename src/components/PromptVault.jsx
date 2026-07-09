import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { prompts, vaultConfig } from '../config/prompts'
import { profile } from '../config/content'
import SectionHeading from './SectionHeading'
import { fadeUp, stagger, viewportOnce } from '../lib/anim'

/**
 * PROMPT VAULT — a self-contained library page at #/vault.
 *
 * Everything content-related lives in src/config/prompts.js.
 * This file only handles display: cards, filters, search, the
 * detail modal, copy-to-clipboard, and the premium lock.
 *
 * Beginner map of this file:
 *   PromptVault  – the whole page (header → featured → filters → grid → email box)
 *   FeaturedCard – the big spotlight card at the top
 *   PromptCard   – one card in the grid
 *   PromptModal  – the popup with full prompt + copy button
 *   ToolBadge / Tag / PriceLabel – small labels reused everywhere
 */

// badge colors per AI tool — add a line here if you add a new tool name
const TOOL_STYLES = {
  Claude: 'bg-beni-500/15 text-beni-400 border-beni-500/30',
  ChatGPT: 'bg-cyan-glow/12 text-cyan-glow border-cyan-glow/30',
  Gemini: 'bg-pulse-500/15 text-pulse-300 border-pulse-500/30',
  Other: 'bg-white/8 text-mist-300 border-white/15',
}

const isConfigPlaceholder = (url) => !url || url.includes('YOUR-')

/* ---------- small reusable labels ---------- */

function ToolBadge({ tool }) {
  return (
    <span className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold ${TOOL_STYLES[tool] || TOOL_STYLES.Other}`}>
      {tool}
    </span>
  )
}

function Tag({ children }) {
  return (
    <span className="rounded-md border border-white/10 bg-ink-950/60 px-2 py-0.5 font-mono text-[10px] text-mist-400">
      {children}
    </span>
  )
}

function PriceLabel({ isPremium }) {
  return isPremium ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-pulse-500 to-pulse-600 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
      <LockIcon /> PREMIUM
    </span>
  ) : (
    <span className="rounded-md border border-cyan-glow/40 bg-cyan-glow/10 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-glow">
      FREE
    </span>
  )
}

function PopularBadge({ copies }) {
  // "popular" = 100+ copies. Purely cosmetic for now — update counts by hand.
  if (copies < 100) return null
  return (
    <span className="rounded-md border border-beni-500/30 bg-beni-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-beni-400">
      ★ POPULAR
    </span>
  )
}

/* ---------- copy-to-clipboard hook with "Copied!" feedback ---------- */

function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // fallback for older browsers / blocked clipboard
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return { copied, copy }
}

/* ---------- the big spotlight card at the top ---------- */

function FeaturedCard({ prompt, onOpen }) {
  if (!prompt) return null
  return (
    <motion.button
      type="button"
      onClick={() => onOpen(prompt)}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.7 }}
      className="group mb-12 w-full rounded-2xl glass-strong ring-glow p-7 md:p-9 text-left hover:border-pulse-400/40 transition-colors"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-gradient-to-r from-pulse-500 to-cyan-glow px-3 py-1 font-mono text-[10px] font-bold text-white tracking-wider">
          ✦ FEATURED
        </span>
        <ToolBadge tool={prompt.tool} />
        <Tag>{prompt.category}</Tag>
        <PriceLabel isPremium={prompt.isPremium} />
        <PopularBadge copies={prompt.copies} />
      </div>
      <h2 className="mt-4 text-2xl md:text-[1.8rem] font-bold text-white">
        {prompt.title}
        <span lang="ja" className="ml-3 text-[14px] font-medium text-mist-400">{prompt.titleJa}</span>
      </h2>
      <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-mist-300">{prompt.description}</p>
      <p className="mt-4 font-mono text-[12px] text-pulse-300 group-hover:text-cyan-glow transition-colors">
        Open prompt →
      </p>
    </motion.button>
  )
}

/* ---------- one card in the grid ---------- */

function PromptCard({ prompt, onOpen, i }) {
  return (
    <motion.button
      type="button"
      onClick={() => onOpen(prompt)}
      variants={fadeUp}
      custom={i % 6}
      whileHover={{ y: -5, transition: { duration: 0.25 } }}
      className="flex h-full flex-col rounded-2xl glass p-5 text-left hover:border-white/20 transition-colors"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <ToolBadge tool={prompt.tool} />
        <Tag>{prompt.category}</Tag>
        <span className="ml-auto" />
        <PriceLabel isPremium={prompt.isPremium} />
      </div>
      <h3 className="mt-3.5 text-[16px] font-bold leading-snug text-white">{prompt.title}</h3>
      <p lang="ja" className="mt-0.5 text-[11.5px] text-mist-500">{prompt.titleJa}</p>
      <p className="mt-2 grow text-[12.5px] leading-relaxed text-mist-400">{prompt.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="font-mono text-[10.5px] text-mist-500">
          <CopyIconSmall /> {prompt.copies} copies
        </span>
        <PopularBadge copies={prompt.copies} />
      </div>
    </motion.button>
  )
}

/* ---------- detail modal: full prompt, copy button, premium lock ---------- */

function PromptModal({ prompt, onClose }) {
  const { copied, copy } = useCopy()
  const paymentReady = !isConfigPlaceholder(vaultConfig.paymentUrl)

  // close on the Escape key
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!prompt) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-ink-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative my-8 w-full max-w-2xl rounded-2xl glass-strong p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg glass text-mist-400 hover:text-white transition-colors"
        >
          ✕
        </button>

        <div className="flex flex-wrap items-center gap-2 pr-10">
          <ToolBadge tool={prompt.tool} />
          <Tag>{prompt.category}</Tag>
          <PriceLabel isPremium={prompt.isPremium} />
          <PopularBadge copies={prompt.copies} />
        </div>
        <h2 className="mt-3 text-xl md:text-2xl font-bold text-white">{prompt.title}</h2>
        <p lang="ja" className="mt-0.5 text-[12.5px] text-mist-400">{prompt.titleJa}</p>
        <p className="mt-3 text-[13.5px] leading-relaxed text-mist-300">{prompt.description}</p>

        {/* ---- the prompt text ---- */}
        {prompt.isPremium ? (
          /* PREMIUM: teaser + blurred filler + unlock button.
             NOTE: the real full text should NOT be in prompts.js until you
             add true access control — deliver it via your payment platform. */
          <div className="relative mt-5 overflow-hidden rounded-xl border border-white/10 bg-ink-950/80">
            <pre lang="ja" className="whitespace-pre-wrap p-4 font-mono text-[12px] leading-relaxed text-mist-300">
              {prompt.previewText}
            </pre>
            <div aria-hidden className="select-none px-4 pb-4 blur-[6px]">
              <p className="font-mono text-[12px] leading-relaxed text-mist-400">
                Phase 3 — Deep-dive questions based on your answers, escalating difficulty…{'\n'}
                Phase 4 — Scoring rubric applied to each answer with concrete rewrites…{'\n'}
                Phase 5 — Final report: strengths, risks, and your three improvement priorities…
              </p>
            </div>
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2.5 bg-gradient-to-t from-ink-950 via-ink-950/90 to-transparent px-4 pb-5 pt-14">
              {paymentReady ? (
                <a
                  href={vaultConfig.paymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pulse-500 to-pulse-600 px-6 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(61,118,232,0.7)] hover:scale-[1.03] transition-transform"
                >
                  <LockIcon /> Unlock full prompt
                </a>
              ) : (
                <span lang="ja" className="inline-flex items-center gap-2 rounded-full border border-dashed border-white/20 px-6 py-2.5 font-mono text-[11.5px] text-mist-400">
                  <LockIcon /> Premium unlock — 近日公開 · coming soon
                </span>
              )}
              <p className="font-mono text-[10px] text-mist-500">one-time purchase · instant access</p>
            </div>
          </div>
        ) : (
          /* FREE: full text + copy button */
          <div className="relative mt-5 rounded-xl border border-white/10 bg-ink-950/80">
            <button
              type="button"
              onClick={() => copy(prompt.promptText)}
              className={`absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-semibold transition-all ${
                copied
                  ? 'bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/40'
                  : 'glass text-mist-300 hover:text-white hover:border-white/25'
              }`}
            >
              {copied ? '✓ Copied!' : (
                <>
                  <CopyIconSmall /> Copy Prompt
                </>
              )}
            </button>
            <pre lang="ja" className="max-h-[320px] overflow-y-auto whitespace-pre-wrap p-4 pr-28 font-mono text-[12px] leading-relaxed text-mist-200">
              {prompt.promptText}
            </pre>
          </div>
        )}

        {/* ---- how to use ---- */}
        <div className="mt-4 rounded-xl border-l-2 border-pulse-500/50 bg-white/[0.03] px-4 py-3">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-mist-500">How to use · 使い方</p>
          <p lang="ja" className="mt-1 text-[12.5px] leading-relaxed text-mist-300">{prompt.instructions}</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ---------- email capture: "get new prompts weekly" ---------- */

function EmailCapture() {
  const [state, setState] = useState('idle') // idle | soon | done
  const ready = !isConfigPlaceholder(vaultConfig.newsletterUrl)

  const onSubmit = (e) => {
    if (!ready) {
      e.preventDefault()
      setState('soon')
      return
    }
    setState('done') // real form posts to your newsletter service
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.7 }}
      className="mt-16 rounded-2xl glass-strong p-7 md:p-9 text-center"
    >
      <h3 className="text-lg font-bold text-white">
        Get new prompts weekly <span lang="ja" className="ml-2 text-[13px] font-medium text-mist-400">毎週新作プロンプトをお届け</span>
      </h3>
      <p className="mx-auto mt-2 max-w-md text-[13px] text-mist-400">
        One email a week: a new bilingual prompt, tested and explained. No spam.
      </p>
      <form
        action={ready ? vaultConfig.newsletterUrl : undefined}
        method="post"
        target="_blank"
        onSubmit={onSubmit}
        className="mx-auto mt-5 flex max-w-md gap-2.5"
      >
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-full border border-white/12 bg-ink-950/60 px-5 py-2.5 text-[13.5px] text-white placeholder:text-mist-500 focus:border-pulse-400/60 focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-gradient-to-r from-pulse-500 to-pulse-600 px-5 py-2.5 text-[13px] font-semibold text-white hover:scale-[1.03] transition-transform"
        >
          Subscribe
        </button>
      </form>
      {state === 'soon' && (
        <p lang="ja" className="mt-3 font-mono text-[11px] text-cyan-glow">
          Newsletter launching soon — 準備中です。もう少々お待ちください！
        </p>
      )}
      {state === 'done' && (
        <p className="mt-3 font-mono text-[11px] text-cyan-glow">✓ Check your inbox to confirm.</p>
      )}
    </motion.div>
  )
}

/* ---------- the page ---------- */

export default function PromptVault() {
  const [tool, setTool] = useState('All')
  const [category, setCategory] = useState('All')
  const [price, setPrice] = useState('All') // All | Free | Premium
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(null) // the prompt shown in the modal

  // browser tab title while on this page
  useEffect(() => {
    const prev = document.title
    document.title = `Prompt Vault — ${profile.name}`
    return () => (document.title = prev)
  }, [])

  // filter options are derived from the data — new categories/tools
  // in prompts.js appear here automatically
  const tools = useMemo(() => ['All', ...new Set(prompts.map((p) => p.tool))], [])
  const categories = useMemo(() => ['All', ...new Set(prompts.map((p) => p.category))], [])

  // apply filters + live search (matches EN + JP text)
  const visible = prompts.filter((p) => {
    if (tool !== 'All' && p.tool !== tool) return false
    if (category !== 'All' && p.category !== category) return false
    if (price === 'Free' && p.isPremium) return false
    if (price === 'Premium' && !p.isPremium) return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    return [p.title, p.titleJa, p.description, p.category, p.tool]
      .join(' ')
      .toLowerCase()
      .includes(q)
  })

  const featured = prompts.find((p) => p.id === vaultConfig.featuredId)

  return (
    <div className="relative">
      {/* slim top bar: back to the portfolio */}
      <header className="fixed inset-x-0 top-0 z-50 glass-strong">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 md:px-8">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-pulse-500 to-cyan-glow text-[12px] font-bold text-white">
              {profile.initials}
            </span>
            <span className="text-[14px] font-semibold text-white">{profile.name}</span>
          </a>
          <a href="#top" className="font-mono text-[12px] text-mist-400 hover:text-white transition-colors">
            ← Back to portfolio
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 md:px-8 pt-28 pb-20">
        <SectionHeading
          kicker="Prompt Vault"
          kickerJa="プロンプト保管庫"
          title="Tested AI prompts for study, work, and job hunting in Japan"
          lead="Every prompt here is one I actually use — written bilingually, with instructions. Free ones are yours to copy right now."
        />

        {/* featured spotlight */}
        <FeaturedCard prompt={featured} onOpen={setOpen} />

        {/* filter bar: search + three pill groups */}
        <div className="mb-8 flex flex-col gap-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search prompts… （日本語でも検索できます）"
            className="w-full rounded-full border border-white/12 bg-ink-950/60 px-5 py-3 text-[14px] text-white placeholder:text-mist-500 focus:border-pulse-400/60 focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <FilterGroup label="Tool" options={tools} value={tool} onChange={setTool} />
            <FilterGroup label="Category" options={categories} value={category} onChange={setCategory} />
            <FilterGroup label="Price" options={['All', 'Free', 'Premium']} value={price} onChange={setPrice} />
          </div>
        </div>

        {/* the card grid */}
        {visible.length === 0 ? (
          <p className="py-16 text-center font-mono text-[13px] text-mist-500">
            No prompts match — try clearing a filter. ／ 該当なし
          </p>
        ) : (
          <motion.div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            {visible.map((p, i) => (
              <PromptCard key={p.id} prompt={p} onOpen={setOpen} i={i} />
            ))}
          </motion.div>
        )}

        <EmailCapture />
      </main>

      {/* detail modal */}
      <AnimatePresence>
        {open && <PromptModal prompt={open} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </div>
  )
}

/* ---------- one row of filter pills ---------- */

function FilterGroup({ label, options, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist-500">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
              value === opt
                ? 'bg-gradient-to-r from-pulse-500 to-pulse-600 text-white'
                : 'glass text-mist-400 hover:text-white'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------- tiny icons ---------- */

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function CopyIconSmall() {
  return (
    <svg className="inline -mt-0.5" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}
