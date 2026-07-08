import { motion } from 'framer-motion'
import { recruiter, profile } from '../config/content'
import SectionHeading from './SectionHeading'
import { fadeUp, stagger, viewportOnce } from '../lib/anim'

const STATUS = recruiter.status

export default function RecruiterProof() {
  return (
    <section id="contact" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <SectionHeading
          kicker="For Recruiters"
          kickerJa="採用ご担当者様へ"
          title={recruiter.title}
          lead={recruiter.lead}
        />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={stagger}
          className="rounded-3xl glass-strong ring-glow p-7 md:p-10"
        >
          {/* status flags */}
          <motion.ul variants={fadeUp} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            {STATUS.map((s) => (
              <li
                key={s.text}
                className="inline-flex items-center gap-2.5 rounded-full border border-cyan-glow/25 bg-cyan-glow/8 px-4 py-2 text-[12.5px] font-semibold text-white"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-glow animate-pulse-soft" />
                {s.text}
                <span lang="ja" className="text-[10.5px] font-medium text-mist-400">{s.ja}</span>
              </li>
            ))}
          </motion.ul>

          {/* action grid */}
          <motion.div variants={fadeUp} custom={1} className="mt-8 grid gap-3.5 sm:grid-cols-2">
            <a
              href={profile.resumeUrl}
              download
              className="group flex items-center gap-4 rounded-2xl bg-gradient-to-r from-pulse-500 to-pulse-600 px-6 py-5 shadow-[0_10px_32px_-10px_rgba(61,118,232,0.7)] transition-transform hover:scale-[1.02]"
            >
              <IconWrap><DocIcon /></IconWrap>
              <div>
                <p className="text-[15px] font-bold text-white">Download Resume</p>
                <p className="text-[12px] text-white/70">{recruiter.resumeNote}</p>
              </div>
              <Arrow />
            </a>
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-4 rounded-2xl glass px-6 py-5 hover:border-white/25 transition-colors"
            >
              <IconWrap><GitHubIcon /></IconWrap>
              <div>
                <p className="text-[15px] font-bold text-white">GitHub</p>
                <p className="text-[12px] text-mist-400">{recruiter.githubNote}</p>
              </div>
              <Arrow />
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-4 rounded-2xl glass px-6 py-5 hover:border-white/25 transition-colors"
            >
              <IconWrap><LinkedInIcon /></IconWrap>
              <div>
                <p className="text-[15px] font-bold text-white">LinkedIn</p>
                <p className="text-[12px] text-mist-400">{recruiter.linkedinNote}</p>
              </div>
              <Arrow />
            </a>
            <a
              href={`mailto:${profile.email}`}
              className="group flex items-center gap-4 rounded-2xl glass px-6 py-5 hover:border-white/25 transition-colors"
            >
              <IconWrap><MailIcon /></IconWrap>
              <div>
                <p className="text-[15px] font-bold text-white">Email Me</p>
                <p className="text-[12px] text-mist-400 break-all">{profile.email}</p>
              </div>
              <Arrow />
            </a>
          </motion.div>

          <motion.p
            variants={fadeUp}
            custom={2}
            lang="ja"
            className="mt-8 text-center text-[13px] leading-relaxed text-mist-400"
          >
            {recruiter.closingJa}
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}

function IconWrap({ children }) {
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 border border-white/15 text-white">
      {children}
    </span>
  )
}

function Arrow() {
  return (
    <span className="ml-auto text-mist-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-white">
      →
    </span>
  )
}

function DocIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.78 1.05.78 2.12v3.14c0 .3.2.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  )
}
