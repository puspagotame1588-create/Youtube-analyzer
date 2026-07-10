import { expect, test } from '@playwright/test';

/**
 * Private-beta vertical slice, end to end:
 * landing → create future → 5 questions → universe → why-this-result →
 * change assumption (branch + explanation) → account → save → schools →
 * tracker → action plan → support.
 */

test('complete beta journey (EN)', async ({ page }) => {
  // 1. Cinematic landing
  await page.goto('/en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('possible futures');
  await page.getByRole('link', { name: 'Create Your First Future' }).first().click();

  // 1b. Invitation-only gate (app-level, hash-checked server-side)
  await page.waitForURL('**/invite**');
  await expect(page.getByRole('heading', { name: 'Invitation-only private beta' })).toBeVisible();
  await page.getByLabel('Invite code').fill('KANTO-BETA');
  await page.getByRole('button', { name: 'Enter the beta' }).click();
  await page.waitForURL('**/create');

  // 2. Future Creation Portal
  await expect(page.getByRole('heading', { name: /What future do you want to build/ })).toBeVisible();
  await page.getByLabel(/What future do you want to build/).fill('I want to work in IT in Tokyo');
  await page.getByRole('button', { name: 'Begin' }).click();

  // 3. Five questions (field is pre-suggested from the goal)
  await expect(page.getByText('Question 1 of 5', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /IT & software/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Next →' }).click();
  await page.getByRole('button', { name: 'High school graduate' }).click();
  await page.getByRole('button', { name: 'Next →' }).click();
  await page.getByRole('button', { name: 'N3', exact: true }).click();
  await page.getByRole('button', { name: 'Next →' }).click();
  await page.getByRole('button', { name: '¥1,000,000 – ¥2,000,000' }).click();
  await page.getByRole('button', { name: 'Next →' }).click();
  await expect(page.getByRole('button', { name: /Tokyo/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Simulate my futures' }).click();

  // 4-5. Universe with parallel routes
  await page.waitForURL('**/universe');
  await expect(page.getByRole('heading', { name: 'Simulation Universe' })).toBeVisible();

  // 6. Why this result?
  await page.getByRole('button', { name: 'Why this result?' }).first().click();
  await expect(page.getByText('Factor scores (expected case)').first()).toBeVisible();
  await expect(page.getByText(/Scores are computed deterministically/).first()).toBeVisible();

  // 7-9. Change an assumption → explained branch change
  await page.getByLabel('Education budget').selectOption({ index: 4 });
  await expect(page.getByText('What changed and why:')).toBeVisible();

  // 10. Create an account (beta code)
  await page.getByRole('button', { name: 'Create account →' }).click();
  await page.waitForURL('**/auth');
  await page.getByLabel('Email').fill('tester@example.com');
  await page.getByLabel('Display name').fill('Tester');
  await page.getByLabel('Beta access code').fill('KANTO-BETA');
  await page.getByText('I confirm that I am 18 or older.').click();
  await page.getByRole('button', { name: 'Create account' }).click();

  // 11. Save the simulation
  await page.waitForURL('**/universe');
  await page.getByLabel('Simulation name').fill('My IT future');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Saved ✓')).toBeVisible();

  // 12. Compare two schools
  await page.goto('/en/schools/compare');
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByText('First-year cost')).toBeVisible();

  // 13. Add a school to the tracker
  await page.goto('/en/schools/sch-akiba-it-college');
  await page.getByRole('button', { name: 'Add to application tracker' }).click();
  await expect(page.getByText('Added to your application tracker.')).toBeVisible();
  await page.goto('/en/tracker');
  await expect(page.getByText('Akihabara IT College')).toBeVisible();

  // 14. Bilingual action plan
  await page.goto('/en/plan');
  await expect(page.getByRole('heading', { name: 'Action Plan' })).toBeVisible();
  await expect(page.getByText('Next 12 months')).toBeVisible();
  await expect(page.getByText('これからの12か月')).toBeVisible();

  // 15. Support
  await page.goto('/en/support');
  await page.getByLabel('Message').fill('How do I compare schools?');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText(/Reference number: CV-/)).toBeVisible();
});

test('Japanese journey renders localized layout', async ({ page }) => {
  await page.goto('/ja');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('日本での、あなたの未来');
  await page.getByRole('link', { name: 'はじめての未来をつくる' }).first().click();
  await page.waitForURL('**/invite**');
  await expect(page.getByRole('heading', { name: '招待制プライベートベータ' })).toBeVisible();
});

test('gate blocks personalized routes but leaves public pages open', async ({ page }) => {
  await page.goto('/en/universe');
  await page.waitForURL('**/invite**');
  await page.goto('/en/schools');
  await expect(page.getByRole('heading', { name: 'School Galaxy' })).toBeVisible();
  await page.goto('/en/roadmap');
  await expect(page.getByRole('heading', { name: 'Japan Settlement Roadmap' })).toBeVisible();
  await page.goto('/en/sources');
  await expect(page.getByRole('heading', { name: 'Data Sources' })).toBeVisible();
});

test('wrong invite codes fail with a generic message', async ({ page }) => {
  await page.goto('/en/invite');
  await page.getByLabel('Invite code').fill('WRONG-CODE');
  await page.getByRole('button', { name: 'Enter the beta' }).click();
  await expect(page.getByText(/That code can.t be used/)).toBeVisible();
});

test('admin can sign in and manage data', async ({ page }) => {
  await page.goto('/en/admin');
  await page.getByLabel('Access code').fill('careerverse-admin');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('You are signed in')).toBeVisible();
  await page.goto('/en/admin/dashboard');
  await expect(page.getByRole('heading', { name: 'Admin — Dashboard' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Data records' })).toBeVisible();
  await page.goto('/en/admin/review');
  await expect(page.getByRole('heading', { name: 'Admin — Review queue' })).toBeVisible();
});

test('admin area rejects wrong codes', async ({ page }) => {
  await page.goto('/en/admin');
  await page.getByLabel('Access code').fill('wrong-code');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Invalid access code.')).toBeVisible();
});
