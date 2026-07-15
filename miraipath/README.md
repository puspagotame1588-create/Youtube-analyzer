# MiraiPath Japan — MVP (pilot / demo)

> **Find the route that fits your future.** ／ **自分に合う進路を、根拠とともに。**

MiraiPath Japan is a two-sided education marketplace MVP for Japan:

- **Students** (international students already in Japan, especially language-school students) compare realistic education routes — university vs vocational school — with transparent requirements, costs, deadlines and career trade-offs.
- **Institutions** (universities, junior colleges, vocational schools) reach international students who match their *actual* program conditions, via consent-first introductions and demand insights.

The internal project codename is `careerverse`; the visible brand is **MiraiPath Japan** and is designed to be swappable (see [Rebranding](#rebranding)).

---

## Quick start

```bash
cd miraipath
npm install
npm run dev      # http://localhost:3000
```

Other commands:

```bash
npm run build    # production build
npm start        # serve the production build
npm run lint     # ESLint
npm test         # Vitest (matching engine + form schemas)
```

No environment variables are required. Without Supabase credentials the app runs in **demo mode**: seeded fictional data, localStorage persistence, and a visible demo banner.

## What's inside

| Route | What it is |
|---|---|
| `/` | Homepage with the interactive 3D "Future Route Universe" hero (student ⇄ institution views, live re-scoring controls, 2D fallback) |
| `/route-finder` | 5-step student profile form (Zod + React Hook Form, progressive disclosure) |
| `/results` | Ranked program matches with route-fit score breakdowns, eligibility labels, warnings, sources |
| `/programs/[id]` | Program detail: admission route, requirements, costs, scholarships, careers, evidence |
| `/compare` | Side-by-side comparison (max 3) + "What changes if…" one-variable simulator |
| `/passport` | Future Passport generator (client-side canvas; story/square/wide formats; privacy toggles; share-link loop) |
| `/institutions` | Institution landing page + partner inquiry form |
| `/institutions/dashboard` | Dashboard demo (Recharts) with anonymized candidate table |
| `/methodology` | Trust & methodology: how matching, verification, sponsorship, consent and corrections work |
| `/privacy` | Privacy page with working **export** and **delete** profile controls |
| `/about` | Mission, pilot scope, demo-vs-production list |

## Stack

Next.js 15 (App Router) · TypeScript (strict) · Tailwind CSS v4 · React Three Fiber + Drei (3D hero) · Framer Motion · Recharts · React Hook Form + Zod · Vitest · optional Supabase.

## Architecture

```
miraipath/
├── app/                    # App Router pages (server wrappers export metadata)
├── components/
│   ├── 3d/                 # RouteUniverse (R3F), Fallback2D (SVG), HeroExperience, sceneGraph
│   ├── forms/              # Multi-step route finder
│   ├── results/            # MatchCard, results, compare, program detail
│   ├── institution/        # Landing, lead form, dashboard
│   ├── passport/           # Canvas passport generator
│   ├── home/               # Homepage sections
│   └── shared/             # UI primitives, chrome, evidence components, content pages
├── data/
│   ├── programs.ts         # 14 FICTIONAL demo programs across 8 FICTIONAL institutions
│   └── dashboard.ts        # Fictional dashboard sample data
├── lib/
│   ├── matching.ts         # Deterministic route-fit engine (unit-tested)
│   ├── schemas.ts          # Zod schemas (unit-tested)
│   ├── store.ts            # localStorage repository + optional Supabase writes
│   ├── i18n.tsx            # Locale provider (messages/*.json)
│   ├── brand.ts            # Swappable brand tokens
│   └── utils.ts            # Formatting, labels, cn()
├── messages/en.json        # English copy
├── messages/ja.json        # Japanese copy (written natively, not literal translation)
├── supabase/schema.sql     # Optional production schema with RLS
├── tests/                  # Vitest: matching + validation
└── types/index.ts          # Full domain model
```

### The matching entity

The core matching entity is **institution + program + admission route + academic year**. Requirements, tuition and sources are scoped per program/route — university-wide facts are never applied to every program.

### The matching engine

`lib/matching.ts` is a pure, deterministic function. Components (academic, Japanese, budget, field, school type, location, timeline) add visible points; missing information and passed deadlines subtract. The result is a **route fit score (0–100)** — explicitly *not* an admission probability, and labeled that way in the UI with a tooltip. Sponsorship never enters the function. Eligibility labels are cautious (`likely_eligible` … `deadline_may_have_passed`) and the engine's generated text is tested to never contain guarantee language.

### i18n

`messages/en.json` / `messages/ja.json` hold all UI copy; nothing is machine-translated at runtime. To add Nepali/Vietnamese/Chinese/Indonesian/Korean: add `messages/<locale>.json`, extend `SUPPORTED` in `lib/i18n.tsx`, and add the button in `LanguageSwitch`. Program *content* is bilingual via `name`/`nameJa`-style fields in the data model.

### 3D hero

`components/3d/` renders the "Future Route Universe": a student node connected to university (electric blue) and vocational (teal) program nodes, which lead to career nodes. Particles flow both directions (profile data → institution; requirements/costs → student). Path brightness = real route-fit score from the same matching engine. Hover/click opens a glass info panel with fit score, one match reason, one gap, tuition, deadline and a CTA. The Institution View shows anonymized candidate nodes with consent status. Degrades gracefully: WebGL detection + `prefers-reduced-motion` → animated 2D SVG fallback; canvas is dynamically imported so it never blocks the CTA.

## Supabase (optional)

1. Create a project at supabase.com.
2. Run `supabase/schema.sql` in the SQL editor.
3. Copy `.env.example` to `.env.local` and fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

With credentials present, institution lead submissions are written to `institution_leads` (public insert, no anon read). Everything else stays local in this MVP; the schema already defines `student_profiles`, `consent_records`, `saved_programs` and `events` with owner-scoped RLS for the production phase.

## Deploying to Vercel

1. Push this repository to GitHub.
2. In Vercel: **New Project** → import the repo → set **Root Directory** to `miraipath`.
3. Framework preset: Next.js (auto-detected). Build command `npm run build`, output default.
4. Set `NEXT_PUBLIC_SITE_URL` to your deployment URL (and the Supabase vars if used).
5. Deploy. `robots.txt`, `sitemap.xml` and Open Graph metadata are generated automatically.

## Demo vs production

**Demo (this build):**
- All 8 institutions / 14 programs are fictional and labeled "Fictional Demo" everywhere they appear.
- Source URLs point to `demo.invalid` — placeholders for official admissions pages.
- Student profiles, saved routes, comparisons, consents and (without Supabase) institution leads live in the browser's localStorage only.
- Dashboard numbers and candidates are fictional sample data (labeled).
- "Report incorrect information" and "Request official info" record the action locally and confirm — no backend workflow yet.
- Team bios on /about are labeled placeholders.

**Production work (not in this MVP):**
- Verified real institutional catalog + source verification workflow.
- Supabase auth, server-side consent enforcement, introduction inbox for institutions.
- Partner billing; email notifications; admin tooling.
- Full localization of program content; additional locales.

## Ethical guardrails (enforced in code and copy)

- No claims of guaranteed admission, scholarships, visas, employment, salary or PR — the test suite asserts the matcher's text never contains guarantee language, and the methodology page lists non-guarantees explicitly.
- Sponsored placements always labeled; payment never affects scoring (it simply isn't an input to `matchProgram`).
- Private by default; consent is opt-in, scoped and recorded; working delete/export controls.
- No document uploads of any kind in the demo; no salary leaderboards; no student-vs-student ranking.
- No fake testimonials, user counts or partner logos.

## Rebranding

1. `lib/brand.ts` — name, taglines.
2. `app/globals.css` — `--mp-*` CSS variables (colors, radius).
3. `components/shared/chrome.tsx` — `Logo` mark.
4. `public/favicon.svg`, metadata strings in `app/layout.tsx`.

## Known assumptions

- Reference "today" for deadline logic in the hero and tests is pinned (2026-07-01) for determinism; live matching uses the real clock.
- JLPT is used as the Japanese-level scale; "equivalent certifications accepted" is modeled as a confirmation-required warning, not an automatic pass.
- First-year totals are computed as tuition + mandatory fees and always labeled estimates.
