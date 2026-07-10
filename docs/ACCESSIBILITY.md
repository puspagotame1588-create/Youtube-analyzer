# CareerVerse — Accessibility

## Commitments

- Complete product usable **without WebGL**: every 3D scene has a 2D/list
  equivalent carrying identical information and actions (auto-fallback + manual
  toggle).
- `prefers-reduced-motion` honored globally: no parallax, no camera drift, no
  particle motion; transitions become fades/instant.
- Full keyboard navigation: all actions reachable by tab order; 3D node selection
  mirrored by an accessible list beside/below each scene; visible focus rings
  (`:focus-visible`, 2px cyan on light surfaces).
- Semantic HTML landmarks, headings in order, `aria-label`s on icon buttons,
  screen-reader text for scene state changes (`aria-live` for "what changed" panels).
- Contrast ≥ 4.5:1 body text, ≥ 3:1 large text/UI; color never sole signal
  (icons + text labels accompany all semantic colors).
- Touch targets ≥ 44px; text resizes to 200% without loss; data tables use real
  `<table>` with `<th scope>`.
- Forms: labels bound to inputs, zod errors announced inline in plain language,
  bilingual error messages.

## Testing

- Playwright e2e includes a reduced-motion, no-WebGL journey.
- Manual audit checklist in BETA_PLAN.md (keyboard sweep, VoiceOver/TalkBack spot
  checks, 200% zoom, 320px viewport).

## Known beta limitations

- Furigana rendering is per-term (key vocabulary), not full-text.
- Voice input uses the browser's Web Speech API where available; a text path is
  always present.
