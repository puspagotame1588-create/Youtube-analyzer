/**
 * AI provider interface. Models are called only server-side (/api/ai,
 * /api/chat/scholarships). Provider choice is resolved by `selectProvider()`
 * in ./select: OpenAI when OPENAI_API_KEY is present, Anthropic when only
 * ANTHROPIC_API_KEY is, and the MockAIProvider only when no real key exists or
 * a test selects it explicitly. Every mock response is tagged provider:'mock'
 * so the UI can label development mode — mock output is never presented as a
 * live model response.
 */

import { z } from 'zod';

export const aiTaskSchema = z.discriminatedUnion('task', [
  z.object({
    task: z.literal('explain-route'),
    locale: z.enum(['en', 'ja']),
    routeName: z.string().max(200),
    factors: z.array(
      z.object({ factor: z.string(), score: z.number(), weight: z.number(), reason: z.string() }),
    ).max(10),
    feasibility: z.string(),
    evidence: z.string(),
    closeCall: z.boolean(),
  }),
  z.object({
    task: z.literal('intent'),
    locale: z.enum(['en', 'ja']),
    goalText: z.string().min(1).max(500),
  }),
  z.object({
    task: z.literal('scholarship-chat'),
    locale: z.enum(['en', 'ja']),
    message: z.string().min(1).max(1000),
    /** Prior turns, for pronoun/follow-up resolution only — never a fact source. */
    conversation: z
      .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(4000) }))
      .max(10)
      .optional(),
    /**
     * The ONLY factual material the model may use. Assembled server-side by
     * buildScholarshipContext() from the audited corpus.
     */
    context: z.object({
      programmes: z.array(
        z.object({
          key: z.string(),
          labelEn: z.string(),
          labelJa: z.string(),
          confirmed: z.array(
            z.object({ id: z.string(), statement: z.string(), excerpt: z.string() }),
          ),
          unpublished: z.array(
            z.object({ id: z.string(), statement: z.string(), excerpt: z.string() }),
          ),
        }),
      ),
    }),
  }),
  z.object({
    task: z.literal('support-triage'),
    locale: z.enum(['en', 'ja']),
    message: z.string().min(1).max(2000),
  }),
]);

export type AiTask = z.infer<typeof aiTaskSchema>;

export const intentResultSchema = z.object({
  field: z.enum(['business', 'it', 'hospitality', 'foodservice', 'realestate']),
  location: z.enum(['tokyo', 'yokohama', 'chiba', 'saitama', 'kanto-any']),
  confidence: z.enum(['low', 'medium', 'high']),
  /** an assumption the user must confirm before it affects scoring */
  needsConfirmation: z.boolean(),
});

export const explainResultSchema = z.object({ explanation: z.string().min(1).max(4000) });

/**
 * Non-factual connective phrases the model may choose between. This is the
 * model's ENTIRE control over wording. Each key maps, server-side, to a fixed
 * locale-specific sentence in `./scholarship-answer`; none of them can carry an
 * amount, a date, an eligibility rule, a deadline, a status or a programme
 * name, because the model supplies the key and never the sentence.
 */
export const SCHOLARSHIP_LEADS = ['direct', 'partial', 'related-only', 'conflict'] as const;
export type ScholarshipLead = (typeof SCHOLARSHIP_LEADS)[number];

/** Structured limits, applied per section and per claim — never a character cut. */
export const MAX_CLAIM_IDS_PER_SECTION = 8;
export const MAX_SECTIONS_PER_ANSWER = 3;

/**
 * The scholarship bot's reply.
 *
 * There is no free-text field. The model selects, groups and orders claim ids
 * and picks one connective key; every word the user is shown is then composed
 * server-side from the audited corpus. A model cannot state a wrong amount or a
 * wrong date here because this schema gives it nowhere to write one — and zod
 * strips unknown keys, so a model that emits an `answer` string anyway has it
 * discarded before the resolver ever runs.
 */
export const scholarshipChatResultSchema = z.object({
  refused: z.boolean().optional(),
  sections: z
    .array(
      z.object({
        programme: z.string().max(40),
        lead: z.enum(SCHOLARSHIP_LEADS).optional(),
        claimIds: z.array(z.string().max(12)).max(MAX_CLAIM_IDS_PER_SECTION),
        unpublishedIds: z.array(z.string().max(12)).max(MAX_CLAIM_IDS_PER_SECTION).optional(),
      }),
    )
    .max(MAX_SECTIONS_PER_ANSWER),
});

export const triageResultSchema = z.object({
  category: z.enum(['onboarding', 'schools', 'careers', 'documents', 'technical', 'feedback', 'legal-referral', 'other']),
  escalate: z.boolean(),
  reply: z.string().max(2000),
});

export type ProviderName = 'openai' | 'anthropic' | 'mock';

export interface AiResponse<T = unknown> {
  provider: ProviderName;
  model: string;
  promptVersion: string;
  data: T;
  latencyMs: number;
}

export interface AIProvider {
  run(task: AiTask): Promise<AiResponse>;
}
