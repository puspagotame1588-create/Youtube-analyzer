# Puspa Gotame — AI/DX Portfolio

A premium one-page job-hunting portfolio for AI/DX consulting, AI solutions, and AI product roles in Japan.

**Stack:** React 19 · Vite · Tailwind CSS v4 · Framer Motion (CSS 3D — no WebGL, fast on mobile)

---

## 1. Run it locally

```bash
npm install
npm run dev        #開発サーバー → http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview the production build
```

## 2. Folder structure

```
public/
  favicon.svg                  # browser tab icon (PG mark)
  resume/
    Puspa_Gotame_Resume.pdf    # ← REPLACE with your real resume (keep the same filename)
src/
  config/
    site.js                    # ★ ALL personal links & video URL — edit this first
  lib/anim.js                  # shared animation variants + count-up hook
  components/
    Background.jsx             # Tokyo grid + data-stream ambient layer
    Navbar.jsx / Footer.jsx
    Hero.jsx / CommandCenter.jsx   # headline, CTAs, 3D operations visual
    VideoSection.jsx           # portfolio video + summary
    Projects.jsx               # 3 case-study cards (tilt, counters)
    CaseStudy.jsx / WorkflowDemo.jsx  # flagship deep-dive + "Run AI Workflow" demo
    BeforeAfter.jsx            # manual vs AI-assisted comparison
    Skills.jsx / About.jsx / Roadmap.jsx / JapanFit.jsx / RecruiterProof.jsx
  App.jsx                      # section order
  index.css                    # design tokens (colors, fonts, effects)
```

## 3. Replace placeholders (15 minutes)

Everything personal lives in **`src/config/site.js`**:

| What | Where | How |
| --- | --- | --- |
| Portfolio video | `site.videoEmbedUrl` | Upload to YouTube (unlisted is fine) → use `https://www.youtube.com/embed/VIDEO_ID` |
| Resume PDF | `public/resume/Puspa_Gotame_Resume.pdf` | Overwrite the placeholder file with your real PDF (same filename) |
| GitHub | `site.github` | Your profile URL |
| LinkedIn | `site.linkedin` | Your profile URL |
| Email | `site.email` | Already set — change if needed |
| Project demo/GitHub links | `site.projects.*` | Replace each `'#'` with a repo or demo/Loom link |

Text content (project descriptions, About paragraphs, metrics) lives at the top of each
component in plain arrays/objects — open the component and edit the strings.
**Update the metric numbers to your real measured results as your projects mature.**

## 4. Deploy to Vercel (free)

1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Vercel auto-detects Vite. Keep defaults (`npm run build`, output `dist`). Click **Deploy**.
4. Optional: add a custom domain (e.g. `puspagotame.com`) under **Settings → Domains**.

Every `git push` redeploys automatically.

## 5. Checklist before sending to recruiters

- [ ] Real resume PDF in `public/resume/` (open the deployed link and check it downloads)
- [ ] Portfolio video recorded (2–3 min, JP+EN) and `videoEmbedUrl` set
- [ ] LinkedIn URL replaced and profile up to date (photo, education, JLPT/TOEIC)
- [ ] GitHub profile link correct; email-agent repo public with a good README
- [ ] All 6 project demo/GitHub `'#'` links replaced (or the buttons will go nowhere)
- [ ] Metric placeholders replaced with your honest measured numbers
- [ ] Click every nav link and button on the deployed site — desktop **and** phone
- [ ] Ask one Japanese friend to read the 日本語 sections aloud — fix anything unnatural
- [ ] Add the site URL to your resume, LinkedIn, and 履歴書/エントリーシート
