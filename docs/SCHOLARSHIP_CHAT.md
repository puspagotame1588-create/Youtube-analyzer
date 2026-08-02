# Scholarship Source Assistant — architecture, setup and limits

The assistant answers scholarship questions from an audited corpus of official-source
claims. This document covers what it guarantees, how that guarantee is enforced, how to
configure a provider, and what is **not** guaranteed.

## The guarantee

**No factual text shown to the user is authored by a model.**

The model's job is selection, not writing. It receives the retrieved claims, and returns
claim ids plus one connective key from a closed enum. Everything the user reads is then
composed server-side from the corpus.

```
question
  → buildScholarshipContext()      retrieve claims; the model's entire factual world
  → provider.run()                 model returns { programme, lead, claimIds, unpublishedIds }
  → resolveScholarshipAnswer()     ids resolved against the SAME context; strays dropped
  → composeAnswer()                text built from corpus statements + fixed server chrome
  → isComposedFromCorpus()         re-derives and compares; any mismatch fails closed
```

### Why it is structural rather than prompt-based

An earlier version let the model write the answer prose and attach claim ids. Ids, URLs,
programme ownership and publication status were all verified — but the prose was not. An
adversarial probe confirmed the gap: a model could return

> "The JASSO Honors Scholarship pays ¥250,000 per month and the deadline is 1 April 2027."

carrying the **real** id `J-10` from the **correct** programme, and the resolver passed the
sentence through verbatim, directly above the genuine citation that contradicted it. A
valid citation under a false sentence is worse than no citation: it lends the lie
authority.

The fix is not a stronger prompt. `scholarshipChatResultSchema` has no string field for
prose, so the sentence is stripped by zod before the resolver runs, and the OpenAI JSON
schema forbids it at generation time as well. `lead` is an enum of four keys, each mapping
to fixed server-owned text; there is no key that can carry an amount, date, deadline,
eligibility rule, status or programme name.

No second model call and no entailment scoring is involved. Every check is deterministic.

### What is enforced where

| Attack | Defence | Where |
| --- | --- | --- |
| Fabricated claim id | id must exist in the context supplied to the model | `resolveScholarshipAnswer` |
| Id from another programme | id must belong to the section's own programme | `resolveScholarshipAnswer` |
| Unpublished field asserted as fact | confirmed and unpublished are separate maps | `buildScholarshipContext` |
| Fabricated URL | URLs are looked up from the corpus; the model never sees one | `urlsFor` |
| False prose with a valid citation | no text field exists in the output schema | `provider.ts` / `scholarship-answer.ts` |
| Altered amount or date | fact text is `getScholarshipClaim(id).statement`, verbatim | `composeAnswer` |
| Tampering after composition | blocks are re-derived and compared | `isComposedFromCorpus` |
| Prompt injection | injected text has no field to occupy | schema + composer |
| No relevant evidence | retrieval returns empty; the model is never called | route |

Tests: `src/lib/ai/scholarship-invariants.test.ts`, `src/lib/ai/prose-loophole.probe.test.ts`,
`src/app/api/chat/scholarships/route.test.ts`, `src/lib/ai/openai.test.ts`.

### Length limits are structured, not truncated

There is no character cap on the answer. A completed factual statement is never cut
mid-sentence. Bounds are applied per section and per claim instead:

- at most `MAX_CLAIM_IDS_PER_SECTION` (8) confirmed and 8 unpublished claims per programme;
- at most `MAX_SECTIONS_PER_ANSWER` (3) programmes;
- surplus ids are dropped **whole** and reported in `droppedClaimIds`.

## Provider setup

Selection order (`src/lib/ai/select.ts`):

| Environment | Provider |
| --- | --- |
| `AI_PROVIDER=mock` | mock, explicitly |
| `OPENAI_API_KEY` set | OpenAI (preferred when both keys are present) |
| `ANTHROPIC_API_KEY` set | Anthropic |
| neither | mock, labeled `provider: "mock"` in every response |

```bash
# OpenAI (Responses API, official SDK)
OPENAI_API_KEY=...        # required
OPENAI_MODEL=gpt-4.1-mini # optional; this is the default
```

