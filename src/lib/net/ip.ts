/**
 * Trusted client-IP resolution for rate limiting.
 *
 * SECURITY: never key rate limits on the client-controlled LEFTMOST value of
 * `x-forwarded-for` — an attacker can send `X-Forwarded-For: <random>` on every
 * request to land in a fresh bucket and bypass the limit entirely (invite/admin
 * brute force, AI denial-of-wallet, support spam).
 *
 * Production: the official `@vercel/functions` `ipAddress()` helper reads the
 * edge-provided `x-real-ip`, which is not client-spoofable. Local dev / non-
 * Vercel: fall back to `x-real-ip`, then the LAST hop of `x-forwarded-for` (the
 * entry appended by the trusted proxy nearest us) — never the leftmost. Unknown
 * → a single shared bucket, which fails safe (stricter), not open.
 */

import { ipAddress } from '@vercel/functions';
import type { NextRequest } from 'next/server';

export function clientIp(request: NextRequest): string {
  try {
    const platformIp = ipAddress(request);
    if (platformIp && platformIp.trim()) return platformIp.trim();
  } catch {
    // Not running on Vercel (local dev) — fall through to the header heuristic.
  }

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
