# CareerVerse — Security & Privacy

## Authentication & authorization

- Production target: Supabase Auth (email) + Row-Level Security; every table with
  user data has RLS policies (see `supabase/migrations/0001_init.sql`) and all
  mutations re-check authorization server-side.
- Beta local mode: accounts live only in the user's browser storage, clearly
  labeled "Local beta mode — data stays on this device". Beta access code gate.
- Admin area is unlinked from public navigation, sits behind its own credential
  (env `ADMIN_ACCESS_CODE`), and every admin action writes an audit event.

## Private-beta invite gate

- Personalized areas (create/universe/route/compare/plan/tracker/profile/
  documents/notifications/auth) sit behind an app-level invite gate enforced in
  middleware. Public information pages stay open.
- Only SHA-256 hashes of invite codes are stored (`INVITE_CODE_HASHES`,
  `hash[:expiresISO[:maxUses]]`). Codes are generated in the admin area and
  shown exactly once. Expiry and revocation (removing the hash) are enforced
  server-side; failure messages are generic and attempts are rate-limited.
- Known limitation: per-code use-count enforcement is best-effort in-memory per
  server instance until a shared store (Supabase/KV) is configured.

## Secrets

- `ANTHROPIC_API_KEY` and admin credentials are server-side env vars only; the
  browser never receives them. `/api/ai` is the single AI entry point with
  per-session rate limits. `.env*` is gitignored; `.env.example` documents keys.

## Documents

- Beta accepts: resume, transcript, JLPT/EJU results, attendance certificate,
  school brochure, job listing. **Passport and residence card are refused.**
- Pipeline: upload → type/size validation → extraction → every field shown for
  user correction → explicit confirmation → only then profile update. Original
  deleted by default post-extraction; storage is opt-in (production: encrypted
  bucket + signed URLs). User documents are never used for advertising.

## Visa & legal safety (hard rules)

Never state that a visa/PR outcome is guaranteed, that a user definitely
qualifies, or that CareerVerse made an official determination. Standard phrasing:

> "This route may be compatible with the information provided. Final eligibility
> depends on individual circumstances and official review."

Every visa-related output includes: general guidance, official source, date
checked, known uncertainty, and a referral trigger to qualified professionals
(gyoseishoshi / immigration lawyer) for individualized interpretation.

## Escalation triggers (support)

Low AI confidence, contradictory visa info, urgent deadline, serious financial
risk, document review, repeated confusion, individualized legal question, severe
emotional distress, payment/account issues → route to human support.

## Data protection

18+ only (age confirmation at account creation). Data export and account deletion
are user-facing features. No tracking pixels or third-party ads in beta.
