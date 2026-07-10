/**
 * AI provider interface. Claude is called only server-side (/api/ai).
 * Without ANTHROPIC_API_KEY the MockAIProvider answers, and every mock
 * response is tagged provider:'mock' so the UI can label development mode —
 * mock output is never presented as a live model response.
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

export const triageResultSchema = z.object({
  category: z.enum(['onboarding', 'schools', 'careers', 'documents', 'technical', 'feedback', 'legal-referral', 'other']),
  escalate: z.boolean(),
  reply: z.string().max(2000),
});

export interface AiResponse<T = unknown> {
  provider: 'anthropic' | 'mock';
  model: string;
  promptVersion: string;
  data: T;
  latencyMs: number;
}

export interface AIProvider {
  run(task: AiTask): Promise<AiResponse>;
}
