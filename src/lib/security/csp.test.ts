import { describe, expect, it } from 'vitest';
import { ENFORCED_CSP, REPORT_ONLY_CSP, securityHeaders } from './csp.mjs';

describe('security headers', () => {
  const byKey = Object.fromEntries(securityHeaders.map((h) => [h.key, h.value]));

  it('emits the full hardening header set', () => {
    for (const k of [
      'Content-Security-Policy',
      'Content-Security-Policy-Report-Only',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'Strict-Transport-Security',
    ]) {
      expect(byKey[k]).toBeTruthy();
    }
    expect(byKey['X-Frame-Options']).toBe('DENY');
    expect(byKey['X-Content-Type-Options']).toBe('nosniff');
  });

  it('enforced CSP locks base-uri / object-src / frame-ancestors without breaking scripts', () => {
    expect(ENFORCED_CSP).toContain("base-uri 'self'");
    expect(ENFORCED_CSP).toContain("object-src 'none'");
    expect(ENFORCED_CSP).toContain("frame-ancestors 'none'");
    expect(ENFORCED_CSP).not.toContain('script-src'); // stays permissive → 3D scenes safe
  });

  it('report-only CSP is the precise target policy over the real resource graph', () => {
    for (const directive of [
      "default-src 'self'",
      "connect-src 'self'",
      "worker-src 'self' blob:",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
    ]) {
      expect(REPORT_ONLY_CSP).toContain(directive);
    }
    // No broad third-party wildcards.
    expect(REPORT_ONLY_CSP).not.toContain('*');
  });
});
