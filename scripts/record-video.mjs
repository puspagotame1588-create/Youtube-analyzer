/**
 * Records a video of the full simulation interaction for release reports:
 * invite gate → portal → five questions → 3D universe → why-this-result →
 * assumption change (branch update) → future rewind → milestone layer.
 * Usage: server on :3100, then `node scripts/record-video.mjs [outDir]`.
 */
import { chromium } from '@playwright/test';

const out = process.argv[2] ?? './video-out';
const base = 'http://localhost:3100';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: out, size: { width: 1280, height: 800 } },
});
const page = await ctx.newPage();

await page.goto(`${base}/en`);
await page.waitForTimeout(3500);
await page.getByRole('link', { name: 'Create Your First Future' }).first().click();
await page.waitForURL('**/invite**');
await page.getByLabel('Invite code').fill('KANTO-BETA');
await page.getByRole('button', { name: 'Enter the beta' }).click();
await page.waitForURL('**/create');
await page.waitForTimeout(800);
await page.getByLabel(/What future do you want to build/).fill('I want to work in IT in Tokyo');
await page.waitForTimeout(600);
await page.getByRole('button', { name: 'Begin' }).click();
await page.getByText('Question 1 of 5', { exact: true }).waitFor();
await page.waitForTimeout(700);
await page.getByRole('button', { name: 'Next →' }).click();
await page.getByRole('button', { name: 'High school graduate' }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Next →' }).click();
await page.getByRole('button', { name: 'N3', exact: true }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Next →' }).click();
await page.getByRole('button', { name: '¥1,000,000 – ¥2,000,000' }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Next →' }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Simulate my futures' }).click();
await page.waitForURL('**/universe');
await page.waitForTimeout(4500); // ribbons grow

await page.getByRole('button', { name: 'Why this result?' }).first().click();
await page.waitForTimeout(1800);
await page.getByRole('button', { name: 'Why this result?' }).first().click();

// assumption change → branch regrow + explanation
await page.getByLabel('Education budget').selectOption({ index: 4 });
await page.waitForTimeout(3500);

// future rewind scrub
const slider = page.locator('#rewind');
await slider.focus();
for (let i = 0; i < 30; i++) {
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(60);
}
await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) {
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(40);
}
await page.waitForTimeout(1500);

await ctx.close(); // flushes the video
await browser.close();
console.log('video saved to', out);
