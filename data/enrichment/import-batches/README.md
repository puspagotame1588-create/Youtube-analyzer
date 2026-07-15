# External-research import batches

This directory defines the **handoff contract** for enrichment data researched
externally (e.g. by a ChatGPT research session) and imported into CareerVerse's
hardened enrichment pipeline (`src/lib/data/enrichment/`).

The external researcher's job is **discovery**: find official sources, extract
facts, cite locations. This codebase's job is **ingestion**: validate,
route to review, and — only after human approval of high-impact fields —
make an entity eligible for `decision_ready` and ranking.

No batch file may be imported directly into ranking. Every batch passes
through the same validation gates already enforced by
`src/lib/data/enrichment/validation.ts` (source classification,
academic-year-aware staleness, the 8-point decision-readiness checklist),
plus the batch-level rules below that are specific to bulk import.

## The 5 files

| File | Format | Purpose |
|---|---|---|
| `batch_manifest.json` | JSON | Batch identity, scope, declared counts |
| `batch_entities.jsonl` | JSON Lines | University + program + admission route + academic year units |
| `batch_facts.jsonl` | JSON Lines | Individual extracted facts, one per line, tied to an entity + source |
| `batch_sources.csv` | CSV | Official source citations, one row per source document |
| `batch_review_required.csv` | CSV | Facts pre-flagged for mandatory human review before decision_ready |

Empty/template examples with placeholder (non-real) data live in
[`templates/`](./templates). **Every placeholder ID in those templates is
deliberately invalid** (`TEMPLATE_DO_NOT_USE`, `univ_ftemplate0000000`) so an
accidental import without substitution fails the registry cross-check
immediately instead of silently entering the pipeline.

---

## Field reference

`field` values in `batch_facts.jsonl` must be one of the `EnrichmentField`
values defined in `src/lib/data/enrichment/types.ts`:

```
jlpt_requirement | eju_required | eju_subjects | tuition_jpy |
admission_fee_jpy | facility_fee_jpy | other_first_year_fees_jpy |
scholarship_reduction_available | program_name_ja | program_name_en |
intake_size | academic_year | application_start_date |
application_end_date | exam_date | interview_required |
education_years | program_scope
```

`classification` values in `batch_sources.csv` must be one of the
`SourceClassification` values defined in the same file and enforced by
`classifySource()` / `isOfficialSource()` in `validation.ts`:

```
official_university | official_government | official_public_agency |
approved_external | untrusted
```

Only `official_university`, `official_government`, and
`official_public_agency` count as "official" for decision-readiness.
`untrusted` sources are rejected outright — they cannot back any fact.

---

## Schema: `batch_manifest.json`

```jsonc
{
  "batch_id": "string, unique, e.g. batch-2026-07-15-chatgpt-001",
  "created_at": "ISO 8601 UTC timestamp",
  "generated_by": "string identifying the research session/agent",
  "academic_year_scope": "string, exactly one academic year, e.g. 2024-2025 — a batch may not mix years",
  "institution_scope": {
    "mext_school_codes": ["array of MEXT school codes covered by this batch"],
    "count": "integer, must equal institution_scope.mext_school_codes.length"
  },
  "counts": {
    "entities": "integer, must equal number of lines in batch_entities.jsonl",
    "facts": "integer, must equal number of lines in batch_facts.jsonl",
    "sources": "integer, must equal number of data rows in batch_sources.csv",
    "review_required": "integer, must equal number of data rows in batch_review_required.csv"
  },
  "research_notes": "string | null — free-text summary of coverage/method",
  "known_gaps": ["array of strings — fields/institutions the researcher could not verify"],
  "checksum_sha256": "string | null — optional integrity hash over the other 4 files concatenated"
}
```

## Schema: `batch_entities.jsonl` (one JSON object per line)

```jsonc
{
  "entity_id": "string — {university_id}:{program_slug}:{admission_route}:{academic_year}",
  "university_id": "string — must exist in the 825-school MEXT registry (UniversityRecord.id)",
  "mext_school_code": "string — must match the registry record for university_id",
  "university_name_ja": "string — must match registry.nameJa (cross-check, catches ID typos)",
  "program_name_ja": "string | null",
  "program_name_en": "string | null",
  "admission_route": "string — e.g. international-direct-application, mext-scholarship, general-jlpt-exam",
  "academic_year": "string — exactly one year, e.g. 2024-2025",
  "notes": "string | null"
}
```

## Schema: `batch_facts.jsonl` (one JSON object per line)

```jsonc
{
  "fact_id": "string, unique within the batch",
  "entity_id": "string — FK to batch_entities.entity_id",
  "field": "EnrichmentField — see field reference above",
  "value": "string | number | boolean | null — null is a valid, preserved value; never omit the key",
  "source_id": "string — FK to batch_sources.source_id",
  "source_locator": "string, required, non-empty — page/section/table row/paragraph",
  "academic_year": "string — must equal the parent entity's academic_year exactly; cross-year facts are rejected",
  "extracted_at": "ISO 8601 timestamp",
  "confidence": "high | medium | low",
  "extractor": "external-research",
  "notes": "string | null"
}
```

