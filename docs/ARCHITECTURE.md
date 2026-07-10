# CareerVerse — Architecture

## Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 14 App Router, TypeScript `strict` | Server components for content pages, client components for 3D/interactive |
| Styling | Tailwind CSS 3 + semantic design tokens | Tokens in `src/styles/tokens.css`, mapped into Tailwind theme |
| 3D | three + @react-three/fiber + @react-three/drei | Procedural geometry only; no downloaded assets in beta |
| Motion | Framer Motion (UI) + R3F frame loop (scenes) | GSAP intentionally omitted (see DECISIONS.md) |
| i18n | next-intl, `[locale]` segment routing | `messages/en.json`, `messages/ja.json` |
| Client state | Zustand (persisted slices for local beta data) | 3D scene state kept separate from business data |
| Forms/validation | react-hook-form + zod | All AI outputs also zod-validated |
| AI | Provider interface: `MockAIProvider` (default) / `AnthropicProvider` | Server-side only, `/api/ai`; never exposed to browser |
| Persistence | Storage-adapter interface: `LocalStoreAdapter` (beta default) / Supabase (SQL migrations ready) | See DATA_GOVERNANCE.md |
| Tests | Vitest (engine, scoring, schemas) + Playwright (e2e journey) | |

## Directory map

```
src/
  app/[locale]/            localized routes (landing, create, universe, schools, …)
  app/[locale]/admin/      admin login, dashboard, data review (not publicly linked)
  app/api/ai/              server-side AI endpoint (zod-validated, rate-limited)
  components/three/        Gateway, UniverseScene, SchoolGalaxy, quality systems
  components/ui/           panels, buttons, chrome, language switcher, a11y helpers
  lib/simulation/          deterministic engine: types, scoring, routes, milestones
  lib/data/                seed records, source registry, verification states
  lib/ai/                  provider interface, mock + anthropic providers, prompts
  lib/store/               zustand stores (profile, scenarios, ui/quality, auth)
  lib/i18n/                next-intl config
messages/                  en.json / ja.json
supabase/migrations/       full relational schema (0001_init.sql)
scripts/seed.ts            seed runner (writes JSON snapshot used by local adapter)
e2e/                       Playwright specs
docs/                      this documentation set
```

## Key boundaries

1. **Simulation is deterministic.** `lib/simulation` has zero AI or network
   dependencies; the LLM never invents scores. AI explains, translates, extracts —
   with zod validation and user confirmation before anything enters the engine.
2. **3D is presentation only.** Scenes read a `SimulationResult`/dataset snapshot;
   they never own business data. Every 3D view has a 2D/list equivalent.
3. **Storage adapter.** The beta ships with a local adapter (browser persistence,
   clearly labeled "Local beta mode"). `supabase/migrations` + `lib/data/supabase.md`
   document the production path; switching is a provider swap, not a rewrite.
4. **Quality tiers.** `lib/store/quality.ts` detects device tier (A/B/C) from
   `deviceMemory`, cores, WebGL renderer, and `prefers-reduced-motion`; users can
   override manually in Settings. Tier C renders 2D-with-depth alternatives.

## Rendering tiers

- **A (Full):** particles, bloom-like emissive materials, full geometry, dpr ≤ 2.
- **B (Balanced):** reduced particle counts, no post effects, dpr ≤ 1.5.
- **C (Essential):** no WebGL canvas; animated CSS gradient + SVG route views.
  All information and actions available in every tier.

## Resource hygiene

Scene components dispose geometries/materials on unmount (`useEffect` cleanup +
R3F automatic disposal), animation loops stop when the canvas unmounts, and heavy
scenes are `next/dynamic` lazy-loaded with skeleton fallbacks so first content is
never blocked by 3D.

## Entities

See `supabase/migrations/0001_init.sql` for the full normalized schema (users,
profiles, education_history, language_qualifications, skills, work_experience,
financial_situations, preferences, scenarios, scenario_assumptions, routes,
route_milestones, route_scores, schools, courses, tuition_records, scholarships,
career_profiles, job_listings, application_trackers, documents, extracted_fields,
sources, verification_reviews, notifications, support_tickets, ai_jobs,
prompt_versions, audit_events, feature_flags) with indexes and RLS policies.
