/**
 * Trusted client-IP resolution for rate limiting.
 *
 * SECURITY: the previous code used the LEFTMOST value of `x-forwarded-for`,
 * which is client-controlled — an attacker can send `X-Forwarded-For: <random>`
 * on every request to land in a fresh rate-limit bucket and bypass the limit
 * entirely (invite/admin brute force, AI denial-of-wallet, support spam).
 *
 * On Vercel the trustworthy sources are `request.ip` and `x-real-ip`, both set
 * by the edge and not spoofable. We fall back to the LAST hop of
 * `x-forwarded-for` (the entry appended by the trusted proxy nearest us), never
 * the leftmost client-supplied value. Unknown → a single shared bucket, which
 * fails safe (stricter), not open.
 */

import type { NextRequest } from 'next/server';

export function clientIp(request: NextRequest): string {
  const vercelIp = (request as unknown as { ip?: string }).ip;
  if (vercelIp && vercelIp.trim()) return vercelIp.trim();

  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const parts = xff
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const last = parts[parts.length - 1]; // trusted last hop (proxy-appended)
    if (last) return last;
  }
  return 'unknown';
}
