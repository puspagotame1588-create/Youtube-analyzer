import { z } from "zod";

/**
 * Schemas shared by the API routes (as strict JSON schemas sent to the model)
 * and the client (to validate what comes back). Keep every field required and
 * avoid .optional()/.default() so strict structured output stays valid.
 */

export const TermSchema = z.object({
  term: z.string(),
  reading: z.string(),
  meaning: z.string(),
  example: z.string(),
});

export const TopicPointSchema = z.object({
  heading: z.string(),
  points: z.array(z.string()),
  startSec: z.number().nullable(),
});

export const AssignmentSchema = z.object({
  what: z.string(),
  due: z.string(),
  quote: z.string(),
});

export const ExamTopicSchema = z.object({
  topic: z.string(),
  basis: z.enum(["teacher", "inferred"]),
  quote: z.string(),
});

export const NotesSchema = z.object({
  title: z.string(),
  overview: z.string(),
  detailed: z.string(),
  topics: z.array(TopicPointSchema),
  terms: z.array(TermSchema),
  assignments: z.array(AssignmentSchema),
  examTopics: z.array(ExamTopicSchema),
  reviewQuestions: z.array(z.object({ question: z.string(), answer: z.string() })),
  unclear: z.array(z.string()),
});

export const FlashcardsSchema = z.object({
  cards: z.array(
    z.object({ front: z.string(), back: z.string(), hint: z.string() }),
  ),
});

export const ProofreadSchema = z.object({
  lines: z.array(z.object({ i: z.number(), text: z.string() })),
});

export const TranslateSchema = z.object({
  lines: z.array(z.object({ i: z.number(), text: z.string() })),
});

export const ChatAnswerSchema = z.object({
  answer: z.string(),
  citations: z.array(z.number()),
  grounded: z.boolean(),
});

export type NotesOutput = z.infer<typeof NotesSchema>;
export type FlashcardsOutput = z.infer<typeof FlashcardsSchema>;
export type ChatAnswer = z.infer<typeof ChatAnswerSchema>;
