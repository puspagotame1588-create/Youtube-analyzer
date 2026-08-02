#!/usr/bin/env node
/**
 * Deterministically compiles the committed scholarship verification report into
 * a typed, citable claim index.
 *
 *   docs/SCHOLARSHIP_VERIFICATION_2026-08-01.md
 *     -> src/lib/data/scholarships/claims.generated.ts
 *
 * The report is already the ideal corpus shape: one row per audited claim, each
 * carrying its own verdict, the exact Japanese excerpt that supports it, and the
 * controlling official URL. Nothing here is summarised, reworded or inferred —
 * every field is lifted verbatim from a row, so a retrieved claim can always be
 * traced back to the source text a human checked.
 *
 * UNCONFIRMED rows are compiled too, but tagged, so the retrieval layer can keep
 * them strictly out of anything presented as fact.
 *
 * The generated file is a build artifact: do not hand-edit it; re-run this script.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'docs/SCHOLARSHIP_VERIFICATION_2026-08-01.md');
const OUT = join(ROOT, 'src/lib/data/scholarships/claims.generated.ts');

/** Section heading -> stable program key. Any new heading must be added here. */
const PROGRAMS = [
  { key: 'jasso', prefix: 'J', match: /JASSO \/ MEXT Honors Scholarship/i },
  { key: 'mext', prefix: 'M', match: /^Japanese Government \(MEXT\) Scholarship/i },
  { key: 'yoneyama', prefix: 'R', match: /Rotary Yoneyama/i },
  { key: 'satoyo', prefix: 'S', match: /Sato Yo International/i },
  { key: 'kyoritsu', prefix: 'K', match: /Kyoritsu International/i },
];

const text = readFileSync(SRC, 'utf8');
const lines = text.split(/\r?\n/);

/** Splits a markdown table row into trimmed cells. */
function cells(line) {
  const t = line.trim();
  if (!t.startsWith('|') || !t.endsWith('|')) return null;
  return t.slice(1, -1).split('|').map((c) => c.trim());
}

const verificationDate = (text.match(/^- Verification date:\s*(\S+)/m) ?? [])[1] ?? null;
const productionStatus =
  (text.match(/^- Production status:\s*\*\*(.+?)\*\*/m) ?? [])[1] ?? null;

// ── Per-program gate + counts, from the summary table ────────────────────────
const gates = {};
for (const line of lines) {
  const c = cells(line);
  if (!c || c.length !== 5) continue;
  const prog = PROGRAMS.find((p) => p.match.test(c[0]) || c[0].startsWith(p.key));
  const byLabel = {
    'JASSO Honors': 'jasso',
    'MEXT Government': 'mext',
    'Rotary Yoneyama': 'yoneyama',
    'Sato Yo': 'satoyo',
    Kyoritsu: 'kyoritsu',
  }[c[0]];
  const key = byLabel ?? prog?.key;
  if (!key || !/^\d+$/.test(c[1])) continue;
  gates[key] = {
    pass: Number(c[1]),
    mismatch: Number(c[2]),
    unconfirmed: Number(c[3]),
    gate: c[4],
  };
}

// ── Claims + scope warnings, from each program section ───────────────────────
const claims = [];
const scopeWarnings = {};
let current = null;

for (const line of lines) {
  if (line.startsWith('## ')) {
    const heading = line.slice(3).trim();
    current = PROGRAMS.find((p) => p.match.test(heading)) ?? null;
    if (current) scopeWarnings[current.key] ??= null;
    continue;
  }
  if (!current) continue;

  if (/^Scope warning:/i.test(line.trim())) {
    scopeWarnings[current.key] = line.trim().replace(/^Scope warning:\s*/i, '').replace(/\*\*/g, '');
    continue;
  }

  const c = cells(line);
  if (!c || c.length !== 5) continue;
  const [id, statement, verdict, excerpt, urls] = c;
  if (!new RegExp(`^${current.prefix}-\\d+$`).test(id)) continue;
  if (!/^(PASS|MISMATCH|UNCONFIRMED)$/.test(verdict)) continue;

  claims.push({
    id,
    program: current.key,
    statement,
    verdict,
    excerpt,
    sourceUrls: urls
      .split(';')
      .map((u) => u.trim())
      .filter((u) => u.startsWith('http')),
  });
}

// ── Integrity checks: refuse to emit a corpus that lost rows ─────────────────
const counted = { pass: 0, mismatch: 0, unconfirmed: 0 };
for (const cl of claims) counted[cl.verdict.toLowerCase()] += 1;

const expected = Object.values(gates).reduce(
  (a, g) => ({
    pass: a.pass + g.pass,
    mismatch: a.mismatch + g.mismatch,
    unconfirmed: a.unconfirmed + g.unconfirmed,
  }),
  { pass: 0, mismatch: 0, unconfirmed: 0 },
);

const problems = [];
if (claims.length === 0) problems.push('parsed 0 claims');
if (counted.pass !== expected.pass) problems.push(`PASS ${counted.pass} != summary ${expected.pass}`);
if (counted.unconfirmed !== expected.unconfirmed)
  problems.push(`UNCONFIRMED ${counted.unconfirmed} != summary ${expected.unconfirmed}`);
if (counted.mismatch !== expected.mismatch)
  problems.push(`MISMATCH ${counted.mismatch} != summary ${expected.mismatch}`);
for (const cl of claims) {
  if (cl.sourceUrls.length === 0) problems.push(`${cl.id} has no official URL`);
  if (!cl.statement) problems.push(`${cl.id} has no statement`);
}
if (problems.length) {
  console.error('Refusing to emit — report parse disagrees with its own summary:');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}

const banner = `/**
 * GENERATED FILE — do not edit.
 * Source: docs/SCHOLARSHIP_VERIFICATION_2026-08-01.md
 * Rebuild: node scripts/build-scholarship-claims.mjs
 *
 * Every claim below is lifted verbatim from one audited row of the verification
 * report, with its verdict, its exact supporting excerpt and its controlling
 * official URL. Nothing is summarised or inferred.
 */`;

const out = `${banner}

import type { ScholarshipClaim, ScholarshipGate } from './types';

export const VERIFICATION_DATE = ${JSON.stringify(verificationDate)};
export const PRODUCTION_STATUS = ${JSON.stringify(productionStatus)};

export const SCHOLARSHIP_GATES: Record<string, ScholarshipGate> = ${JSON.stringify(gates, null, 2)};

export const SCOPE_WARNINGS: Record<string, string | null> = ${JSON.stringify(scopeWarnings, null, 2)};

export const SCHOLARSHIP_CLAIMS: ScholarshipClaim[] = ${JSON.stringify(claims, null, 2)};
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, out, 'utf8');
console.log(
  `claims: ${claims.length} (PASS ${counted.pass} / UNCONFIRMED ${counted.unconfirmed} / MISMATCH ${counted.mismatch}) -> ${OUT.replace(ROOT + '/', '')}`,
);
