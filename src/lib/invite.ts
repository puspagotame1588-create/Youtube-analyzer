/**
 * Invite-code gate for the private beta.
 *
 * Only SHA-256 hashes of valid codes are stored, never the codes themselves.
 * Configuration: env INVITE_CODE_HASHES — comma-separated entries of the form
 *   <sha256hex>[:<expiresISOdate>[:<maxUses>]]
 *
 * FAIL-CLOSED: there is NO fallback code. If INVITE_CODE_HASHES is unset,
 * no code is accepted anywhere (production and development alike). Use
 * scripts/setup-credentials.mjs to generate codes and hashes.
 *
 * Use-counts are enforced atomically via the durable KV adapter when
 * configured (Upstash/Supabase); in memory mode they are best-effort and the
 * deployment is flagged as developer mode by config-guard.
 */

import { createHash } from 'node:crypto';
import { getKV } from '@/lib/storage/kv';

export interface InviteEntry {
  hash: string;
  expiresAt?: string;
  maxUses?: number;
}

export const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

export function parseInviteEntries(raw: string | undefined): InviteEntry[] {
  if (!raw || raw.trim() === '') return []; // fail closed — no default
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [hash, expiresAt, maxUses] = part.split(':');
      return {
        hash: (hash ?? '').toLowerCase(),
        ...(expiresAt ? { expiresAt } : {}),
        ...(maxUses ? { maxUses: Number(maxUses) } : {}),
      };
    })
    .filter((e) => /^[0-9a-f]{64}$/.test(e.hash));
}

export function getInviteEntries(): InviteEntry[] {
  return parseInviteEntries(process.env.INVITE_CODE_HASHES);
}

export type InviteCheck = 'ok' | 'invalid' | 'expired' | 'exhausted' | 'not-configured';

export async function checkInviteCode(code: string): Promise<{ result: InviteCheck; hash?: string }> {
  const entries = getInviteEntries();
  if (entries.length === 0) return { result: 'not-configured' };
  const hash = sha256(code.trim().toUpperCase());
  const entry = entries.find((e) => e.hash === hash);
  if (!entry) return { result: 'invalid' };
  if (entry.expiresAt && new Date(entry.expiresAt).getTime() < Date.now()) {
    return { result: 'expired' };
  }
  const use = await getKV().useInvite(hash, entry.maxUses);
  if (!use.ok) return { result: 'exhausted' };
  return { result: 'ok', hash };
}

/** Validates a cookie value (a hash) against the current entries — honors revocation. */
export function isValidInviteHash(hash: string | undefined): boolean {
  if (!hash) return false;
  const entry = getInviteEntries().find((e) => e.hash === hash);
  if (!entry) return false;
  if (entry.expiresAt && new Date(entry.expiresAt).getTime() < Date.now()) return false;
  return true;
}

export const INVITE_COOKIE = 'cv-invite';
