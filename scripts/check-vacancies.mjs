/**
 * Vacancy removal check (7-day cycle, P0.5 §6).
 * Fetches each verified vacancy URL and reports whether it still resolves.
 * A non-2xx or network failure marks the record as a removal CANDIDATE — a
 * human then flips its state to `outdated`/`archived`. This script never
 * auto-publishes or auto-deletes.
 *
 * Usage: node scripts/check-vacancies.mjs
 */
import { verifiedVacancies } from '../src/lib/data/verified.ts';

const results = [];
for (const v of verifiedVacancies) {
  let ok = false;
  let status = 0;
  try {
    const res = await fetch(v.sourceUrl, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15000) });
    status = res.status;
    ok = res.ok;
    if (!ok) {
      // Some sites reject HEAD; retry GET
      const g = await fetch(v.sourceUrl, { redirect: 'follow', signal: AbortSignal.timeout(15000) });
      status = g.status;
      ok = g.ok;
    }
  } catch (e) {
    status = 0;
  }
  results.push({ id: v.id, employer: v.employer, status, ok });
  console.log(`${ok ? 'OK  ' : 'GONE'} [${status}] ${v.id} — ${v.employer}: ${v.sourceUrl}`);
}

const gone = results.filter((r) => !r.ok);
console.log(`\n${results.length} checked, ${gone.length} removal candidate(s).`);
if (gone.length > 0) {
  console.log('Set these records to state "outdated" in src/lib/data/verified.ts:');
  for (const g of gone) console.log(`  - ${g.id} (${g.employer})`);
  process.exit(1);
}
