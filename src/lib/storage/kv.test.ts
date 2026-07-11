import { describe, expect, it } from 'vitest';
import { getKV } from './kv';

// With no Upstash/Supabase env, getKV() returns the memory adapter.
describe('KV memory adapter (developer mode)', () => {
  it('reports memory mode', () => {
    expect(getKV().mode).toBe('memory');
  });

  it('rate-limits within a window', async () => {
    const kv = getKV();
    const key = `t-${Math.random()}`;
    const a = await kv.rateLimit('test', key, 2, 60);
    const b = await kv.rateLimit('test', key, 2, 60);
    const c = await kv.rateLimit('test', key, 2, 60);
    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);
    expect(c.allowed).toBe(false);
  });

  it('enforces invite max-uses', async () => {
    const kv = getKV();
    const hash = `h-${Math.random()}`;
    expect((await kv.useInvite(hash, 1)).ok).toBe(true);
    expect((await kv.useInvite(hash, 1)).ok).toBe(false);
  });

  it('treats undefined maxUses as unlimited', async () => {
    const kv = getKV();
    const hash = `h-${Math.random()}`;
    expect((await kv.useInvite(hash, undefined)).ok).toBe(true);
    expect((await kv.useInvite(hash, undefined)).ok).toBe(true);
  });

  it('stores and reads back queued docs', async () => {
    const kv = getKV();
    const list = `l-${Math.random()}`;
    await kv.pushDoc(list, { a: 1 });
    const docs = await kv.readDocs(list, 5);
    expect(docs[0]).toEqual({ a: 1 });
  });
});
