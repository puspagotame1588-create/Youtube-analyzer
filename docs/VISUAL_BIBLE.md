# CareerVerse — Visual Bible: "Luminous Japanese Futurism"

## Concept

A bright, optimistic, futuristic Japan. The user's possible futures form a luminous
floating city; opportunities travel along transit-map-like light paths. Apple-grade
clarity and spacing meet soft holographic depth and controlled neon accents.
**Never dark-cyberpunk. Never a dashboard.**

## Semantic color tokens (light-first)

| Token | Value | Meaning |
| --- | --- | --- |
| `--cv-base` | `#F7F8FC` pearl | environmental base |
| `--cv-surface` | translucent white (`rgba(255,255,255,.72)` + blur) | glass panels |
| `--cv-ink` | `#1B2340` | primary text (soft Japanese indigo-black) |
| `--cv-indigo` | `#3D4A8C` | serious information (visa, legal) |
| `--cv-cyan` | `#00B8D9` | active opportunities |
| `--cv-violet` | `#8B5CF6` | future possibilities |
| `--cv-emerald` | `#10B981` | verified / safe |
| `--cv-amber` | `#F59E0B` | uncertainty |
| `--cv-coral` | `#F0564A` | material risk |

Rules: color is never the only signal (icons + labels always accompany it).
Gradients animate subtly (8–20 s cycles) on hero surfaces only, never behind body text.
Contrast: all text ≥ 4.5:1 against its actual backdrop (panels add opacity as needed).

## Typography

- Latin: system variable stack (`Inter var`-compatible: `ui-sans-serif, -apple-system…`)
  self-hosted Inter Variable subset to avoid FOUT; Japanese fallback chain:
  `"Hiragino Sans", "Noto Sans JP", "Yu Gothic UI", sans-serif`.
- `font-display: swap` + metric-compatible fallbacks; `lang` attribute always set.
- Japanese line-height ≥ 1.7; no italics for Japanese; official terms keep kanji with
  reading, e.g. **Residence status（在留資格）**.

## Spatial language

- **Paths** = futures. Catmull-Rom light ribbons; particles flow toward milestones.
- **Nodes** = milestones. Soft glowing spheres; selected node blooms and opens a panel.
- **Portals** = entry to a future. Torus glow rings with slow shimmer.
- **Risk** = coral fog volumes / dimmed-desaturated branches, plus a text explanation.
- **Verification** = emerald ring + check glyph + "verified" text (never color alone).

## Motion principles

Cause → effect, always narrated: any scene change triggered by a user assumption
shows a "What changed and why" panel. Springs for UI (Framer), eased camera dollies
for scenes (≤ 900 ms, interruptible). No scroll-jacking, no unskippable sequences,
no meaningless idle spinning (idle drift ≤ 2°, disabled under reduced motion).

## Reduced motion & Tier C

`prefers-reduced-motion` or Battery-saver: static pearl-gradient backdrop, instant
transitions, SVG route diagrams with depth styling (soft shadows, layered cards).
Identical information and actions.

## Per-screen signatures

- **Gateway:** floating city, five district clusters (university/vocational/work/
  scholarship/visa landmarks), pointer parallax ≤ 3°, CTA embedded on a floating slab.
- **Universe:** two+ diverging ribbons from a shared "Now" beacon; comparison legend.
- **School Galaxy:** constellation; size = recommendation strength, ring = scholarship,
  glyph = institution type; list view toggle is a first-class equal.
- **Settlement Roadmap:** deliberately calm — indigo on pearl, flat-depth SVG,
  no celebration effects around legal outcomes.
