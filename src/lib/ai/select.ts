/**
 * Provider selection.
 *
 * One rule, in one place, so every route agrees on which model answered:
 *
 *   AI_PROVIDER=mock   → mock, explicitly (tests and local development)
 *   OPENAI_API_KEY     → OpenAI
 *   ANTHROPIC_API_KEY  → Anthropic
 *   neither            → mock, and the response is labeled as such
 *
 * `chooseProvider()` is pure and takes the environment as an argument so the
 * precedence can be tested without touching process.env. Keys are only ever
 * tested for presence here; their values are read once, in `getProvider()`,
 * and handed straight to the SDK client.
 */

import type { AIProvider, ProviderName } from './provider';
import { MockAIProvider } from './mock';

export interface ProviderEnv extends Record<string, string | undefined> {
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  AI_PROVIDER?: string;
}

/** Which provider the given environment selects. Presence only — never values. */
export function chooseProvider(env: ProviderEnv = process.env): ProviderName {
  if (env.AI_PROVIDER === 'mock') return 'mock';
  if (env.OPENAI_API_KEY?.trim()) return 'openai';
  if (env.ANTHROPIC_API_KEY?.trim()) return 'anthropic';
  return 'mock';
}

/** True when a real model answered, i.e. the reply is not a development stand-in. */
export const isLiveProvider = (name: ProviderName): boolean => name !== 'mock';

export interface SelectedProvider {
  provider: AIProvider;
  name: ProviderName;
  live: boolean;
}

/**
 * Instantiates the selected provider. SDK modules are imported lazily so that a
 * deployment configured for one vendor never loads the other's client.
 */
export async function getProvider(env: ProviderEnv = process.env): Promise<SelectedProvider> {
  const name = chooseProvider(env);

  if (name === 'openai') {
    const { OpenAIProvider } = await import('./openai');
    return { provider: new OpenAIProvider(env.OPENAI_API_KEY!), name, live: true };
  }
  if (name === 'anthropic') {
    const { AnthropicProvider } = await import('./anthropic');
    return { provider: new AnthropicProvider(env.ANTHROPIC_API_KEY!), name, live: true };
  }
  return { provider: new MockAIProvider(), name, live: false };
}
