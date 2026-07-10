# CareerVerse — private beta

A mobile-first, bilingual (EN/日本語) career-simulation universe for foreign students in
Japan. Compare university, vocational-school, and direct-employment futures as
explorable 3D routes with verified, explainable data — built with Next.js, React Three
Fiber, and a deterministic simulation engine.

> **Status:** private beta (Kanto region, demonstration dataset, 18+, invitation only).
> All seed records are clearly labeled demonstration data. Nothing here is legal or
> immigration advice.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000 → redirects to /en
```

No environment variables are required — the beta runs fully in **local mode**
(browser-persisted data, labeled rule-based AI responses). See `.env.example` for the
optional keys.

| Command | What it does |
| --- | --- |
| `npm run dev` | dev server |
| `npm run build` / `npm start` | production build / serve |
| `npm run typecheck` | strict TypeScript |
| `npm test` | Vitest unit tests (engine, scoring, AI mock) |
| `npm run test:e2e` | Playwright journey tests (desktop / mobile / reduced-motion) |
| `npm run seed` | validates the demo dataset and writes `.seed-out/dataset.json` |
| `npm run lint` | ESLint |
| `node scripts/screenshots.mjs` | captures desktop+mobile screenshots of key screens (server must be running on :3100) |

## Environment variables (all optional in beta)

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Enables live Claude explanations via `/api/ai`. Without it a **labeled** rule-based mock answers — never presented as live AI. |
| `ADMIN_ACCESS_CODE` | Admin area code (default `careerverse-admin`). |
| `NEXT_PUBLIC_BETA_CODE` | Beta signup code (default `KANTO-BETA`). |
| `NEXT_PUBLIC_SUPABASE_URL` etc. | Production persistence (see below). |

## Admin area

Not linked from public navigation. Open `/{en|ja}/admin`, enter the access code
(server-checked, httpOnly cookie, rate-limited). Dashboard: record inventory with
verification states (draft → reviewed → published → outdated → archived), feature
flags, beta users, audit log. Review queue: user correction reports, staged draft
records (nothing publishes without approval — AI-collected data can never
auto-publish).

## Database

The beta persists to the browser (labeled "local beta mode"). The production path is
Supabase: apply `supabase/migrations/0001_init.sql` (30+ normalized tables, indexes,
RLS policies for every personal table), set the env vars, and swap the storage
adapter. `npm run seed` validates the dataset; real records enter through the admin
review pipeline, not bulk inserts.

## Deployment

Any Node host works. Vercel:

1. Import the repo, framework preset **Next.js** — no special build settings.
2. Add the env vars you want (none are required).
3. Deploy. `next build` + `next start` is the self-hosted equivalent.

Checklist before deploying: `npm run typecheck && npm test && npm run build`.

## Architecture, method, and governance

Full documentation in `docs/`:
`PRODUCT_SPEC` · `ARCHITECTURE` · `VISUAL_BIBLE` · `SIMULATION_METHOD` ·
`DATA_GOVERNANCE` · `SECURITY_PRIVACY` · `ACCESSIBILITY` · `BETA_PLAN` ·
`DECISIONS` · `PROGRESS`.

Key rules baked into the code:

- **The AI never invents scores.** `src/lib/simulation` is pure, deterministic,
  unit-tested TypeScript; the LLM only explains/translates, with zod-validated output.
- **Trust is visible.** Every record carries sources, dates, verification state, and a
  demo label where applicable; close results are reported as close.
- **Visa language is bounded.** General guidance + official sources + individual-review
  caveat, with referral triggers to qualified professionals.
- **Every 3D view has a 2D equivalent** (device tiers A/B/C, reduced motion, no-WebGL).