## Schema: `batch_sources.csv`

```
source_id,mext_school_code,scope,entity_id,url,domain,classification,academic_year,retrieved_at,publication_date,application_deadline,content_hash,notes
```

- `scope`: `university_wide` | `program_specific`
- `entity_id`: **required** when `scope=program_specific`; **must be blank** when `scope=university_wide`
- A `university_wide` source may back university-level facts (e.g. general tuition schedule) shared across entities, but may **not** be cited as evidence for a `program_specific` field (e.g. a specific department's JLPT requirement) — that combination is rejected as scope mismatch, per the import rules below.

## Schema: `batch_review_required.csv`

```
fact_id,entity_id,field,reason,flagged_at,status,notes
```

- `reason`: `eligibility | jlpt | eju | deadline | tuition | conflicting_sources | scope_mismatch | low_confidence | other`
- `status`: always `pending` on import — only a human reviewer changes this afterward
- Any fact for `jlpt_requirement`, `eju_required`, `eju_subjects`, `tuition_jpy`, `admission_fee_jpy`, `application_end_date`, or `interview_required` **must** appear here; the importer rejects a batch where one of these fields is present in `batch_facts.jsonl` but absent from `batch_review_required.csv`.

---

## Import validation rules (enforced before any record reaches the pipeline)

1. **Registry cross-check** — every `university_id` / `mext_school_code` in `batch_entities.jsonl` and `batch_sources.csv` must resolve to a record in the 825-school MEXT registry (`getUniversityByMextCode` / `getUniversityById`). Unknown codes are rejected, not guessed.
2. **Entity completeness** — every entity requires university + program/faculty + admission route + academic year. Any missing dimension rejects the entity.
3. **Official source + locator per fact** — every fact must cite a `source_id` that resolves to an `official_*` classified source, and must carry a non-empty `source_locator`. Facts failing either check are rejected, not silently dropped as `null`.
4. **Explicit nulls preserved** — a field the researcher could not verify must appear with `"value": null`, never be omitted. Omission is treated as an incomplete-import error, not an absence.
5. **No cross-year mixing** — a batch declares one `academic_year_scope`; any entity or fact whose `academic_year` disagrees with its own declared year (entity vs. fact) is rejected.
6. **Scope enforcement** — a `program_specific` fact backed only by a `university_wide`-scoped source is rejected as scope mismatch and logged in the import report; it does not silently pass as verified.
7. **Conflicting facts retained, not resolved automatically** — if two accepted facts disagree on the same `(entity_id, field)`, both are kept, the entity is routed to `needs_review`, and neither is used for ranking until a human resolves it.
8. **Mandatory human approval** — `jlpt_requirement`, `eju_required`, `tuition_jpy`, `admission_fee_jpy`, and any deadline field (`application_start_date`, `application_end_date`, `exam_date`) cannot reach `decision_ready` on `extractor: "external-research"` alone. They require a subsequent human-verification pass (`extractor: "human-verified"`) exactly as already enforced by `HIGH_IMPACT_FIELDS` in `validation.ts` — this batch format extends that set to include deadline fields for import purposes; the corresponding code update to `validation.ts` is a follow-up, not yet made.
9. **Candidate / needs_review data walled off from ranking** — nothing imported from a batch is visible to the ranking engine unless its entity reaches `decision_ready` through the existing pipeline gates (`getDecisionReadyEntities()` already filters on status and excludes synthetic fixtures; the importer must not bypass it).
10. **No fabricated data for real institutions** — if a batch cannot find an official source for a required field, the importer must record `value: null` with a gap note, never a plausible-looking placeholder.

## Import report (produced by every import run)

For each batch, the importer must produce a report with:

- **accepted** — entities/facts that passed all checks and were written into the pipeline as `identity_only`/`sources_discovered`/`needs_review` per their actual status (never auto-promoted to `decision_ready`)
- **rejected** — records failing rule 1–6 above, with the specific rule violated
- **duplicate** — `entity_id`/`fact_id` collisions against already-imported data (idempotent re-import: same batch re-run produces the same result, not duplicate rows)
- **conflicting** — `(entity_id, field)` pairs with disagreeing accepted facts (rule 7)
- **incomplete** — entities missing one or more of the 7 required fields (`REQUIRED_FIELDS` in `validation.ts`) after import

This report itself is not committed with real institutional data until the
importer exists and a real batch has been run against it — this document
defines the target shape only.

---

## Status of this document

This defines the schema and rules only. The importer (code that parses these
5 files, applies the rules above, and calls into the existing
`processEntity()` pipeline) has **not** been implemented yet, and no batch
has been ingested. Production ranking is unchanged.
