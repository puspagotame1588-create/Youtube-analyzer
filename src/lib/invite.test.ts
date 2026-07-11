import { describe, expect, it } from 'vitest';
import { parseInviteEntries, sha256 } from './invite';
import { edgeIsValidInvite, edgeValidHashes } from './invite-edge';
import { checkSecretStrength } from './config-guard';

describe('parseInviteEntries (fail-closed)', () => {
  it('returns NO entries when unset — there is no fallback code', () => {
    expect(parseInviteEntries(undefined)).toHaveLength(0);
    expect(parseInviteEntries('')).toHaveLength(0);
  });

  it('parses hash:expiry:maxUses entries and drops malformed ones', () => {
    const h = sha256('CV-TEST');
    const entries = parseInviteEntries(`${h}:2030-01-01:5, nonsense, ${sha256('B')}`);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({ hash: h, expiresAt: '2030-01-01', maxUses: 5 });
  });
});

describe('edgeIsValidInvite (fail-closed)', () => {
  const h = sha256('CV-EDGE');
  it('accepts a configured, unexpired hash', () => {
    expect(edgeIsValidInvite(h, `${h}:2099-01-01`)).toBe(true);
  });
  it('rejects unknown, expired, and missing cookies (revocation works)', () => {
    expect(edgeIsValidInvite('deadbeef'.repeat(8), `${h}`)).toBe(false);
    expect(edgeIsValidInvite(h, `${h}:2000-01-01`)).toBe(false);
    expect(edgeIsValidInvite(undefined, `${h}`)).toBe(false);
  });
  it('rejects EVERYTHING when env is unset — no default hash exists', () => {
    expect(edgeValidHashes(undefined).size).toBe(0);
    expect(edgeIsValidInvite(sha256('KANTO-BETA'), undefined)).toBe(false);
    expect(edgeIsValidInvite(sha256('careerverse-admin'), undefined)).toBe(false);
  });
});

describe('checkSecretStrength', () => {
  it('rejects missing, short, known-default, and low-entropy secrets', () => {
    expect(checkSecretStrength(undefined).reason).toBe('missing');
    expect(checkSecretStrength('short1!').reason).toBe('too-short');
    expect(checkSecretStrength('careerverse-admin').reason).toBe('known-default');
    expect(checkSecretStrength('KANTO-BETA').reason).toBe('known-default');
    expect(checkSecretStrength('aaaaaaaaaaaaaaaaaaaa').reason).toBe('low-entropy');
  });
  it('accepts a strong random secret', () => {
    expect(checkSecretStrength('Xk29-qPz8_mN4vTb7Ls1').ok).toBe(true);
  });
});
