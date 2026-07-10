# CareerVerse — Decision Log

| # | Decision | Rationale |
| --- | --- | --- |
| 1 | Rebuild repo as Next.js 14 App Router app on this branch; the old Vite portfolio remains on `main` | The existing code is an unrelated product; nothing to preserve except the repo itself |
| 2 | Next 14 (not 15) + React 18 | R3F v8 / drei v9 are stable against React 18; React 19 + R3F v9 was newer and riskier for a production beta |
| 3 | No GSAP | Framer Motion + R3F frame loop cover every needed motion; a second animation runtime adds bundle weight without a clear advantage |
| 4 | No TanStack Query | Beta persistence is a local storage adapter (no remote server state); adding it now would be speculative. Revisit when Supabase goes live |
| 5 | No @react-three/postprocessing in beta | Bloom via emissive materials + tone mapping achieves the luminous look at a fraction of the mobile GPU cost; postprocessing can be added for Tier A later |
| 6 | Procedural geometry only, no downloaded glTF assets | Zero licensing risk, tiny payload, consistent style; Draco/Meshopt pipeline documented for when real assets arrive |
| 7 | Storage adapter with local-first beta mode | No Supabase credentials available in the build environment; schema + RLS shipped as migrations so production switch is configuration, not rewrite. UI labels local mode clearly |
| 8 | MockAIProvider default, AnthropicProvider when `ANTHROPIC_API_KEY` set | Mission requires full function without a live key and no fabricated "live" AI responses; mock outputs are labeled "Development mode" |
| 9 | Admin auth via env access code in beta | Single-founder operation; full Supabase role-based auth documented for production |
| 10 | Deterministic engine in pure TypeScript, zero deps | Testability, inspectability, and the "LLM never invents scores" rule |
| 11 | Numeric probabilities suppressed | No credible outcome dataset exists in beta → Low/Medium/High feasibility + evidence strength instead |
| 12 | Settlement roadmap is calm SVG, not 3D | Mission demands a serious, non-game-like treatment of legal matters |
| 13 | Five career categories seeded: business/office, IT, hospitality, food-service management, real estate | Mission-specified initial depth |
| 14 | Locale routing `/{en|ja}/…` with `en` default redirect | Explicit URLs aid sharing and SEO later; next-intl middleware handles detection |
| 15 | Voice input via Web Speech API where present, hidden elsewhere | Progressive enhancement without a paid STT dependency |
| 16 | i18n split: next-intl messages for shared chrome; typed `{en, ja}` objects colocated with pages/data for content | Dataset records are inherently bilingual; colocated typed pairs guarantee both languages exist at compile time and avoid thousand-key JSON drift during beta. Future locales extend the `Bi` type + messages |
| 17 | Removed the GitHub Pages workflow on this branch | CareerVerse has API routes and middleware — it is not a static export; deploy via Vercel/Node instead |
| 18 | Canvas `flat` (no tone mapping) | ACES tone mapping muddied the pearl/pastel palette into grey; NoToneMapping keeps token colors true, matching the light "Luminous Japanese Futurism" identity |
