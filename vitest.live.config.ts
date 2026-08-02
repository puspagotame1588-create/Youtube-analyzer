/**
 * Config for `npm run test:live` only.
 *
 * Runs the gated live-provider integration tests, which make real API calls.
 * They additionally require AI_LIVE_TEST=1 and a provider key at runtime — see
 * src/lib/ai/provider.live.test.ts — so this config alone does not spend money.
 */

import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import path from 'node:path';

/**
 * Loads .env.local (gitignored) so a key can live in a file instead of being
 * pasted into a shell, where it would land in shell history and process
 * listings. Values already in the environment win. Nothing here reads or
 * prints a value — it only makes them available to the provider client.
 */
const fileEnv = loadEnv('live', process.cwd(), '');
for (const name of ['OPENAI_API_KEY', 'OPENAI_MODEL', 'ANTHROPIC_API_KEY', 'AI_LIVE_TEST']) {
  if (!process.env[name] && fileEnv[name]) process.env[name] = fileEnv[name];
}

export default defineConfig({
  test: {
    include: ['src/**/*.live.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
