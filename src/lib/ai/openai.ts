/**
 * OpenAI provider — server-side only.
 *
 * Uses the official SDK's Responses API with a strict JSON schema, then
 * re-validates with the same zod schema every other provider uses, so provider
 * choice cannot change what the rest of the system is allowed to receive. An
 * output that fails validation is retried once and then throws; the caller
 * turns that into a refusal rather than an unsourced answer.
 *
 * The API key is read from the environment by the caller and passed in. It is
 * held only by the SDK client, and never logged, echoed into a response, or
 * included in an error message — errors from this file carry a fixed string.
 */

import OpenAI from 'openai';
import { type AIProvider, type AiResponse, type AiTask } from './provider';
import { PROMPT_VERSION, parseModelJson, schemaFor, systemFor, userPrompt } from './prompts';
import { jsonSchemaFor } from './json-schema';

/**
 * The model is configuration, not a code decision: set OPENAI_MODEL to pin it.
 * The default is a small, widely available Responses-API model — this task is
 * selection over a supplied list, not open-ended generation, so capability
 * headroom matters less than latency and cost.
 */
export const OPENAI_DEFAULT_MODEL = 'gpt-4.1-mini';
export const openAiModel = (): string => process.env.OPENAI_MODEL?.trim() || OPENAI_DEFAULT_MODEL;

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = openAiModel()) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async run(task: AiTask): Promise<AiResponse> {
    const start = Date.now();
    const schema = schemaFor(task);
    const format = jsonSchemaFor(task);
    // Distinguishes "the call never succeeded" from "the model answered badly".
    // Both messages are fixed strings — an upstream error can quote request
    // headers, so provider error text is never propagated.
    let transportFailed = false;

    for (let attempt = 0; attempt < 2; attempt++) {
      let text: string;
      try {
        const response = await this.client.responses.create({
          model: this.model,
          instructions: systemFor(task),
          input: userPrompt(task),
          max_output_tokens: task.task === 'scholarship-chat' ? 2048 : 1024,
          text: {
            format: {
              type: 'json_schema',
              name: format.name,
              strict: true,
              schema: format.schema,
            },
          },
        });
        text = response.output_text ?? '';
      } catch {
        // Network, auth or quota failure. The message is deliberately not
        // propagated: provider error text can echo request headers.
        transportFailed = true;
        continue;
      }
      transportFailed = false;

      try {
        return {
          provider: 'openai',
          model: this.model,
          promptVersion: PROMPT_VERSION,
          data: schema.parse(parseModelJson(text)),
          latencyMs: Date.now() - start,
        };
      } catch {
        // Malformed or schema-violating output: retry once, then fail.
      }
    }
    // Callers turn either failure into a refusal; the distinction exists so a
    // misconfigured key is diagnosable without inspecting the key.
    throw new Error(
      transportFailed
        ? 'AI provider request failed (check OPENAI_API_KEY, model access and network)'
        : 'AI output failed validation',
    );
  }
}
