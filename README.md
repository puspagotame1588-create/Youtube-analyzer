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
    content.js                 # ★ ALL text, links, projects, metrics — the ONLY file you edit
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

## 3. Edit content (one file controls the whole site)

**Every word, link, and number on the site lives in `src/config/content.js`.**
Components contain no text — they only render what's in that file.

Shared facts are defined once in the `profile` object at the top and ripple everywhere:

- Change `profile.certs.toeic` → hero badge, subheadline, skills list, fact sheet, and Japan-fit section all update.
- Edit a project in `projects` → its card, the hero command-center module, and (for the first project) the case-study title all update.
- Edit `nav` → navbar and footer navigation both update.

Quick placeholder checklist:

| What | Where in `content.js` | How |
| --- | --- | --- |
| Portfolio video | `profile.videoEmbedUrl` | Upload to YouTube (unlisted is fine) → use `https://www.youtube.com/embed/VIDEO_ID` |
| Resume PDF | `public/resume/Puspa_Gotame_Resume.pdf` (file, not config) | Overwrite the placeholder PDF (same filename) |
| GitHub / LinkedIn / Email | `profile.github` / `profile.linkedin` / `profile.email` | Your real URLs |
| Project demo/GitHub links | `demo` / `github` inside each entry of `projects` | Replace each `'#'` |
| Metrics | `metrics` inside each project + `caseStudy.metrics` | Replace targets with measured results as projects mature |
| Roadmap progress | `roadmap.months[].status` | Move `'now'` forward: `'done'` / `'now'` / `'next'` |
| Screenshots | `proof.screens` + files in `public/screenshots/` | Drop PNG/JPGs in the folder, set `src: '/screenshots/your-file.png'` |
| 3D workflow nodes | `hero.nodes` | Edit each node's `label`, `ja`, and `desc` (shown on hover/tap) |
| Live run animation | `hero.run` | Steps, captions, and timings of the tap-Gmail workflow run |
| Impact counters | `impact.stats` | ★ Keep these numbers honest — update as your work grows |
| Ops ticker messages | `ops` | The cycling activity messages in the navbar |
| Case-study fields | `problem` / `solution` / `result` / `learned` per project | Keep them honest — recruiters ask about these in interviews |

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
