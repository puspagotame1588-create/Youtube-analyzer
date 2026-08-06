import { chromium } from '@playwright/test';
const out = process.argv[2] ?? 'shot';
const bare = process.argv.includes('--bare');
const dir = process.env.HERO_SHOT_DIR ?? '/tmp';
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() =>
  localStorage.setItem('cv-quality', JSON.stringify({ state: { preference: 'full' }, version: 0 })),
);
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
await p.goto('http://localhost:3000/en', { waitUntil: 'networkidle' });
await p.waitForSelector('canvas', { timeout: 30000 });
await p.waitForTimeout(9000);
if (bare) {
  // Diagnostic only: drop the overlay so the scene itself can be judged.
  await p.evaluate(() => {
    document.querySelectorAll('.cv-glass').forEach((el) => (el.style.display = 'none'));
    document.querySelectorAll('section [class*="pointer-events-none"]').forEach((el) => {
      if (el.querySelector('canvas')) return;
      el.style.opacity = '0';
    });
  });
  await p.waitForTimeout(400);
}
await p.screenshot({ path: `${dir}/${out}.png` });
console.log('errors:', errs.length ? errs : 'none');
await b.close();
