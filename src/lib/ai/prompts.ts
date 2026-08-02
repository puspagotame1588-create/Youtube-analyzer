/**
 * Prompts and output schemas shared by every real provider.
 *
 * Anthropic and OpenAI answer under identical instructions and validate against
 * identical zod schemas, so switching provider cannot switch guarantees. The
 * grounding guarantee itself does not live here — it lives in the resolver and
 * the server-side composer — but keeping one copy of the contract means a
 * prompt fix cannot land on one provider and miss the other.
 */

import {
  explainResultSchema,
  intentResultSchema,
  scholarshipChatResultSchema,
  triageResultSchema,
  SCHOLARSHIP_LEADS,
  type AiTask,
} from './provider';

export const PROMPT_VERSION = 'v2';

export const SYSTEM = `You are the explanation layer of CareerVerse, a career-information product for foreign students in Japan.
Hard rules:
- You never invent scores, statistics, tuition amounts, or probabilities. Numbers come only from the structured input.
- Visa/residence topics are general educational information, never guarantees; always note that final eligibility depends on individual circumstances and official review.
- Reply ONLY with a single JSON object matching the requested shape. No markdown, no preamble.`;

/**
 * The scholarship bot answers under a stricter contract than the rest of the
 * product: it is a claim SELECTOR over an audited corpus, not a writer. It does
 * not compose the answer — the server does, from the claims it selects. The
 * instructions still state the answering rules because a model that selects
 * badly produces a useless answer, but a model that ignores them cannot produce
 * a wrong one: there is no free-text field in the output shape.
 */
export const SCHOLARSHIP_SYSTEM = `You are the CareerVerse Scholarship Source Assistant.

Answer only from the retrieved official-source claims provided to you.

Rules:
- Do not use memory or general knowledge.
- Every factual statement must be supported by a retrieved confirmed claim.
- Never infer eligibility, deadlines, amounts, documents, or application routes.
- Never combine requirements from different scholarship programmes.
- Clearly label information that the official sources did not publish or that verification marked unconfirmed.
- If the retrieved evidence does not support an answer, refuse.
- If the sources conflict, surface the conflict and do not choose silently.
- Preserve important conditions and exceptions.
- Include source references using the provided claim IDs.

How your output is used:
- You do NOT write the answer. You SELECT, GROUP and ORDER claim ids, and the
  application renders the audited statements behind those ids, in your order,
  under fixed wording it owns. You cannot write a sentence, so select carefully:
  the ids you choose ARE the answer.
- Order claimIds so the claim that most directly answers the question comes first.
- Select only the claims that bear on the question. Padding the list with
  loosely related claims makes the answer worse.

Output format:
- Reply ONLY with a single JSON object. No markdown, no preamble.
- Shape: {"refused": boolean, "sections": [{"programme": string, "lead": string, "claimIds": string[], "unpublishedIds": string[]}]}
- One section per programme. NEVER put one programme's claim id in another programme's section.
- claimIds may only contain ids from that programme's CONFIRMED list.
- unpublishedIds may only contain ids from that programme's NOT PUBLISHED list.
- "lead" is the connective sentence the application will print, chosen from exactly these keys:
${SCHOLARSHIP_LEADS.map(
  (k) =>
    `    "${k}" — ${
      k === 'direct'
        ? 'the confirmed claims answer the question'
        : k === 'partial'
          ? 'they answer only part of it'
          : k === 'related-only'
            ? 'they do not address it, and you are showing the nearest confirmed claims'
            : 'the confirmed claims are inconsistent with each other'
    }`,
).join('\n')}
- Do not write URLs, excerpts, amounts, dates or any prose — cite by claim id only.
- If nothing supports an answer, return {"refused": true, "sections": []}.`;

export const systemFor = (task: AiTask): string =>
  task.task === 'scholarship-chat' ? SCHOLARSHIP_SYSTEM : SYSTEM;

export function userPrompt(task: AiTask): string {
  switch (task.task) {
    case 'explain-route':
      return `Explain this simulation result to the user in ${task.locale === 'ja' ? 'Japanese' : 'English'} (3-5 sentences, warm and clear, no invented numbers).
Input: ${JSON.stringify({ routeName: task.routeName, factors: task.factors, feasibility: task.feasibility, evidence: task.evidence, closeCall: task.closeCall })}
Reply shape: {"explanation": string}`;
    case 'intent':
      return `Classify this career goal into a field and preferred location.
Goal: ${JSON.stringify(task.goalText)}
Fields: business | it | hospitality | foodservice | realestate. Locations: tokyo | yokohama | chiba | saitama | kanto-any.
Reply shape: {"field": string, "location": string, "confidence": "low"|"medium"|"high", "needsConfirmation": true}`;
    case 'scholarship-chat': {
      const programmes = task.context.programmes
        .map((p) => {
          const confirmed = p.confirmed.length
            ? p.confirmed.map((c) => `  [${c.id}] ${c.statement}\n      OFFICIAL EXCERPT: ${c.excerpt}`).join('\n')
            : '  (none)';
          const unpublished = p.unpublished.length
            ? p.unpublished.map((c) => `  [${c.id}] ${c.statement}\n      AUDITOR NOTE: ${c.excerpt}`).join('\n')
            : '  (none)';
          return `PROGRAMME ${p.key} — ${p.labelEn} / ${p.labelJa}\n CONFIRMED (may be cited as fact, by claim id):\n${confirmed}\n NOT PUBLISHED by any official source (may ONLY be listed under unpublishedIds, never cited as fact):\n${unpublished}`;
        })
        .join('\n\n');
      const history = task.conversation?.length
        ? `\nPrior turns (for resolving what the question refers to ONLY — never a source of facts):\n${task.conversation
            .map((m) => `${m.role}: ${m.content}`)
            .join('\n')}\n`
        : '';
      return `Locale: ${task.locale === 'ja' ? 'Japanese' : 'English'}.
${history}
Question: ${JSON.stringify(task.message)}

Retrieved claims — this is your ENTIRE factual world:

${programmes}`;
    }
    case 'support-triage':
      return `Triage this support message (locale ${task.locale}). If it asks for individualized visa/legal interpretation, category is "legal-referral" and escalate=true, and the reply must recommend a qualified professional.
Message: ${JSON.stringify(task.message)}
Categories: onboarding|schools|careers|documents|technical|feedback|legal-referral|other.
Reply shape: {"category": string, "escalate": boolean, "reply": string (in the user's locale)}`;
  }
}

export const schemaFor = (task: AiTask) =>
  task.task === 'explain-route'
    ? explainResultSchema
    : task.task === 'intent'
      ? intentResultSchema
      : task.task === 'scholarship-chat'
        ? scholarshipChatResultSchema
        : triageResultSchema;

/** Strips a ```json fence a model may add despite being told not to. */
export const parseModelJson = (text: string): unknown =>
  JSON.parse(text.trim().replace(/^```json?\s*|\s*```$/g, ''));
