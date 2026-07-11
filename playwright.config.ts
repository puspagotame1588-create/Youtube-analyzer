import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'retain-on-failure',
    // Use the environment's pre-installed Chromium instead of downloading.
    launchOptions: { executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    {
      name: 'reduced-motion',
      use: { ...devices['Desktop Chrome'], contextOptions: { reducedMotion: 'reduce' } },
    },
  ],
  webServer: {
    command: 'npx next start -p 3100',
    url: 'http://localhost:3100/en',
    reuseExistingServer: true,
    timeout: 60_000,
    env: {
      // Test credentials: hash of "CV-E2E-TESTCODE" + a strong admin secret so
      // the fail-closed gate and admin login are exercised end to end.
      INVITE_CODE_HASHES: '80925b7e2edafa2ef1994d29b620cf533b41f703b24b609d089bb01b69187a80',
      ADMIN_ACCESS_CODE: 'cv-e2e-Admin-Secret-2026',
    },
  },
});
