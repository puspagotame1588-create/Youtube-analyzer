import { describe, expect, it } from 'vitest';
import { MockAIProvider } from './mock';
import { intentResultSchema, triageResultSchema, explainResultSchema } from './provider';

const provider = new MockAIProvider();

describe('MockAIProvider', () => {
  it('labels every response as mock (never presented as live AI)', async () => {
    const res = await provider.run({ task: 'intent', locale: 'en', goalText: 'I want to work in IT in Tokyo' });
    expect(res.provider).toBe('mock');
  });

  it('extracts field and location from a goal, flagged for confirmation', async () => {
    const res = await provider.run({ task: 'intent', locale: 'en', goalText: 'I want to work in IT in Tokyo' });
    const data = intentResultSchema.parse(res.data);
    expect(data.field).toBe('it');
    expect(data.location).toBe('tokyo');
    expect(data.needsConfirmation).toBe(true);
  });

  it('understands Japanese goals', async () => {
    const res = await provider.run({ task: 'intent', locale: 'ja', goalText: '横浜のホテルで働きたい' });
    const data = intentResultSchema.parse(res.data);
    expect(data.field).toBe('hospitality');
    expect(data.location).toBe('yokohama');
  });

  it('escalates visa questions to legal-referral', async () => {
    const res = await provider.run({ task: 'support-triage', locale: 'en', message: 'Can I get permanent residence next year?' });
    const data = triageResultSchema.parse(res.data);
    expect(data.category).toBe('legal-referral');
    expect(data.escalate).toBe(true);
    expect(data.reply.toLowerCase()).toContain('qualified professional');
  });

  it('produces a validated bilingual route explanation', async () => {
    for (const locale of ['en', 'ja'] as const) {
      const res = await provider.run({
        task: 'explain-route',
        locale,
        routeName: 'University route',
        factors: [
          { factor: 'affordability', score: 80, weight: 20, reason: 'Budget covers cost.' },
          { factor: 'visa', score: 90, weight: 20, reason: 'Standard graduate transition.' },
        ],
        feasibility: 'high',
        evidence: 'weak',
        closeCall: true,
      });
      const data = explainResultSchema.parse(res.data);
      expect(data.explanation.length).toBeGreaterThan(20);
    }
  });
});
