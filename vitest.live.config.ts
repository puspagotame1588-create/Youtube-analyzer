/**
 * Config for `npm run test:live` only.
 *
 * Runs the gated live-provider integration tests, which make real API calls.
 * They additionally require AI_LIVE_TEST=1 and a provider key at runtime — see
 * src/lib/ai/provider.live.test.ts — so this config alone does not spend money.
 */

import { defineConfig } from 'vitest/config';
import path from 'node:path';

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
