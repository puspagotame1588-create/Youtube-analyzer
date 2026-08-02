/**
 * Anthropic provider — server-side only. Prompts and output schemas are shared
 * with the OpenAI provider (./prompts), so the two answer under one contract.
 * Structured outputs are validated with zod; invalid outputs are retried once,
 * then the request fails cleanly and the caller refuses rather than fabricating.
 *
 * The API key is passed in by the caller, held only by the SDK client, and
 * never logged or included in an error message.
 */

import Anthropic from '@anthropic-ai/sdk';
import { type AIProvider, type AiResponse, type AiTask } from './provider';
import { PROMPT_VERSION, parseModelJson, schemaFor, systemFor, userPrompt } from './prompts';

export const ANTHROPIC_MODEL = 'claude-sonnet-5';
const MODEL = ANTHROPIC_MODEL;

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async run(task: AiTask): Promise<AiResponse> {
    const start = Date.now();
    const schema = schemaFor(task);

    for (let attempt = 0; attempt < 2; attempt++) {
      let text: string;
      try {
        const message = await this.client.messages.create({
          model: MODEL,
          max_tokens: task.task === 'scholarship-chat' ? 2048 : 1024,
          system: systemFor(task),
          messages: [{ role: 'user', content: userPrompt(task) }],
        });
        text = message.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('');
      } catch {
        // Transport/auth/quota failure; message deliberately not propagated.
        continue;
      }

      try {
        return {
          provider: 'anthropic',
          model: MODEL,
          promptVersion: PROMPT_VERSION,
          data: schema.parse(parseModelJson(text)),
          latencyMs: Date.now() - start,
        };
      } catch {
        // retry once with the same prompt; fall through to error after 2 tries
      }
    }
    throw new Error('AI output failed validation');
  }
}
