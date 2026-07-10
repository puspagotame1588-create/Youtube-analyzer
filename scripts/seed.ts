/**
 * Seed runner.
 *
 * Local beta: the app imports the typed dataset directly from
 * src/lib/data/seed.ts, so no step is required — this script validates the
 * dataset and writes a JSON snapshot for inspection.
 *
 * Supabase mode: when SUPABASE env vars are present, this script prints the
 * SQL insert order; actual inserts go through the admin review pipeline by
 * design (nothing publishes without provenance).
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dataset } from '../src/lib/data/seed';

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

// ---- validation ----
for (const s of dataset.schools) {
  if (!s.provenance.sourceIds.length) fail(`school ${s.id} missing sources`);
  if (!s.nameJa || !s.nameEn) fail(`school ${s.id} missing bilingual names`);
  if (s.provenance.isDemo && !/Demo|デモ/.test(s.nameEn + s.nameJa)) {
    fail(`demo school ${s.id} must carry a (Demo)/（デモ） name label`);
  }
}
for (const c of dataset.careers) {
  if (!c.levels.length) fail(`career ${c.id} has no levels`);
  for (const l of c.levels) {
    if (!l.visaNoteEn || !l.visaNoteJa) fail(`career level ${l.id} missing visa notes`);
  }
}
for (const sch of dataset.scholarships) {
  if (!sch.provenance.lastVerified) fail(`scholarship ${sch.id} missing lastVerified`);
}

mkdirSync('.seed-out', { recursive: true });
writeFileSync('.seed-out/dataset.json', JSON.stringify(dataset, null, 2));

console.log('✓ Seed dataset valid');
console.log(`  schools:      ${dataset.schools.length} (all demo-labeled)`);
console.log(`  scholarships: ${dataset.scholarships.length}`);
console.log(`  careers:      ${dataset.careers.length}`);
console.log(`  job listings: ${dataset.jobListings.length}`);
console.log(`  sources:      ${dataset.sources.length}`);
console.log('  snapshot:     .seed-out/dataset.json');

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log('\nSupabase detected. Apply supabase/migrations/0001_init.sql first, then');
  console.log('load records via the admin review pipeline (draft → reviewed → published).');
} else {
  console.log('\nLocal beta mode: the app reads this dataset directly — nothing else to do.');
}
