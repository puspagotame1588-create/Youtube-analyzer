# CareerVerse — Product Specification (Private Beta)

## Mission

CareerVerse is a mobile-first, bilingual (EN/JA) career-simulation web application for
adult foreign students in Japan — initially students at Japanese-language schools in the
Kanto region who are deciding between **university, vocational school, and employment**.

The product widens access beyond the handful of schools and employers that market
themselves inside language schools, and replaces confusion with an explorable,
explainable simulation of possible futures.

**Emotional promise:** career decisions in Japan can become understandable and
manageable. Language should not prevent someone from choosing a suitable future.

## Launch constraints

- Region: Kanto only. No claim of nationwide coverage.
- Audience: 18+ private beta, invitation/beta-code gated for accounts.
- Languages: English + Japanese at launch; architecture ready for zh-Hans, vi, ko, tl, ne.
- Payments: none in beta. Entitlement tiers are modeled but not charged.
- Anonymous users can run a full first simulation; accounts are needed to save,
  compare persistently, receive alerts, or upload documents.

## The vertical slice (must work end-to-end)

1. Cinematic 3D landing (Gateway) → "Create Your First Future".
2. Future Creation Portal: free text / suggested futures.
3. Five-question rapid simulation (goal, education, Japanese level, budget, location).
4. Deterministic engine produces routes; two shown as parallel 3D futures.
5. "Why this result?" panel: factor scores, evidence strength, assumptions, sources.
6. Changing an assumption visibly re-branches the 3D route with an explanation.
7. Account creation (beta code) → save simulation.
8. School Galaxy → school detail → compare two schools → add to application tracker.
9. Bilingual action plan generated from the chosen route.
10. Support entry points (AI triage categories + human escalation path).
11. Admin area: data records, verification states, correction reports, beta users.

## Feature inventory

See §4–§19 of the mission brief; implemented pages are listed in ARCHITECTURE.md.
Free tier ("Explorer"): 1 saved simulation, 2-way comparison, basic action plan.
Paid tiers (Decision Report / Plus / Premium) exist as feature flags only.

## What CareerVerse is not

- Not legal or immigration representation (see SECURITY_PRIVACY.md and the
  in-product disclaimers). No "PR predictor", no guaranteed outcomes.
- Not a job board; users apply at the original/official source during beta.
- Not a survey tool; onboarding is spatial and visual, never a plain form.

## Success criteria for beta

- First useful simulation in under ~3 minutes from landing.
- Every recommendation answers "Why this result?" with sources and dates.
- Close routes are reported as close — no artificial winner.
- Verified vs demonstration data always distinguishable.
