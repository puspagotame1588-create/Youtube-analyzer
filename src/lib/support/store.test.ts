import { describe, expect, it } from 'vitest';
import type { KVStore, KVMode } from '@/lib/storage/kv';
import { MAX_STORED_MESSAGE, SUPPORT_TICKET_TTL_SECONDS, readFullTicket, storeFullTicket } from './store';

/** Minimal durable-backend fake capturing the TTL and stored value. */
function fakeKV(mode: KVMode): KVStore & { calls: Array<{ key: string; ttl: number }>; data: Map<string, unknown> } {
  const data = new Map<string, unknown>();
  const calls: Array<{ key: string; ttl: number }> = [];
  return {
    mode,
    calls,
    data,
    rateLimit: async () => ({ allowed: true, remaining: 0 }),
    useInvite: async () => ({ ok: true }),
    pushDoc: async () => true,
    readDocs: async () => [],
    setJson: async (key, value, ttl) => {
      calls.push({ key, ttl });
      data.set(key, value);
      return true;
    },
    getJson: async (key) => (data.has(key) ? (data.get(key) ?? null) : null),
  };
}

const base = {
  reference: 'CV-ABC123',
  category: 'technical',
  message: 'hello',
  email: 'a@b.com',
  locale: 'en',
  receivedAt: '2026-07-12T00:00:00.000Z',
  deliveryProvider: 'webhook',
  deliveryStatus: 'delivered',
  deliveryError: null,
};

describe('support ticket store — retention & privacy', () => {
  it('stores the full ticket under a per-reference key with a 30-day TTL', async () => {
    const kv = fakeKV('upstash');
    const ok = await storeFullTicket(kv, base);
    expect(ok).toBe(true);
    expect(kv.calls[0]?.key).toBe('support:ticket:CV-ABC123');
    expect(kv.calls[0]?.ttl).toBe(SUPPORT_TICKET_TTL_SECONDS);
    expect(SUPPORT_TICKET_TTL_SECONDS).toBe(30 * 24 * 60 * 60);
  });

  it('truncates an oversized message to the strict max before storage', async () => {
    const kv = fakeKV('upstash');
    await storeFullTicket(kv, { ...base, message: 'x'.repeat(MAX_STORED_MESSAGE + 5000) });
    const stored = await readFullTicket(kv, 'CV-ABC123');
    expect(stored?.message.length).toBe(MAX_STORED_MESSAGE);
  });

  it('assigns a status lifecycle field', async () => {
    const kv = fakeKV('upstash');
    await storeFullTicket(kv, base);
    const stored = await readFullTicket(kv, 'CV-ABC123');
    expect(stored?.status).toBe('open');
  });

  it('does not durably retain in memory/dev mode', async () => {
    const kv = fakeKV('memory');
    const ok = await storeFullTicket(kv, base);
    expect(ok).toBe(false);
    expect(kv.calls).toHaveLength(0);
  });
});
