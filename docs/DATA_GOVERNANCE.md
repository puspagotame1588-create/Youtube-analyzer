# CareerVerse — Data Governance

## Allowed sources

Official institution websites, official government data (MEXT, JASSO, MHLW, ISA),
licensed APIs, partner feeds, explicitly permitted public datasets, and manually
entered records reviewed by an admin. **No unauthorized scraping, ever.**

## Record provenance (mandatory on every public record)

`source_url`, `source_type` (official / government / licensed / partner / manual),
`retrieved_at` / `reviewed_at`, `verification_status`, `reviewer`, `confidence`,
`review_due_at`. Records missing provenance cannot be published.

## Verification states

`draft → reviewed → published → outdated → archived`.
Only `published` records reach users; `outdated` records remain visible with a
prominent warning until replaced. AI-extracted data lands as `draft` and can never
auto-publish — admin approval is required for all school, scholarship, job, visa,
and salary records.

## Demonstration data

Beta seed data is clearly labeled `demo` (`is_demo = true`, "Demonstration data"
badge in UI, and listed in the Data Sources page). Demo salary ranges carry a
"representative example, not verified" label. The product never claims complete
coverage; the Data Sources page states the Kanto-only, sample-only scope.

## Source-adapter architecture

`src/lib/data/adapters/` defines a `SourceAdapter` interface (fetch → normalize →
stage-as-draft). Beta ships the `manual` adapter only; licensed feeds plug in later
without touching the engine.

## Corrections

Every school/scholarship/career page has "Report a correction"; reports create
`verification_reviews` entries visible in the admin review queue.

## Retention

- Uploaded documents: original deleted after extraction by default (opt-in storage).
- Extracted fields: kept until user deletes them or account deletion.
- AI job logs: 90 days, no hidden reasoning stored.
- Audit events: 1 year.
- Account deletion removes all personal rows (cascade defined in the schema).
