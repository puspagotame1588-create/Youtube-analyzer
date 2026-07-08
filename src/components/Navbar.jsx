import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { nav as LINKS, profile } from '../config/content'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-strong shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)]' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto max-w-6xl px-5 md:px-8 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5 group">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-pulse-500 to-cyan-glow text-[13px] font-bold text-white shadow-[0_4px_16px_-4px_rgba(61,118,232,0.6)]">
            {profile.initials}
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            {profile.name}
            <span className="ml-2 hidden sm:inline text-[12px] font-medium text-mist-400">
              AI / DX
            </span>
          </span>
        </a>

        <ul className="hidden lg:flex items-center gap-7 text-[13.5px] font-medium text-mist-300">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="hover:text-white transition-colors duration-200">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a
            href={profile.resumeUrl}
            download
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-white text-ink-950 px-4 py-2 text-[13px] font-semibold hover:bg-mist-100 transition-colors"
          >
            <DownloadIcon />
            Resume
          </a>
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen(!open)}
            className="lg:hidden grid h-9 w-9 place-items-center rounded-lg glass"
          >
            <div className="flex flex-col gap-[5px]">
              <span className={`block h-[1.5px] w-4.5 bg-white transition-transform ${open ? 'translate-y-[6.5px] rotate-45' : ''}`} />
              <span className={`block h-[1.5px] w-4.5 bg-white transition-opacity ${open ? 'opacity-0' : ''}`} />
              <span className={`block h-[1.5px] w-4.5 bg-white transition-transform ${open ? '-translate-y-[6.5px] -rotate-45' : ''}`} />
            </div>
          </button>
        </div>
      </nav>

      {open && (
        <div className="lg:hidden glass-strong border-t border-white/5 px-6 py-4">
          <ul className="flex flex-col gap-3 text-[15px] font-medium text-mist-100">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setOpen(false)} className="block py-1.5">
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <a href={profile.resumeUrl} download className="block py-1.5 text-pulse-300">
                Download Resume
              </a>
            </li>
          </ul>
        </div>
      )}
    </motion.header>
  )
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}
