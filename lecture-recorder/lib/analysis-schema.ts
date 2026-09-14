import { z } from "zod";

/** A piece of text in both languages. */
export const BilingualSchema = z.object({
  ja: z.string(),
  en: z.string(),
});

/**
 * Shape of the post-lecture analysis. Shared by the API route (as the
 * structured-output schema sent to Claude) and the client (to validate what
 * comes back before it is stored).
 */
export const AnalysisSchema = z.object({
  /** Short descriptive title for the lecture, inferred from content. */
  title: BilingualSchema,
  /** 2–4 paragraph summary of the whole lecture. */
  summary: BilingualSchema,
  /** The main points, ordered by importance. Each is one or two sentences. */
  mainPoints: z.array(BilingualSchema),
  /** Topics in the order the teacher covered them, with a short detail each. */
  topics: z.array(
    z.object({
      heading: BilingualSchema,
      detail: BilingualSchema,
    }),
  ),
});

export type Analysis = z.infer<typeof AnalysisSchema>;
export type Bilingual = z.infer<typeof BilingualSchema>;

/** Input accepted by POST /api/analyze. */
export const AnalyzeRequestSchema = z.object({
  course: z.string(),
  teacher: z.string().optional().default(""),
  lectureNumber: z.number().int().positive(),
  date: z.string(),
  title: z.string().optional().default(""),
  segments: z
    .array(
      z.object({
        startSec: z.number(),
        ja: z.string(),
        en: z.string().optional().default(""),
      }),
    )
    .min(1),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

/** Input accepted by POST /api/translate. */
export const TranslateRequestSchema = z.object({
  ja: z.string().min(1),
  prevJa: z.string().optional().default(""),
  prevEn: z.string().optional().default(""),
});