Keys are read only in `getProvider()`, handed straight to the SDK client, and never
logged, echoed into a response, or included in an error message — provider errors are
replaced with a fixed string because upstream error text can quote request headers.
`/api/health` reports `openai-configured` / `anthropic-configured` / `not-configured`.

Both real providers share one prompt and one zod schema (`src/lib/ai/prompts.ts`), so
switching vendor cannot switch guarantees.

### Gated live-provider test

Real API calls cost money, so they are excluded from `npm test` and need two opt-ins:

```bash
AI_LIVE_TEST=1 OPENAI_API_KEY=... npm run test:live
```

Or put both in `.env.local` (gitignored) — `vitest.live.config.ts` loads that file, so the
key never enters shell history or a process listing. Real environment variables win over
the file.

```
AI_LIVE_TEST=1
OPENAI_API_KEY=...
```

Without both the flag and a key, every case is **skipped** and the run prints
`the live provider path was NOT verified by this run`. A skipped run is not evidence.

Failures name their cause: `AI provider request failed` means the call never succeeded
(key, model access or network); `AI output failed validation` means the model answered but
the response did not satisfy the schema. Neither message ever contains the key — the
upstream error text is dropped, because it can quote the `Authorization` header.

## Known limitations

Read these as product constraints, not as bugs to be argued away.

1. **Selection quality is still probabilistic.** The model cannot state a wrong fact, but
   it can select a poorly matched claim, order claims unhelpfully, or omit a relevant one.
   The result is then unhelpful rather than untrue. Nothing here fixes that.
2. **Japanese answers show English source statements.** The corpus was audited in English.
   Server chrome is localised; audited statements are **not translated**, because
   translating them would mean generating factual text. Japanese answers carry a note
   saying so.
3. **Corpus scope.** Five programmes, verified 2026-08-01, overall audit gate
   `NOT READY FOR PRODUCTION`. Per-programme gates and scope warnings ride along with
   every answer and must stay visible in any UI.
4. **Retrieval is lexical.** No embeddings. Three precision problems were found and fixed
   during the adversarial pass:
   - Japanese runs are now cut at hiragana, so grammar (`てください`) no longer scores like
     a keyword. Before this, 「大阪でアパートを借りる方法を教えてください」 retrieved a
     JASSO application claim.
   - Question intent is expanded to corpus vocabulary, so "how much" and 「金額」 reach the
     amount claim. Before this, `J-10` ranked tenth and an amount question was answered
     with eligibility criteria.
   - A relevance floor (`MIN_SCORE`) discards single incidental word matches.

   **Residual, unfixed:** a question can still match on a content word the corpus happens
   to contain. "What is the best ramen in **Tokyo**" retrieves `S-14`, whose excerpt names
   Tokyo as an interview location. The answer is true, cited and clearly scoped — the
   correctness guarantee holds — but it is irrelevant to the question. A live model is
   expected to pick the `related-only` lead or refuse; the mock provider does not. Closing
   this properly needs semantic retrieval, which is deliberately out of scope for now.
5. **Rate limiting depends on deployment** — see below.

## Rate limiting: what it actually is

`/api/chat/scholarships` calls `safeRateLimit('scholarship-chat', ip, 20, 300)` — 20
requests per IP per 5 minutes. Its strength depends entirely on the configured backend
(`src/lib/storage/kv.ts`):

| Backend | Configured by | Shared across instances? |
| --- | --- | --- |
| Upstash Redis (REST) | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | **Yes** |
| Supabase Postgres | `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | **Yes** |
| Memory | neither of the above | **No — process-local** |

**With neither configured the limiter is process-local and is NOT production-grade.** On
serverless each instance keeps its own counter, so the effective limit is 20 × (number of
warm instances), and it resets on every cold start. It is a development convenience, not
a control. `getConfigStatus()` flags this as a `developerMode` issue.

`safeRateLimit` fails **closed** when a durable backend is configured but unreachable
(`allowed: kv.mode === 'memory'`): production denies the request rather than letting an
outage remove the limit.

Configure Upstash or Supabase before treating the endpoint as rate-limited in production.
Per-IP limiting is also not by itself abuse protection — it does not stop a distributed
client, and IP attribution behind shared NAT is coarse.
