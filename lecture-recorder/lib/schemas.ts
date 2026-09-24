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

export const HighlightsSchema = z.object({
  items: z.array(
    z.object({
      /** Index of the transcript line the quote comes from. */
      line: z.number(),
      quote: z.string(),
      cue: z.string(),
      category: z.enum(["exam", "important", "memorize", "assignment", "caution"]),
      point: z.string(),
    }),
  ),
});

/* ----------------------------------------------------------- lecture flow -- */

/**
 * The flow is never requested as one object: a whole lecture in one strict
 * schema comes back truncated. It is built in four smaller stages, each with
 * its own schema, and assembled on the server.
 */

export const EvidenceTextSchema = z.object({
  text: z.string(),
  basis: z.enum(["transcript", "derived_calculation", "ai_explanation"]),
  /** Segment ids such as "s4". Only ids supplied in the request are valid. */
  sourceSegmentIds: z.array(z.string()),
  uncertainty: z.string().nullable(),
});

export const FlowDetailSchema = z.object({
  kind: z.enum([
    "definition",
    "reasoning",
    "example",
    "calculation",
    "qualification",
    "student_question",
  ]),
  label: z.string(),
  content: EvidenceTextSchema,
});

/** Stage 1, once per chunk: what is being taught, in the lecturer's order. */
export const FlowOutlineSchema = z.object({
  topics: z.array(
    z.object({
      /** Unique within this chunk; the server renumbers across the lecture. */
      localId: z.string(),
      title: z.string(),
      segmentIds: z.array(z.string()),
      summary: z.string(),
      notes: z.array(
        z.object({
          kind: z.enum([
            "definition",
            "reasoning",
            "example",
            "calculation",
            "qualification",
            "student_question",
          ]),
          label: z.string(),
          text: z.string(),
          segmentIds: z.array(z.string()),
        }),
      ),
      /** Something finished in a later chunk. Empty string when self-contained. */
      unresolved: z.string(),
    }),
  ),
  /** Greetings, admin, noise: owned segments that teach nothing. */
  nonInstructional: z.array(
    z.object({ segmentId: z.string(), reason: z.string() }),
  ),
});

/** Stage 2: the whole-lecture view, written from the merged outline. */
export const FlowBigPictureSchema = z.object({
  title: z.string(),
  mainQuestions: z.array(EvidenceTextSchema),
  overview: z.array(EvidenceTextSchema),
  chapters: z.array(z.object({ title: z.string(), topicIds: z.array(z.string()) })),
  relationships: z.array(
    z.object({
      fromTopicId: z.string(),
      toTopicId: z.string(),
      type: z.enum([
        "next_topic",
        "prerequisite",
        "example_of",
        "contrast",
        "cause",
        "return_to_topic",
      ]),
      explanation: EvidenceTextSchema,
    }),
  ),
});

/** Stage 3, in batches: the cards the student actually reads. */
export const FlowSectionBatchSchema = z.object({
  sections: z.array(
    z.object({
      topicId: z.string(),
      title: z.string(),
      sourceSegmentIds: z.array(z.string()),
      purpose: EvidenceTextSchema,
      explanation: z.array(EvidenceTextSchema),
      connectionFromPrevious: EvidenceTextSchema.nullable(),
      details: z.array(FlowDetailSchema),
      connectionToNext: EvidenceTextSchema.nullable(),
    }),
  ),
});

/** Stage 4: how the lecture lands, and what it asked of the student. */
export const FlowClosingSchema = z.object({
  conclusion: z.array(EvidenceTextSchema),
  unresolvedQuestions: z.array(EvidenceTextSchema),
  assignments: z.array(
    z.object({
      task: EvidenceTextSchema,
      /** The lecturer's own wording, kept even when it names no date. */
      deadlineOriginal: z.string().nullable(),
      /** Only when the wording and the recording date leave no ambiguity. */
      deadlineISO: z.string().nullable(),
    }),
  ),
  examMentions: z.array(EvidenceTextSchema),
});

export const ChatAnswerSchema = z.object({
  answer: z.string(),
  citations: z.array(z.number()),
  grounded: z.boolean(),
});

export type NotesOutput = z.infer<typeof NotesSchema>;
export type HighlightsOutput = z.infer<typeof HighlightsSchema>;
export type FlashcardsOutput = z.infer<typeof FlashcardsSchema>;
export type ChatAnswer = z.infer<typeof ChatAnswerSchema>;
