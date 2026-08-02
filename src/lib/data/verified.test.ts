import { describe, expect, it } from 'vitest';
import {
  verifiedScholarships,
  presentableScholarships,
  blockedScholarships,
  verifiedCounts,
} from './verified';
import { realScholarships } from './real';
import { isPresentableAsVerified } from './real';

/**
 * Guards the invariant introduced by the 2026-08-01 scholarship verification
 * pass (docs/SCHOLARSHIP_VERIFICATION_2026-08-01.md): a record that an audit
 * could not fully confirm must never reach a user as verified fact, and the
 * specific corrections that pass produced must not silently regress.
 */
describe('verification gate', () => {
  it('never presents a verification_blocked record as verified', () => {
    for (const s of presentableScholarships) {
      expect(s.state).not.toBe('verification_blocked');
      expect(isPresentableAsVerified(s.state)).toBe(true);
    }
  });

  it('excludes blocked records from the verified count', () => {
    expect(verifiedCounts.scholarshipsFullyVerified).toBe(presentableScholarships.length);
    expect(verifiedCounts.scholarshipsVerificationBlocked).toBe(blockedScholarships.length);
    expect(presentableScholarships.length + blockedScholarships.length).toBeLessThanOrEqual(
      verifiedScholarships.length,
    );
  });

  it('requires every blocked record to name what could not be verified', () => {
    expect(blockedScholarships.length).toBeGreaterThan(0);
    for (const s of blockedScholarships) {
      expect(s.missing.length).toBeGreaterThan(0);
      for (const m of s.missing) expect(m.trim()).not.toBe('');
    }
  });

  it('gates JASSO on its unpublished student-facing deadline (audit J-14)', () => {
    const jasso = verifiedScholarships.find((s) => s.id === 'vs-jasso-shoreihi');
    expect(jasso).toBeDefined();
    expect(jasso?.state).toBe('verification_blocked');
    // The deadline field must not be dressed up as an official figure.
    expect(jasso?.deadlineStatus.status).toBe('unverified');
    expect(jasso?.missing.join(' ')).toMatch(/deadline/i);
  });

  it('does not present the closed Rotary Yoneyama round as recurring or open', () => {
    const y = verifiedScholarships.find((s) => s.id === 'vs-yoneyama');
    expect(y).toBeDefined();
    const deadline = y?.deadlineStatus.value ?? '';
    // Audit R-11: the round closed at 2025-10-15 23:59 (「受付を終了しました」).
    // "毎年" (every year) asserted an annual recurrence from one closed round.
    expect(deadline).not.toMatch(/毎年/);
    expect(deadline).toMatch(/終了/);
  });

  it('records the seven unobtainable Kyoritsu fields rather than summarising them', () => {
    const kif = realScholarships.find((s) => s.id === 'real-kif');
    expect(kif).toBeDefined();
    expect(kif?.meta.state).toBe('verification_blocked');
    // One entry per audit finding K-08…K-14, so a later pass cannot quietly
    // backfill them from an older round or a third-party aggregator.
    for (const code of ['K-08', 'K-09', 'K-10', 'K-11', 'K-12', 'K-13', 'K-14']) {
      expect(kif?.meta.missingInfo.join(' ')).toContain(code);
    }
  });
});
