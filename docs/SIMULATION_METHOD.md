# CareerVerse — Simulation Method

## Principles

1. **Deterministic and inspectable.** Scores come from code + verified structured
   data. The same inputs always produce the same outputs (unit-tested).
2. **The LLM never invents scores.** AI explains, summarizes, translates, and
   extracts; extracted assumptions require explicit user confirmation before they
   affect any score.
3. **No artificial winner.** When top routes are within 5 points (of 100), the UI
   states that neither is clearly superior.

## Inputs

Profile (may contain ranges/uncertain values → each expands to conservative /
expected / optimistic values), priorities (user-adjustable weights), and the
verified dataset snapshot (schools, tuition, scholarships, careers, demo-labeled
salary ranges).

## Factors and default weights

| Factor | Weight |
| --- | --- |
| Affordability | 20% |
| Visa feasibility | 20% |
| Employment feasibility | 15% |
| Salary potential | 15% |
| Location preference | 10% |
| Long-term settlement alignment | 10% |
| Personal interests & skills | 10% |

Weights renormalize when a user adjusts priorities. Each factor scores 0–100 from
explicit rules (see `src/lib/simulation/scoring.ts`); the weighted sum is the route
score. Factor rules are documented inline and covered by unit tests.

## Route generation

For a given goal the engine builds candidate routes from route templates
(university / vocational / direct employment, per field and location), attaches
milestones (language school → JLPT target → application deadline → admission →
tuition payments → scholarship windows → internship → graduation → first job →
residence-status transition → 3-year → 5-year → settlement stage), computes cost
and time totals, and labels each route:

- **Best Overall** (highest expected-case score)
- **Safest** (highest conservative-case score)
- **Fastest to Employment** (minimum months to first full-time job)
- **Highest Long-Term Potential** (highest optimistic 5-year score)

## Confidence system

Numeric probabilities are **not** shown unless a credible dataset supports them
(none in beta). Instead every route reports:

- Feasibility: Low / Medium / High (rule thresholds on the conservative case)
- Evidence strength: Weak / Moderate / Strong (share of inputs backed by verified
  records vs demo data vs user guesses)
- Data freshness (oldest `last_verified` date among used records)
- Assumptions used (each flagged user-provided / default / AI-suggested-confirmed)
- Missing information and what would change the result

"Why this result?" shows per-factor contributions, sources with dates, known
limitations, and adjustable assumptions.

## Three cases

Uncertain inputs (e.g. budget "possibly ¥500,000", JLPT "expecting N2") produce
conservative / expected / optimistic input sets; the engine runs all three and the
UI can show the spread. Beta UI defaults to expected with a spread indicator.
