import { describe, expect, it } from 'vitest';
import type { NextRequest } from 'next/server';
import { clientIp } from './ip';

function req(headers: Record<string, string>, ip?: string): NextRequest {
  return {
    ip,
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
  } as unknown as NextRequest;
}

describe('clientIp — anti-spoof rate-limit key', () => {
  it('prefers Vercel request.ip over any header', () => {
    expect(clientIp(req({ 'x-forwarded-for': '1.1.1.1' }, '9.9.9.9'))).toBe('9.9.9.9');
  });

  it('uses x-real-ip (trusted) when request.ip is absent', () => {
    expect(clientIp(req({ 'x-real-ip': '8.8.8.8', 'x-forwarded-for': 'spoof, 8.8.8.8' }))).toBe('8.8.8.8');
  });

  it('uses the LAST x-forwarded-for hop, never the spoofable leftmost value', () => {
    // An attacker sends "X-Forwarded-For: spoofed" — the trusted proxy appends
    // the real client IP as the last entry. We must key on that, not "spoofed".
    expect(clientIp(req({ 'x-forwarded-for': 'spoofed-client, 203.0.113.7' }))).toBe('203.0.113.7');
  });

  it('fails safe to a single shared bucket when nothing is available', () => {
    expect(clientIp(req({}))).toBe('unknown');
  });
});
