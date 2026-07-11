/**
 * Durable key-value adapter for rate limits, invite use-counts, and the
 * support queue. Backends:
 * - Upstash Redis (REST) — UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * - Supabase Postgres — NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   (tables/functions in supabase/migrations/0002_kv_invites.sql)
 * - Memory — development fallback ONLY; every consumer must surface that
 *   strict limits are NOT enforced in this mode (config-guard developerMode).
 *
 * Invite use-count updates are atomic in both durable backends
 * (Redis INCR / Postgres row-level UPDATE ... WHERE uses < max_uses).
 */

export type KVMode = 'upstash' | 'supabase' | 'memory';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export interface InviteUseResult {
  ok: boolean;
  reason?: 'exhausted' | 'error';
}

export interface KVStore {
  readonly mode: KVMode;
  /** Sliding-window-ish counter: INCR + expiry on first hit. */
  rateLimit(scope: string, key: string, max: number, windowSeconds: number): Promise<RateLimitResult>;
  /** Atomically consume one use of an invite (no-op limit when maxUses undefined). */
  useInvite(hash: string, maxUses: number | undefined): Promise<InviteUseResult>;
  /** Append a JSON document to a list (support queue). */
  pushDoc(listKey: string, doc: unknown): Promise<boolean>;
  /** Read up to `limit` recent docs from a list. */
  readDocs(listKey: string, limit: number): Promise<unknown[]>;
}

/* ---------------- Upstash Redis (REST) ---------------- */

class UpstashStore implements KVStore {
  readonly mode = 'upstash' as const;
  constructor(
    private url: string,
    private token: string,
  ) {}

  private async cmd(parts: Array<string | number>): Promise<unknown> {
    const res = await fetch(`${this.url}/${parts.map((p) => encodeURIComponent(String(p))).join('/')}`, {
      headers: { Authorization: `Bearer ${this.token}` },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`upstash ${res.status}`);
    const json = (await res.json()) as { result: unknown };
    return json.result;
  }

  async rateLimit(scope: string, key: string, max: number, windowSeconds: number): Promise<RateLimitResult> {
    const k = `rl:${scope}:${key}`;
    const count = Number(await this.cmd(['INCR', k]));
    if (count === 1) await this.cmd(['EXPIRE', k, windowSeconds]);
    return { allowed: count <= max, remaining: Math.max(0, max - count) };
  }

  async useInvite(hash: string, maxUses: number | undefined): Promise<InviteUseResult> {
    if (maxUses === undefined) return { ok: true };
    const k = `invite:uses:${hash}`;
    const uses = Number(await this.cmd(['INCR', k]));
    if (uses > maxUses) {
      await this.cmd(['DECR', k]);
      return { ok: false, reason: 'exhausted' };
    }
    return { ok: true };
  }

  async pushDoc(listKey: string, doc: unknown): Promise<boolean> {
    await this.cmd(['LPUSH', listKey, JSON.stringify(doc)]);
    await this.cmd(['LTRIM', listKey, 0, 499]);
    return true;
  }

  async readDocs(listKey: string, limit: number): Promise<unknown[]> {
    const raw = (await this.cmd(['LRANGE', listKey, 0, limit - 1])) as string[];
    return raw.map((r) => JSON.parse(r) as unknown);
  }
}

/* ---------------- Supabase (service role, REST/RPC) ---------------- */

class SupabaseStore implements KVStore {
  readonly mode = 'supabase' as const;
  constructor(
    private url: string,
    private key: string,
  ) {}

  private headers(): Record<string, string> {
    return {
      apikey: this.key,
      Authorization: `Bearer ${this.key}`,
      'Content-Type': 'application/json',
    };
  }

  async rateLimit(scope: string, key: string, max: number, windowSeconds: number): Promise<RateLimitResult> {
    const res = await fetch(`${this.url}/rest/v1/rpc/kv_rate_limit`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ p_scope: scope, p_key: key, p_max: max, p_window_seconds: windowSeconds }),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`supabase rl ${res.status}`);
    const count = (await res.json()) as number;
    return { allowed: count <= max, remaining: Math.max(0, max - count) };
  }

  async useInvite(hash: string, maxUses: number | undefined): Promise<InviteUseResult> {
    const res = await fetch(`${this.url}/rest/v1/rpc/use_invite`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ p_hash: hash, p_max_uses: maxUses ?? null }),
      cache: 'no-store',
    });
    if (!res.ok) return { ok: false, reason: 'error' };
    const ok = (await res.json()) as boolean;
    return ok ? { ok: true } : { ok: false, reason: 'exhausted' };
  }

  async pushDoc(listKey: string, doc: unknown): Promise<boolean> {
    const res = await fetch(`${this.url}/rest/v1/kv_docs`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ list_key: listKey, doc }),
      cache: 'no-store',
    });
    return res.ok;
  }

  async readDocs(listKey: string, limit: number): Promise<unknown[]> {
    const res = await fetch(
      `${this.url}/rest/v1/kv_docs?list_key=eq.${encodeURIComponent(listKey)}&order=created_at.desc&limit=${limit}&select=doc`,
      { headers: this.headers(), cache: 'no-store' },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{ doc: unknown }>;
    return rows.map((r) => r.doc);
  }
}

/* ---------------- Memory (development ONLY) ---------------- */

class MemoryStore implements KVStore {
  readonly mode = 'memory' as const;
  private counters = new Map<string, { count: number; resetAt: number }>();
  private uses = new Map<string, number>();
  private lists = new Map<string, unknown[]>();

  async rateLimit(scope: string, key: string, max: number, windowSeconds: number): Promise<RateLimitResult> {
    const k = `${scope}:${key}`;
    const now = Date.now();
    const cur = this.counters.get(k);
    if (!cur || cur.resetAt < now) {
      this.counters.set(k, { count: 1, resetAt: now + windowSeconds * 1000 });
      return { allowed: max >= 1, remaining: max - 1 };
    }
    cur.count += 1;
    return { allowed: cur.count <= max, remaining: Math.max(0, max - cur.count) };
  }

  async useInvite(hash: string, maxUses: number | undefined): Promise<InviteUseResult> {
    if (maxUses === undefined) return { ok: true };
    const used = this.uses.get(hash) ?? 0;
    if (used >= maxUses) return { ok: false, reason: 'exhausted' };
    this.uses.set(hash, used + 1);
    return { ok: true };
  }

  async pushDoc(listKey: string, doc: unknown): Promise<boolean> {
    const list = this.lists.get(listKey) ?? [];
    list.unshift(doc);
    this.lists.set(listKey, list.slice(0, 500));
    return true;
  }

  async readDocs(listKey: string, limit: number): Promise<unknown[]> {
    return (this.lists.get(listKey) ?? []).slice(0, limit);
  }
}

let store: KVStore | null = null;

export function getKV(): KVStore {
  if (store) return store;
  const upUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (upUrl && upToken) store = new UpstashStore(upUrl, upToken);
  else if (sbUrl && sbKey) store = new SupabaseStore(sbUrl, sbKey);
  else store = new MemoryStore();
  return store;
}

/** Rate limit that fails CLOSED in production if the durable backend errors. */
export async function safeRateLimit(
  scope: string,
  key: string,
  max: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const kv = getKV();
  try {
    return await kv.rateLimit(scope, key, max, windowSeconds);
  } catch {
    // Durable backend unreachable: deny in production, allow in dev.
    return { allowed: kv.mode === 'memory', remaining: 0 };
  }
}
