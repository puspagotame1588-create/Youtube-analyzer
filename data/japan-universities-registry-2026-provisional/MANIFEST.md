# Japan universities registry — 2026 provisional (identity-only)

This directory holds the committed, reproducible source for CareerVerse's verified
university registry. It is derived entirely from the official MEXT school-code release
and is used as a **citable retrieval source** — not as scoring input.

## Source of truth

- **Publisher:** MEXT (文部科学省 / Ministry of Education, Culture, Sports, Science and Technology)
- **Source page:** https://www.mext.go.jp/b_menu/toukei/mext_01087.html
- **Source CSV:** https://www.mext.go.jp/content/20260529-mxt_chousa01-000011635_6.csv
- **Release:** 2026-05-01 **provisional** (暫定版); published 2026-05-29; file header updated 2026-05-20
- **Retrieved into this registry:** 2026-05-29
- **Scope:** MEXT school type `F1（大学）` — currently operating universities only

## What this file contains

`master_registry.csv` — **825 active universities**, one row per institution.

MEXT-direct or deterministically calculated (present for all 825):
mext_school_code, official_name_ja, normalized_name_ja, institution_type,
establishment_category (national/public/private), status, main/branch, postal_code,
prefecture, municipality, full Japanese address.

Absent from the canonical MEXT file, therefore **stored as `not_found` and never invented**:
official English name, official website URL, school corporation, former name, MEXT
experimental code.

## Honest scope boundary (why enrichment is empty)

This is a **registry / identity phase** dataset. Admissions requirements (JLPT/EJU),
tuition and fees, programs, faculties, campuses, scholarships, international support,
and career outcomes are **not yet enriched** — the upstream project ships those tables
as schema headers with zero rows. Per its own policy: *"Empty phase tables are not
evidence of zero availability; they mean the phase has not begun."*

CareerVerse therefore treats every eligibility/cost/program field for these
institutions as **"Not verified"**. No JLPT level, tuition figure, deadline, or program
is inferred for a registry university.

## Provisional status

MEXT has not yet published the 2026 **final** edition. Records from this source are
surfaced with a **provisional** verification status and must be reconciled when the
final release is available.

## Reproducibility

`scripts/build-university-registry.mjs` parses this CSV into
`src/lib/data/universities/registry.generated.ts`. The build is deterministic for the
preserved source file. Do not hand-edit the generated file; re-run the script instead.
