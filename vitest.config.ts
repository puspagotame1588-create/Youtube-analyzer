import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // Live-provider tests hit a real API and cost money. They are opt-in via
    // `npm run test:live`, never part of `npm test`.
    exclude: ['src/**/*.live.test.ts', 'node_modules/**'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
