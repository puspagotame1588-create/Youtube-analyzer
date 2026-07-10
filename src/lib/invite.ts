/**
 * Invite-code gate for the private beta.
 *
 * Only SHA-256 hashes of valid codes are stored, never the codes themselves.
 * Configuration: env INVITE_CODE_HASHES — comma-separated entries of the form
 *   <sha256hex>[:<expiresISOdate>[:<maxUses>]]
 * If unset, the gate falls back to the hash of NEXT_PUBLIC_BETA_CODE
 * (default "KANTO-BETA") so the beta remains operable for the founder.
 *
 * Known limitation (documented in docs/SECURITY_PRIVACY.md): use-count
 * enforcement is best-effort in-memory per server instance until a shared
 * store (Supabase/KV) is configured. Expiry and revocation (removing the
 * hash from the env) are fully effective.
 */

import { createHash } from 'node:crypto';

export interface InviteEntry {
  hash: string;
  expiresAt?: string;
  maxUses?: number;
}

export const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

export function parseInviteEntries(raw: string | undefined, fallbackCode: string): InviteEntry[] {
  if (!raw || raw.trim() === '') {
    return [{ hash: sha256(fallbackCode.trim().toUpperCase()) }];
  }
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
  return parseInviteEntries(
    process.env.INVITE_CODE_HASHES,
    process.env.NEXT_PUBLIC_BETA_CODE ?? 'KANTO-BETA',
  );
}

const uses = new Map<string, number>();

export type InviteCheck = 'ok' | 'invalid' | 'expired' | 'exhausted';

export function checkInviteCode(code: string): { result: InviteCheck; hash?: string } {
  const hash = sha256(code.trim().toUpperCase());
  const entry = getInviteEntries().find((e) => e.hash === hash);
  if (!entry) return { result: 'invalid' };
  if (entry.expiresAt && new Date(entry.expiresAt).getTime() < Date.now()) {
    return { result: 'expired' };
  }
  if (entry.maxUses !== undefined) {
    const used = uses.get(hash) ?? 0;
    if (used >= entry.maxUses) return { result: 'exhausted' };
    uses.set(hash, used + 1);
  }
  return { result: 'ok', hash };
}

/** Validates a cookie value (a hash) against the current entries — used to honor revocation. */
export function isValidInviteHash(hash: string | undefined): boolean {
  if (!hash) return false;
  const entry = getInviteEntries().find((e) => e.hash === hash);
  if (!entry) return false;
  if (entry.expiresAt && new Date(entry.expiresAt).getTime() < Date.now()) return false;
  return true;
}

export const INVITE_COOKIE = 'cv-invite';
