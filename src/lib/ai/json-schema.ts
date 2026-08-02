/**
 * JSON Schemas for OpenAI structured outputs.
 *
 * These mirror the zod schemas in ./provider. zod remains the authority — every
 * provider response is parsed with it regardless of what the API returned — but
 * declaring the shape to the Responses API means the constraint is enforced at
 * generation time too. For the scholarship task in particular, `lead` is an
 * enum and there is no string field: the model is structurally prevented from
 * emitting a factual sentence before validation even runs.
 *
 * OpenAI strict mode requires `additionalProperties: false` on every object and
 * every property listed in `required`; optional fields are expressed as a union
 * with null rather than by omission.
 */

import {
  SCHOLARSHIP_LEADS,
  MAX_CLAIM_IDS_PER_SECTION,
  MAX_SECTIONS_PER_ANSWER,
  type AiTask,
} from './provider';

export interface JsonSchemaFormat {
  name: string;
  schema: Record<string, unknown>;
}

const claimIdArray = {
  type: 'array',
  maxItems: MAX_CLAIM_IDS_PER_SECTION,
  items: { type: 'string', maxLength: 12 },
} as const;

const SCHOLARSHIP_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['refused', 'sections'],
  properties: {
    refused: { type: 'boolean' },
    sections: {
      type: 'array',
      maxItems: MAX_SECTIONS_PER_ANSWER,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['programme', 'lead', 'claimIds', 'unpublishedIds'],
        properties: {
          programme: { type: 'string', maxLength: 40 },
          lead: { type: 'string', enum: [...SCHOLARSHIP_LEADS] },
          claimIds: claimIdArray,
          unpublishedIds: claimIdArray,
        },
      },
    },
  },
};

const EXPLAIN_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['explanation'],
  properties: { explanation: { type: 'string' } },
};

const INTENT_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['field', 'location', 'confidence', 'needsConfirmation'],
  properties: {
    field: { type: 'string', enum: ['business', 'it', 'hospitality', 'foodservice', 'realestate'] },
    location: { type: 'string', enum: ['tokyo', 'yokohama', 'chiba', 'saitama', 'kanto-any'] },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    needsConfirmation: { type: 'boolean' },
  },
};

const TRIAGE_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['category', 'escalate', 'reply'],
  properties: {
    category: {
      type: 'string',
      enum: ['onboarding', 'schools', 'careers', 'documents', 'technical', 'feedback', 'legal-referral', 'other'],
    },
    escalate: { type: 'boolean' },
    reply: { type: 'string' },
  },
};

export function jsonSchemaFor(task: AiTask): JsonSchemaFormat {
  switch (task.task) {
    case 'scholarship-chat':
      return { name: 'scholarship_claim_selection', schema: SCHOLARSHIP_SCHEMA };
    case 'explain-route':
      return { name: 'route_explanation', schema: EXPLAIN_SCHEMA };
    case 'intent':
      return { name: 'career_intent', schema: INTENT_SCHEMA };
    case 'support-triage':
      return { name: 'support_triage', schema: TRIAGE_SCHEMA };
  }
}
