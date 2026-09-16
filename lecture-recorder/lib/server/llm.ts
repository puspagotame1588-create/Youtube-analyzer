import { zodTextFormat } from "openai/helpers/zod";
import type { z } from "zod";
import { CONFIG } from "./config";
import { openai, withRetry } from "./openai";

interface JsonOptions {
  model?: string;
  instructions: string;
  input: string;
  schemaName: string;
  maxOutputTokens?: number;
  effort?: "none" | "minimal" | "low" | "medium" | "high";
  label?: string;
}

/** One structured-output call. Returns data already validated against `schema`. */
export async function llmJson<S extends z.ZodType>(
  schema: S,
  opts: JsonOptions,
): Promise<z.infer<S>> {
  const model = opts.model ?? CONFIG.llmModel;
  const response = await withRetry(opts.label ?? "AI 生成", async () => {
    const client = openai();
    return client.responses.parse({
      model,
      instructions: opts.instructions,
      input: opts.input,
      max_output_tokens: opts.maxOutputTokens ?? 16000,
      reasoning: opts.effort ? { effort: opts.effort } : undefined,
      text: { format: zodTextFormat(schema as never, opts.schemaName) },
      store: false,
    });
  });

  if (response.status === "incomplete") {
    throw new Error(
      `AI の出力が途中で切れました (${response.incomplete_details?.reason ?? "不明"})。もう一度お試しください。`,
    );
  }
  const parsed = response.output_parsed as z.infer<S> | null;
  if (!parsed) {
    const refusal = findRefusal(response.output);
    if (refusal) throw new Error(`AI が生成を拒否しました: ${refusal}`);
    throw new Error("AI の出力を解釈できませんでした。");
  }
  return parsed;
}

/** The model can decline instead of answering; that arrives as a content part. */
function findRefusal(output: unknown): string | null {
  if (!Array.isArray(output)) return null;
  for (const item of output) {
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      const p = part as { type?: string; refusal?: string };
      if (p.type === "refusal" && p.refusal) return p.refusal;
    }
  }
  return null;
}

/** One plain-text call, used for short outputs such as a live translation. */
export async function llmText(opts: {
  model?: string;
  instructions: string;
  input: string;
  maxOutputTokens?: number;
  effort?: "none" | "minimal" | "low" | "medium" | "high";
  label?: string;
}): Promise<string> {
  const response = await withRetry(opts.label ?? "AI 生成", async () => {
    const client = openai();
    return client.responses.create({
      model: opts.model ?? CONFIG.fastModel,
      instructions: opts.instructions,
      input: opts.input,
      max_output_tokens: opts.maxOutputTokens ?? 1200,
      reasoning: opts.effort ? { effort: opts.effort } : undefined,
      store: false,
    });
  });
  return (response.output_text ?? "").trim();
}
