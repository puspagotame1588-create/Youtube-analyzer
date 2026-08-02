/**
 * Anthropic provider — server-side only. Structured outputs are validated with
 * zod; invalid outputs are retried once, then the request fails cleanly (the
 * caller falls back to the labeled mock provider rather than fabricating).
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  explainResultSchema,
  intentResultSchema,
  scholarshipChatResultSchema,
  triageResultSchema,
  type AIProvider,
  type AiResponse,
  type AiTask,
} from './provider';

export const ANTHROPIC_MODEL = 'claude-sonnet-5';
const MODEL = ANTHROPIC_MODEL;
const PROMPT_VERSION = 'v1';

const SYSTEM = `You are the explanation layer of CareerVerse, a career-information product for foreign students in Japan.
Hard rules:
- You never invent scores, statistics, tuition amounts, or probabilities. Numbers come only from the structured input.
- Visa/residence topics are general educational information, never guarantees; always note that final eligibility depends on individual circumstances and official review.
- Reply ONLY with a single JSON object matching the requested shape. No markdown, no preamble.`;

/**
 * The scholarship bot answers under a stricter contract than the rest of the
 * product: it is a source-quoting assistant over an audited corpus, not an
 * advisor. It is given its entire factual world in the prompt and may use
 * nothing else.
 */
const SCHOLARSHIP_SYSTEM = `You are the CareerVerse Scholarship Source Assistant.

Answer only from the retrieved official-source claims provided to you.

Rules:
- Do not use memory or general knowledge.
- Every factual statement must be supported by a retrieved confirmed claim.
- Never infer eligibility, deadlines, amounts, documents, or application routes.
- Never combine requirements from different scholarship programmes.
- Clearly label information that the official sources did not publish or that verification marked unconfirmed.
- If the retrieved evidence does not support an answer, say: "I could not confirm this from the available official sources."
- If the sources conflict, explain the conflict and do not choose silently.
- Preserve important conditions and exceptions.
- Answer in the requested locale.
- Include source references using the provided claim IDs.
- Remind the user to confirm the latest details on the official page before applying.

Output format:
- Reply ONLY with a single JSON object. No markdown, no preamble.
- Shape: {"refused": boolean, "sections": [{"programme": string, "answer": string, "claimIds": string[], "unpublishedIds": string[]}]}
- One section per programme. NEVER put one programme's claim id in another programme's section.
- claimIds may only contain ids from that programme's CONFIRMED list.
- unpublishedIds may only contain ids from that programme's NOT PUBLISHED list.
- Do not write URLs — cite by claim id only; the application resolves ids to official sources.
- If nothing supports an answer, return {"refused": true, "sections": []}.`;

const systemFor = (task: AiTask): string =>
  task.task === 'scholarship-chat' ? SCHOLARSHIP_SYSTEM : SYSTEM;

function userPrompt(task: AiTask): string {
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
          return `PROGRAMME ${p.key} — ${p.labelEn} / ${p.labelJa}\n CONFIRMED (may be stated as fact, with the claim id):\n${confirmed}\n NOT PUBLISHED by any official source (may ONLY be reported as unpublished, never as fact):\n${unpublished}`;
        })
        .join('\n\n');
      const history = task.conversation?.length
        ? `\nPrior turns (for resolving what the question refers to ONLY — never a source of facts):\n${task.conversation
            .map((m) => `${m.role}: ${m.content}`)
            .join('\n')}\n`
        : '';
      return `Locale: ${task.locale === 'ja' ? 'Japanese' : 'English'}. Answer in this language.
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

const schemaFor = (task: AiTask) =>
  task.task === 'explain-route'
    ? explainResultSchema
    : task.task === 'intent'
      ? intentResultSchema
      : task.task === 'scholarship-chat'
        ? scholarshipChatResultSchema
        : triageResultSchema;

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async run(task: AiTask): Promise<AiResponse> {
    const start = Date.now();
    const schema = schemaFor(task);

    for (let attempt = 0; attempt < 2; attempt++) {
      const message = await this.client.messages.create({
        model: MODEL,
        max_tokens: task.task === 'scholarship-chat' ? 2048 : 1024,
        system: systemFor(task),
        messages: [{ role: 'user', content: userPrompt(task) }],
      });
      const text = message.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');
      try {
        const json: unknown = JSON.parse(text.trim().replace(/^```json?\s*|\s*```$/g, ''));
        const data = schema.parse(json);
        return {
          provider: 'anthropic',
          model: MODEL,
          promptVersion: PROMPT_VERSION,
          data,
          latencyMs: Date.now() - start,
        };
      } catch {
        // retry once with the same prompt; fall through to error after 2 tries
      }
    }
    throw new Error('AI output failed validation');
  }
}
