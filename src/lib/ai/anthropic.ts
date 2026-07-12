/**
 * Anthropic provider — server-side only. Structured outputs are validated with
 * zod; invalid outputs are retried once, then the request fails cleanly (the
 * caller falls back to the labeled mock provider rather than fabricating).
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  explainResultSchema,
  intentResultSchema,
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
        max_tokens: 1024,
        system: SYSTEM,
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
