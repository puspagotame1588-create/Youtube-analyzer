import { chromium } from '@playwright/test';
import { createHash } from 'node:crypto';

const CHROME = process.env.CHROME_PATH || undefined;
const URL = 'http://localhost:3000/en';
const browser = await chromium.launch({ executablePath: CHROME });
const pin = (pref) => (page) =>
  page.addInitScript(
    ([p]) => localStorage.setItem('cv-quality', JSON.stringify({ state: { preference: p }, version: 0 })),
    [pref],
  );
const hash = (buf) => createHash('sha1').update(buf).digest('hex').slice(0, 12);
const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

// 1. 2D toggle
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await pin('full')(page);
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas');
  await page.getByRole('button', { name: '2D view' }).click();
  await page.waitForTimeout(700);
  const canvasGone = (await page.locator('canvas').count()) === 0;
  const backBtn = await page.getByRole('button', { name: 'Back to 3D view' }).count();
  check('2D toggle drops the canvas', canvasGone && backBtn === 1);
  await page.getByRole('button', { name: 'Back to 3D view' }).click();
  await page.waitForSelector('canvas', { timeout: 20000 });
  check('2D toggle restores the canvas', (await page.locator('canvas').count()) === 1);
  await page.close();
}

// 2. Mobile: narrow viewport drops the DOM labels
{
  const page = await browser.newPage({ viewport: { width: 390, height: 780 }, isMobile: true });
  await pin('full')(page);
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(6000);
  const labels = await page.getByText('The University of Tokyo').count();
  check('mobile <768px renders no campus labels', labels === 0, `found ${labels}`);
  await page.close();
}

// 3. Tier C (no WebGL path) falls back to the static district
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await pin('battery')(page); // maps to tier C
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  check('tier C renders no canvas', (await page.locator('canvas').count()) === 0);
  await page.close();
}

// 4. prefers-reduced-motion: no auto-rotation.
// Black-box: two frames 7s apart must be byte-identical. Auto-rotation starts
// 4s after idle, so a drifting camera cannot survive this window.
{
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  await pin('full')(page);
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas');
  await page.waitForTimeout(9000);
  const a = hash(await page.screenshot());
  await page.waitForTimeout(7000);
  const b = hash(await page.screenshot());
  check('reduced motion disables auto-rotation', a === b, `${a} vs ${b}`);
  await page.close();
}

// 5. Control: without reduced motion the scene DOES auto-rotate, which proves
// the check above is measuring something real.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await pin('full')(page);
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas');
  await page.waitForTimeout(9000);
  const a = hash(await page.screenshot());
  await page.waitForTimeout(7000);
  const b = hash(await page.screenshot());
  check('control: auto-rotation runs without reduced motion', a !== b, `${a} vs ${b}`);
  await page.close();
}

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length === 0 ? 0 : 1);
