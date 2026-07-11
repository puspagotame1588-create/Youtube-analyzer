/**
 * Safe credential setup for CareerVerse.
 * Generates cryptographically random admin + invite credentials and prints
 * ready-to-paste env lines. Nothing is written to disk and raw codes are
 * printed ONCE to your terminal only — store them in a password manager.
 *
 * Usage:
 *   node scripts/setup-credentials.mjs             # 1 invite code, no limits
 *   node scripts/setup-credentials.mjs 5           # 5 invite codes
 *   node scripts/setup-credentials.mjs 5 2026-12-31 3   # expiry + max 3 uses each
 */
import { randomBytes, createHash } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(groups = 3, len = 5) {
  const parts = [];
  for (let g = 0; g < groups; g++) {
    const bytes = randomBytes(len);
    parts.push(Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join(''));
  }
  return `CV-${parts.join('-')}`;
}

function adminSecret() {
  return randomBytes(24).toString('base64url'); // 32 chars, mixed classes
}

const count = Math.max(1, Number(process.argv[2] ?? 1));
const expires = process.argv[3] ?? '';
const maxUses = process.argv[4] ?? '';

const admin = adminSecret();
const invites = Array.from({ length: count }, () => {
  const code = randomCode();
  const hash = createHash('sha256').update(code.toUpperCase()).digest('hex');
  return { code, entry: [hash, expires, maxUses].filter(Boolean).join(':') };
});

console.log('== CareerVerse credentials (shown once — store securely) ==\n');
console.log('Invite codes to send to testers:');
for (const i of invites) console.log(`  ${i.code}`);
console.log('\nPaste into your deployment environment:\n');
console.log(`ADMIN_ACCESS_CODE=${admin}`);
console.log(`INVITE_CODE_HASHES=${invites.map((i) => i.entry).join(',')}`);
console.log('\nNotes:');
console.log('- Only the hashes go to the server; codes above are never stored.');
console.log('- Remove an entry from INVITE_CODE_HASHES to revoke that code.');
console.log('- Redeploy after changing env vars.');
