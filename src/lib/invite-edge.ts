/**
 * Edge-safe invite helpers for middleware (no node:crypto).
 * The middleware only needs to check whether the cookie's hash is currently
 * valid (present in config and not expired) — hashing happens in /api/invite.
 */

/** sha256("KANTO-BETA") — the documented development fallback code. */
const DEFAULT_HASH = 'd2f0435152ab4c36391cd6069f945d457f03e41b4550da5c24decaf2278ddf1a';

export function edgeValidHashes(raw: string | undefined): Map<string, string | undefined> {
  const map = new Map<string, string | undefined>();
  if (!raw || raw.trim() === '') {
    map.set(DEFAULT_HASH, undefined);
    return map;
  }
  for (const part of raw.split(',')) {
    const [hash, expiresAt] = part.trim().split(':');
    if (hash && /^[0-9a-f]{64}$/i.test(hash)) map.set(hash.toLowerCase(), expiresAt);
  }
  return map;
}

export function edgeIsValidInvite(cookieValue: string | undefined, raw: string | undefined): boolean {
  if (!cookieValue) return false;
  const map = edgeValidHashes(raw);
  if (!map.has(cookieValue.toLowerCase())) return false;
  const expiresAt = map.get(cookieValue.toLowerCase());
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) return false;
  return true;
}

/** Route segments (after the locale) that require an invite. */
export const GATED_SEGMENTS = [
  'create',
  'universe',
  'route',
  'compare',
  'plan',
  'tracker',
  'profile',
  'documents',
  'notifications',
  'auth',
] as const;
