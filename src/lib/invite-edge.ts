/**
 * Edge-safe invite helpers for middleware (no node:crypto).
 * FAIL-CLOSED: if INVITE_CODE_HASHES is unset there are no valid hashes and
 * every gated route redirects to the invite page, which explains that the
 * beta gate is not configured. There is no fallback code.
 */

export function edgeValidHashes(raw: string | undefined): Map<string, string | undefined> {
  const map = new Map<string, string | undefined>();
  if (!raw || raw.trim() === '') return map; // fail closed
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
