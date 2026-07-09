import { nav as NAV, profile, footer, isPlaceholderLink } from '../config/content'

export default function Footer() {
  return (
    <footer className="hairline-top mt-8">
      <div className="mx-auto max-w-6xl px-5 md:px-8 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-pulse-500 to-cyan-glow text-[13px] font-bold text-white">
                {profile.initials}
              </span>
              <div>
                <p className="text-[15px] font-bold text-white">{profile.name}</p>
                <p className="text-[12px] text-mist-400">
                  {profile.roleTarget} <span lang="ja">／ {profile.roleTargetJa}</span>
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-[12.5px] leading-relaxed text-mist-500">
              {footer.tagline}
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
                <a href={`mailto:${profile.email}`} className="text-mist-300 hover:text-white transition-colors break-all">
                  {profile.email}
                </a>
              </li>
              <li>
                <a href={profile.github} target="_blank" rel="noreferrer" className="text-mist-300 hover:text-white transition-colors">
                  GitHub
                </a>
              </li>
              {!isPlaceholderLink(profile.linkedin) && (
                <li>
                  <a href={profile.linkedin} target="_blank" rel="noreferrer" className="text-mist-300 hover:text-white transition-colors">
                    LinkedIn
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="hairline-top mt-10 pt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <p className="text-[12px] text-mist-500">
            © {new Date().getFullYear()} {profile.name}. All rights reserved.
          </p>
          <p className="font-mono text-[11px] text-mist-500">
            {profile.location} <span lang="ja">・{profile.locationJa}</span> · {footer.credits}
          </p>
        </div>
      </div>
    </footer>
  )
}
