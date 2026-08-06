/**
 * Hero scene performance harness.
 *
 * Reports draw calls and FPS for the 3D hero without instrumenting production
 * code: WebGL draw entry points are patched in an init script before any canvas
 * exists, and FPS is sampled from requestAnimationFrame. Nothing here ships.
 *
 *   node scripts/measure-hero-perf.mjs [url] [--tier=full|balanced] [--seconds=8]
 *
 * Draw calls are reported as the median over sampled frames — the first frames
 * of a scene include one-off passes (shadow map bake, ContactShadows frames={1},
 * Environment frames={1}) that are not representative of steady state.
 */

import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith('--')) ?? 'http://localhost:3000/en';
const tier = (args.find((a) => a.startsWith('--tier=')) ?? '--tier=full').split('=')[1];
const seconds = Number((args.find((a) => a.startsWith('--seconds=')) ?? '--seconds=8').split('=')[1]);
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const INIT = `
(() => {
  const stats = { frames: [], current: 0, raf: [], last: performance.now() };
  window.__cvPerf = stats;

  const patch = (proto) => {
    if (!proto) return;
    for (const name of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']) {
      const orig = proto[name];
      if (!orig) continue;
      proto[name] = function (...a) { stats.current++; return orig.apply(this, a); };
    }
  };
  patch(window.WebGLRenderingContext && WebGLRenderingContext.prototype);
  patch(window.WebGL2RenderingContext && WebGL2RenderingContext.prototype);

  // One tick per composited frame: whatever draw calls accumulated since the
  // last tick belong to the frame just rendered.
  const tick = () => {
    const now = performance.now();
    stats.raf.push(now - stats.last);
    stats.last = now;
    stats.frames.push(stats.current);
    stats.current = 0;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
`;

const median = (xs) => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Force the quality tier before first paint; 'full' pins Tier A.
await page.addInitScript(
  ([pref]) => localStorage.setItem('cv-quality', JSON.stringify({ state: { preference: pref }, version: 0 })),
  [tier],
);
await page.addInitScript(INIT);

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForSelector('canvas', { timeout: 30_000 });
// Let shaders compile and the one-off passes settle before sampling.
await page.waitForTimeout(3500);
await page.evaluate(() => {
  window.__cvPerf.frames.length = 0;
  window.__cvPerf.raf.length = 0;
});
await page.waitForTimeout(seconds * 1000);

const r = await page.evaluate(() => ({
  frames: window.__cvPerf.frames.slice(),
  raf: window.__cvPerf.raf.slice(),
}));

const drawn = r.frames.filter((f) => f > 0);
const deltas = r.raf.filter((d) => d > 0);
const fps = deltas.map((d) => 1000 / d);
const sorted = [...fps].sort((a, b) => a - b);

console.log(`url            ${url}`);
console.log(`tier           ${tier}`);
console.log(`sampled        ${deltas.length} frames over ${seconds}s`);
console.log(`draw calls     median ${median(drawn)}   min ${Math.min(...drawn)}   max ${Math.max(...drawn)}`);
console.log(`fps            median ${median(fps).toFixed(1)}   p5 ${(sorted[Math.floor(sorted.length * 0.05)] ?? 0).toFixed(1)}   min ${Math.min(...fps).toFixed(1)}`);

await browser.close();
