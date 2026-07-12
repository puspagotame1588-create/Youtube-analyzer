# CareerVerse — Progress Log

Final state of the autonomous production build (2026-07-10). Verified gates:
`tsc --noEmit` ✓ · `next build` ✓ (27 routes) · Vitest 37/37 ✓ ·
Playwright 12/12 ✓ (desktop, Pixel 7, reduced-motion) · ESLint ✓ ·
screenshot inspection loop ran 4 rounds (desktop + mobile).

## Phase 1 — Foundation
- [x] Repository inspected (was an unrelated Vite portfolio; rebuilt on this branch)
- [x] Documentation set created
- [x] Next.js 14 + TS strict + Tailwind + tokens scaffolded
- [x] i18n (next-intl, en/ja) wired
- [x] Database schema (Supabase migrations) written
- [x] Vitest + Playwright configured

## Phase 2 — Visual proof
- [x] Gateway scene (floating city, paths, particles, parallax, EN/JA reactive)
- [x] Future Creation Portal
- [x] Five-question spatial onboarding
- [x] Parallel Futures Universe (routes + milestones)
- [x] Branch-change animation with cause explanation
- [x] Quality tiers A/B/C + reduced motion + no-WebGL fallback

## Phase 3 — Vertical slice
- [x] Deterministic engine + why-this-result + assumption editing
- [x] Account creation (beta code, local mode), save/load
- [x] School galaxy, detail, comparison, tracker
- [x] Bilingual action plan
- [x] Support entry points

## Phase 4 — Data & admin
- [x] Seed dataset (Kanto, demo-labeled) + source registry
- [x] Admin login, dashboard, review queue, audit log

## Phase 5 — AI
- [x] Provider interface, mock provider, Anthropic provider, /api/ai, zod validation

## Phase 6 — Hardening
- [x] Unit tests (engine, scoring, schemas)
- [x] E2E journey test
- [x] Empty/error/loading states
- [x] Accessibility pass

## Phase 7 — Visual loop
- [x] Screenshot inspection rounds (desktop + mobile) and fixes

## Phase 8 — Deployment readiness
- [x] `next build` green, `tsc --noEmit` green, tests green
- [x] .env.example, deployment guide, seed command

## Phase 9 — Production operations (live)
Live alias: https://careerverse-one.vercel.app · GitHub↔Vercel integration connected
(production branch `claude/careerverse-production-build-lb3d7z`; every push auto-deploys,
`VERCEL_GIT_COMMIT_SHA` populated). Identity is verifiable at runtime:
`/api/version` (build-derived SHA) and `/api/health` (config state, no secrets).

- [x] **Anthropic production integration — VERIFIED** (2026-07-12)
      Build SHA `17819221e38b3ea47e7e9f5ae8849d36bde99c8f`. Protected
      `POST /api/ai/smoke-test` (bearer = `AI_SMOKE_TEST_TOKEN` or `ADMIN_ACCESS_CODE`)
      returned: `configured: true`, `providerReachable: true`, `model: claude-sonnet-5`,
      `latencyMs: 1199`, `errorCategory: null`. `/api/health` reports
      `aiProvider: anthropic-configured`. Key value never exposed by any endpoint.

### Private-beta operational blockers — ALL CLOSED (2026-07-12)
Verified live at `/api/health`: `developerMode: false`, `issues: []`
(build SHA `946e1aaddd54518431ef3507f7ce9c321c7a4705`).
- [x] Durable KV — Upstash Redis (`kv: upstash`)
- [x] `ADMIN_ACCESS_CODE` — strong secret set (`admin: configured`)
- [x] `INVITE_CODE_HASHES` — 5 codes, 3 uses each, no expiry (`invite: configured`)
- [x] Support delivery — sanitized webhook (`supportDelivery: webhook`). The chat
      webhook receives only reference/category/reply-email; the full ticket is
      retained in the durable Upstash queue (`support:queue`). Full email provider
      (Resend/Postmark, verified domain) to be added later.

Deployment is out of developer mode and fail-closed on every gate. Remaining
follow-ups are enhancements, not blockers: admin UI to read `support:queue`,
and the email support provider.
