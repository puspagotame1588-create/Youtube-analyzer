import { describe, expect, it } from 'vitest';
import type { NextRequest } from 'next/server';
import { clientIp } from './ip';

function req(headers: Record<string, string>): NextRequest {
  return {
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
  } as unknown as NextRequest;
}

describe('clientIp — anti-spoof rate-limit key (@vercel/functions + fallback)', () => {
  it('uses the trusted x-real-ip even when x-forwarded-for is spoofed', () => {
    // @vercel/functions ipAddress() reads x-real-ip; the leftmost XFF is ignored.
    expect(clientIp(req({ 'x-real-ip': '203.0.113.9', 'x-forwarded-for': 'spoofed, 203.0.113.9' }))).toBe(
      '203.0.113.9',
    );
  });

  it('falls back to the LAST x-forwarded-for hop, never the spoofable leftmost', () => {
    expect(clientIp(req({ 'x-forwarded-for': 'spoofed-client, 198.51.100.4' }))).toBe('198.51.100.4');
  });

  it('fails safe to a single shared bucket when no platform/proxy header exists', () => {
    expect(clientIp(req({}))).toBe('unknown');
  });

  it('never returns the attacker-supplied leftmost value', () => {
    const ip = clientIp(req({ 'x-forwarded-for': 'evil-spoof, 10.0.0.1, 172.16.0.1' }));
    expect(ip).not.toBe('evil-spoof');
  });
});
