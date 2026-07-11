/**
 * Writes src/build-info.json at build time from the actual git checkout, so
 * /api/version reports a build-derived commit SHA (never a hand-typed string).
 * Runs on Vercel via buildCommand before `next build`.
 */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

let commitSha = process.env.VERCEL_GIT_COMMIT_SHA || '';
let branch = process.env.VERCEL_GIT_COMMIT_REF || 'claude/careerverse-production-build-lb3d7z';
if (!commitSha) {
  try {
    commitSha = execSync('git rev-parse HEAD').toString().trim();
  } catch {
    commitSha = 'unknown';
  }
}
writeFileSync(
  'src/build-info.json',
  JSON.stringify({ commitSha, branch, buildTime: new Date().toISOString() }, null, 2) + '\n',
);
console.log('[gen-build-info] commit', commitSha, 'branch', branch);
