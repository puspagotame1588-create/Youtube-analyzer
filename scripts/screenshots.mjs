import { chromium, devices } from '@playwright/test';

const OUT = '/tmp/claude-0/-home-user-Youtube-analyzer/c588187e-6716-51a9-b39f-3b4b3f788195/scratchpad/shots';
const base = 'http://localhost:3100';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

async function driveSimulation(page) {
  await page.goto(`${base}/en/create`);
  await page.getByLabel(/What future do you want to build/).fill('I want to work in IT in Tokyo');
  await page.getByRole('button', { name: 'Begin' }).click();
  await page.getByText('Question 1 of 5', { exact: true }).waitFor();
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

for (const [name, device] of [
  ['desktop', { viewport: { width: 1440, height: 900 } }],
  ['mobile', devices['Pixel 7']],
]) {
  const ctx = await browser.newContext(device);
  const page = await ctx.newPage();

  await page.goto(`${base}/en`);
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${OUT}/${name}-01-landing.png` });

  await page.goto(`${base}/ja`);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/${name}-02-landing-ja.png` });

  await page.goto(`${base}/en/create`);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${name}-03-portal.png` });

  await driveSimulation(page);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${OUT}/${name}-04-universe.png` });

  await page.getByRole('button', { name: 'Why this result?' }).first().click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${name}-05-why.png` });

  await page.goto(`${base}/en/schools`);
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${OUT}/${name}-06-schools.png` });

  await page.goto(`${base}/en/careers/car-it`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/${name}-07-career.png` });

  await page.goto(`${base}/en/roadmap`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/${name}-08-roadmap.png` });

  await page.goto(`${base}/en/plan`);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${name}-09-plan.png` });

  await ctx.close();
}

await browser.close();
console.log('done');
