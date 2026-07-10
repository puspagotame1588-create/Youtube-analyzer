import { describe, expect, it } from 'vitest';
import { parseInviteEntries, sha256 } from './invite';
import { edgeIsValidInvite } from './invite-edge';

describe('parseInviteEntries', () => {
  it('falls back to the hash of the default beta code when unset', () => {
    const entries = parseInviteEntries(undefined, 'KANTO-BETA');
    expect(entries).toHaveLength(1);
    expect(entries[0]?.hash).toBe(sha256('KANTO-BETA'));
  });

  it('parses hash:expiry:maxUses entries and drops malformed ones', () => {
    const h = sha256('CV-TEST');
    const entries = parseInviteEntries(`${h}:2030-01-01:5, nonsense, ${sha256('B')}`, 'X');
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({ hash: h, expiresAt: '2030-01-01', maxUses: 5 });
  });
});

describe('edgeIsValidInvite', () => {
  const h = sha256('CV-EDGE');
  it('accepts a configured, unexpired hash', () => {
    expect(edgeIsValidInvite(h, `${h}:2099-01-01`)).toBe(true);
  });
  it('rejects unknown, expired, and missing cookies (revocation works)', () => {
    expect(edgeIsValidInvite('deadbeef'.repeat(8), `${h}`)).toBe(false);
    expect(edgeIsValidInvite(h, `${h}:2000-01-01`)).toBe(false);
    expect(edgeIsValidInvite(undefined, `${h}`)).toBe(false);
  });
  it('uses the documented default hash when env is unset', () => {
    expect(edgeIsValidInvite(sha256('KANTO-BETA'), undefined)).toBe(true);
  });
});
