import { describe, expect, it } from 'vitest';
import { partitionedStorage, type StorageLike } from './secure-storage';

function fakeStorage(): StorageLike & { dump: Record<string, string> } {
  const dump: Record<string, string> = {};
  return {
    dump,
    getItem: (k) => dump[k] ?? null,
    setItem: (k, v) => {
      dump[k] = v;
    },
    removeItem: (k) => {
      delete dump[k];
    },
  };
}

const SENSITIVE_STATE = {
  // sensitive
  profileDraft: { budgetJpy: { min: 1, expected: 2000000, max: 3 }, desiredSalaryJpy: 4200000, jlptCurrent: 'n2', education: 'bachelor', goalText: 'private plan' },
  currentResult: { profile: { budgetJpy: { expected: 2000000 }, desiredSalaryJpy: 4200000 } },
  scenarios: [{ id: 's1', result: { profile: { desiredSalaryJpy: 4200000 } } }],
  tickets: [{ message: 'my visa situation is X', email: 'me@example.com' }],
  corrections: [{ message: 'correction text' }],
  account: { email: 'me@example.com', displayName: 'Aiko' },
  // non-sensitive
  weights: { affordability: 20 },
  shortlist: ['school-1', 'school-2'],
  notifications: [{ id: 'n1', read: false }],
};

describe('partitionedStorage — sensitive fields never enter localStorage', () => {
  it('routes sensitive keys to sessionStorage and keeps only non-sensitive in localStorage', () => {
    const local = fakeStorage();
    const session = fakeStorage();
    const storage = partitionedStorage({ local, session, now: () => 1000 });

    storage.setItem('cv-app', JSON.stringify({ state: SENSITIVE_STATE, version: 0 }));

    const localBlob = local.dump['cv-app'];
    // No sensitive keys, values, or PII in the durable localStorage blob.
    for (const needle of [
      'profileDraft',
      'currentResult',
      'scenarios',
      'tickets',
      'corrections',
      'account',
      'budgetJpy',
      'desiredSalaryJpy',
      '4200000',
      '2000000',
      'me@example.com',
      'my visa situation',
      'Aiko',
    ]) {
      expect(localBlob).not.toContain(needle);
    }
    // Non-sensitive UI state IS persisted.
    expect(localBlob).toContain('weights');
    expect(localBlob).toContain('shortlist');
    expect(localBlob).toContain('school-1');

    // Sensitive data lives only in sessionStorage.
    const sessionBlob = session.dump['cv-app:session'];
    expect(sessionBlob).toContain('budgetJpy');
    expect(sessionBlob).toContain('me@example.com');
    expect(sessionBlob).toContain('my visa situation');
  });

  it('merges local + session back together on read', () => {
    const local = fakeStorage();
    const session = fakeStorage();
    const storage = partitionedStorage({ local, session, now: () => 1000 });
    storage.setItem('cv-app', JSON.stringify({ state: SENSITIVE_STATE, version: 3 }));

    const merged = JSON.parse(storage.getItem('cv-app') as string);
    expect(merged.version).toBe(3);
    expect(merged.state.shortlist).toEqual(['school-1', 'school-2']); // from local
    expect(merged.state.profileDraft.desiredSalaryJpy).toBe(4200000); // from session
  });

  it('drops expired local data past its TTL', () => {
    const local = fakeStorage();
    const session = fakeStorage();
    let t = 1000;
    const storage = partitionedStorage({ local, session, ttlMs: 100, now: () => t });
    storage.setItem('cv-app', JSON.stringify({ state: { shortlist: ['x'] }, version: 0 }));
    t = 1000 + 101; // advance past TTL
    // Local expired → removed; session (empty here) → null overall.
    expect(storage.getItem('cv-app')).toBeNull();
    expect(local.dump['cv-app']).toBeUndefined();
  });
});
