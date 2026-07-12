/**
 * Live production assertion suite (P0.5 §C).
 * Fetches the ACTUAL public production URL (default careerverse-one.vercel.app)
 * and fails unless the deployed site matches the intended commit and state.
 *
 * Usage:
 *   node scripts/verify-live-production.mjs [baseUrl] [expectedCommitSha]
 *   BASE_URL=https://careerverse-one.vercel.app EXPECT_SHA=<sha> node scripts/verify-live-production.mjs
 *
 * Every request is cache-busted (?_cb=timestamp) so we never assert against an
 * edge-cached copy. Exit code 0 = all pass, 1 = any failure.
 */

const BASE = (process.argv[2] || process.env.BASE_URL || 'https://careerverse-one.vercel.app').replace(/\/$/, '');
const EXPECT_SHA = process.argv[3] || process.env.EXPECT_SHA || '';

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function get(path, opts = {}) {
  const url = `${BASE}${path}${path.includes('?') ? '&' : '?'}_cb=${Date.now()}`;
  const res = await fetch(url, { redirect: 'manual', ...opts });
  const body = res.status >= 300 && res.status < 400 ? '' : await res.text().catch(() => '');
  return { res, body, url };
}

// 1. /api/version reports the expected commit
{
  const { res, body } = await get('/api/version');
  let json = {};
  try { json = JSON.parse(body); } catch {}
  const shaOk = EXPECT_SHA ? (json.commitSha || '').startsWith(EXPECT_SHA.slice(0, 7)) : Boolean(json.commitSha && json.commitSha !== 'local-dev');
  record('/api/version reachable', res.status === 200, `status ${res.status}`);
  record('/api/version commit matches', shaOk, `got ${json.commitSha} (expected ${EXPECT_SHA || 'a real build sha'}), env=${json.environment}, dep=${json.deploymentId}`);
}

// 2. /api/health reports intended environment state
{
  const { res, body } = await get('/api/health');
  let json = {};
  try { json = JSON.parse(body); } catch {}
  record('/api/health reachable', res.status === 200, `status ${res.status}`);
  record('/api/health reports developerMode boolean', typeof json.developerMode === 'boolean', `developerMode=${json.developerMode}, kv=${json.kv}, invite=${json.invite}, admin=${json.admin}, support=${json.supportDelivery}`);
  record('/api/health reports aiProvider (no secret)', json.aiProvider === 'anthropic-configured' || json.aiProvider === 'not-configured', `aiProvider=${json.aiProvider}`);
}

// 2b. /api/ai/smoke-test is protected (never publicly runnable) and leaks no secret
{
  const { res, body } = await get('/api/ai/smoke-test', { method: 'POST' });
  let json = {};
  try { json = JSON.parse(body); } catch {}
  const gated = res.status === 401 || res.status === 503;
  record('/api/ai/smoke-test is access-gated', gated, `status ${res.status} (expects 401 unauthorized or 503 not-configured without a token)`);
  const noSecretLeak = !/sk-ant|ANTHROPIC_API_KEY=/i.test(body);
  record('/api/ai/smoke-test leaks no key material', noSecretLeak);
}

// 3. /en/settings is not a bare Loading-only shell
{
  const { body } = await get('/en/settings');
  const hasControls = body.includes('Interface language') && body.includes('Visual quality') && body.includes('Reduced motion');
  const bareLoadingOnly = /Loading…/.test(body) && !hasControls;
  record('/en/settings server-renders real controls', hasControls && !bareLoadingOnly, hasControls ? 'has language + quality + reduced-motion' : 'missing controls');
}

// 4. /en/roadmap does not contain the removed unsupported statements
{
  const { body } = await get('/en/roadmap');
  const bad1 = body.includes('most common work status');
  const bad2 = body.includes('Realistic mainly for');
  record('/en/roadmap free of "most common work status"', !bad1);
  record('/en/roadmap free of "Realistic mainly for"', !bad2);
  record('/en/roadmap has corrected PR wording', body.includes('longest period of stay') && body.includes('late payment'), 'checks 3-year interim + late-payment warning');
}

// 5. /en/sources shows data-state terminology + verified records
{
  const { body } = await get('/en/sources');
  const stateModel = body.includes('record_verified') && body.includes('official_url_confirmed') && body.includes('simulation_eligible');
  const verified = body.includes('Rotary Yoneyama') && body.includes('Current vacancies') && body.includes('Treasure AI');
  record('/en/sources has data-state model', stateModel);
  record('/en/sources shows verified records', verified, 'Rotary Yoneyama + vacancies + Treasure AI');
}

// 6. /en/support reflects configured delivery honestly
{
  const { body } = await get('/en/support');
  const honest = body.includes('being set up') || body.includes('no team inbox') || body.includes('support@');
  record('/en/support states delivery status', honest, 'shows honest delivery messaging');
}

// 7. personalized routes redirect to invite when unauthenticated
{
  const { res } = await get('/en/universe');
  const loc = res.headers.get('location') || '';
  record('/en/universe redirects to invite (gated)', res.status >= 300 && res.status < 400 && loc.includes('/invite'), `status ${res.status} → ${loc}`);
}

// 8. no known default credential text appears
{
  for (const path of ['/en/invite', '/en/auth', '/en/support']) {
    const { body } = await get(path);
    const leak = body.includes('KANTO-BETA') || body.includes('careerverse-admin');
    record(`${path} free of default-credential text`, !leak);
  }
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed against ${BASE}`);
if (failed.length) {
  console.log('FAILURES:');
  for (const f of failed) console.log(`  - ${f.name}${f.detail ? ` (${f.detail})` : ''}`);
  process.exit(1);
}
