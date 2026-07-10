# CareerVerse — Private Beta Plan

## Gate

18+ private beta. Anonymous simulation is open; account creation requires a beta
access code (env `NEXT_PUBLIC_BETA_CODE`, default `KANTO-BETA`). Admin manages
beta users in the admin area.

## Cohort

10–30 Japanese-language-school students in Kanto (mixed nationalities, JLPT N4–N1),
recruited directly by the founder. Bilingual onboarding message templates live in
the Support page copy.

## Beta-testing checklist

### Vertical slice
- [ ] Landing loads on a mid-range Android phone; content visible < 3 s (3D may stream in later)
- [ ] Create a future anonymously; answer 5 questions in < 3 min
- [ ] Two routes render as 3D parallel futures (Tier A/B) or 2D routes (Tier C)
- [ ] "Why this result?" shows factors, evidence strength, sources, dates
- [ ] Change budget assumption → route branches change + explanation panel appears
- [ ] Create account with beta code, save simulation, reload, still there
- [ ] Compare two schools; add one to application tracker
- [ ] Bilingual action plan renders in EN and JA
- [ ] Support form submits; admin sees the ticket
- [ ] Admin can view/edit records and approve a draft record

### Quality
- [ ] Keyboard-only pass of the full journey
- [ ] Reduced-motion pass (OS setting) — no parallax/particles
- [ ] WebGL disabled pass — 2D fallbacks everywhere
- [ ] Japanese layout review by a native reader
- [ ] 320px-wide viewport pass
- [ ] No console errors on the main journey

## Feedback loop

In-app support form (category: feedback) + weekly founder interviews. Corrections
via "Report a correction" feed the admin review queue.

## Exit criteria to public beta

≥ 70% of testers complete the vertical slice unaided; zero unresolved
visa-safety copy issues; data pipeline has ≥ 20 verified (non-demo) Kanto schools.
