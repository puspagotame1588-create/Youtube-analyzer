import site from '../config/site'

const NAV = [
  { href: '#video', label: 'Video' },
  { href: '#projects', label: 'Projects' },
  { href: '#case-study', label: 'Case Study' },
  { href: '#skills', label: 'Skills' },
  { href: '#about', label: 'About' },
  { href: '#roadmap', label: 'Roadmap' },
  { href: '#contact', label: 'Contact' },
]

export default function Footer() {
  return (
    <footer className="hairline-top mt-8">
      <div className="mx-auto max-w-6xl px-5 md:px-8 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-pulse-500 to-cyan-glow text-[13px] font-bold text-white">
                PG
              </span>
              <div>
                <p className="text-[15px] font-bold text-white">{site.name}</p>
                <p className="text-[12px] text-mist-400">
                  {site.roleTarget} <span lang="ja">／ AI・DXコンサルタント志望</span>
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-[12.5px] leading-relaxed text-mist-500">
              Building practical AI automation from real workplace problems — targeting AI/DX
              consulting and AI product roles in Japan.
            </p>
          </div>

          <nav aria-label="Footer">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-mist-500">Navigate</p>
            <ul className="mt-3 grid grid-cols-2 gap-x-10 gap-y-2 text-[13px] text-mist-300">
              {NAV.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-mist-500">Contact</p>
            <ul className="mt-3 space-y-2 text-[13px]">
              <li>
                <a href={`mailto:${site.email}`} className="text-mist-300 hover:text-white transition-colors break-all">
                  {site.email}
                </a>
              </li>
              <li>
                <a href={site.github} target="_blank" rel="noreferrer" className="text-mist-300 hover:text-white transition-colors">
                  GitHub
                </a>
              </li>
              <li>
                <a href={site.linkedin} target="_blank" rel="noreferrer" className="text-mist-300 hover:text-white transition-colors">
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="hairline-top mt-10 pt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <p className="text-[12px] text-mist-500">
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <p className="font-mono text-[11px] text-mist-500">
            Tokyo, Japan <span lang="ja">・東京</span> · Built with React + Tailwind + Framer Motion
          </p>
        </div>
      </div>
    </footer>
  )
}
