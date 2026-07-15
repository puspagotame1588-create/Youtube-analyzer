import { expect, test, type Page } from '@playwright/test';

/**
 * Evidence-backed decision report smoke test (runs under desktop + mobile[Pixel 7]).
 * Drives create → 5 questions → universe with a populated result, then asserts
 * the decision report renders, has no horizontal overflow, keeps eligibility
 * separate from the score, and that the 3D "Visual route map" is present and
 * secondary. Also checks the Japanese layout of the populated report.
 */

async function createFuture(page: Page): Promise<void> {
  await page.goto('/en/invite');
  await page.getByLabel('Invite code').fill('CV-E2E-TESTCODE');
  await page.getByRole('button', { name: 'Enter the beta' }).click();
  await page.waitForURL('**/create');
  await page.getByLabel(/What future do you want to build/).fill('I want to work in IT in Tokyo');
  await page.getByRole('button', { name: 'Begin' }).click();
  await expect(page.getByText('Question 1 of 5', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next →' }).click();
  await page.getByRole('button', { name: 'High school graduate' }).click();
  await page.getByRole('button', { name: 'Next →' }).click();
  await page.getByRole('button', { name: 'N3', exact: true }).click();
  await page.getByRole('button', { name: 'Next →' }).click();
  await page.getByRole('button', { name: '¥1,000,000 – ¥2,000,000' }).click();
  await page.getByRole('button', { name: 'Next →' }).click();
  await page.getByRole('button', { name: 'Simulate my futures' }).click();
  await page.waitForURL('**/universe');
}

test('decision report renders above a secondary 3D map, with no horizontal overflow', async ({ page }) => {
  await createFuture(page);

  // Phase 1 — decision summary (recommendation OR the honest "no eligible route" note).
  await expect(page.getByText(/Current recommendation|No route is currently confirmed eligible/).first()).toBeVisible();
  // A score /100 is shown.
  await expect(page.getByText('score/100').first()).toBeVisible();

  // Phase 5 + 7 + 3D sections exist.
  await expect(page.getByRole('heading', { name: 'Side-by-side comparison' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What would change the result?' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Visual route map' })).toBeVisible();

  // Phase 4 — expand a route's full evidence and confirm the school-scope honesty note.
  await page.getByRole('button', { name: 'View full evidence' }).first().click();
  await expect(page.getByText(/Can you take this route\?/).first()).toBeVisible();
  await expect(page.getByText(/program-specific applicability not verified/i).first()).toBeVisible();

  // No horizontal page overflow (critical on mobile/Pixel 7).
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test('populated decision report also renders in Japanese', async ({ page }) => {
  await createFuture(page); // result is stored per-origin, so /ja shows it too
  await page.goto('/ja/universe');
  await expect(page.getByText(/現在のおすすめ|確実に適格と判定できるルートがありません/).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: '何が結果を変えるか' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'ビジュアル・ルートマップ' })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
