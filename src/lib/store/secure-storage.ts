/**
 * Privacy-partitioned persistence for the local-beta store.
 *
 * SECURITY / PRIVACY (P0.1): sensitive onboarding data (the simulation profile
 * with budget/salary/JLPT/education, saved scenarios that embed it, the
 * account email, and free-text support/correction messages) must NOT sit in
 * durable plaintext localStorage. Until authenticated encrypted server storage
 * exists, those keys are written to sessionStorage instead — they survive
 * in-tab navigation/reload but are cleared when the tab/browser closes.
 *
 * Only non-sensitive UI state (weights, school-id shortlist/tracker, route
 * nicknames, in-app notifications) stays in localStorage, and that blob carries
 * an explicit TTL so stale local data expires rather than lingering forever.
 */

import type { StateStorage } from 'zustand/middleware';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Top-level store keys that hold sensitive/PII data → sessionStorage only. */
export const SENSITIVE_KEYS = [
  'profileDraft', // budget, salary, JLPT, education, free-text goal
  'currentResult', // embeds profile
  'scenarios', // embed profile
  'tickets', // free-text message + email
  'corrections', // free-text message
  'account', // email + display name
] as const;

/** Default local-data TTL: 30 days. */
export const LOCAL_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface PersistEnvelope {
  state?: Record<string, unknown>;
  version?: number;
}

function noopStorage(): StorageLike {
  return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
}

export function partitionedStorage(opts: {
  sensitiveKeys?: readonly string[];
  ttlMs?: number;
  local?: StorageLike;
  session?: StorageLike;
  now?: () => number;
}): StateStorage {
  const sensitive = new Set(opts.sensitiveKeys ?? SENSITIVE_KEYS);
  const ttlMs = opts.ttlMs ?? LOCAL_TTL_MS;
  const now = opts.now ?? (() => Date.now());
  // Guard for SSR / privacy-mode where web storage is unavailable.
  const local =
    opts.local ?? (typeof localStorage !== 'undefined' ? localStorage : noopStorage());
  const session =
    opts.session ?? (typeof sessionStorage !== 'undefined' ? sessionStorage : noopStorage());
  const sessionKey = (name: string): string => `${name}:session`;

  return {
    getItem: (name) => {
      let localEnv: (PersistEnvelope & { savedAt?: number }) | null = null;
      const localRaw = local.getItem(name);
      if (localRaw) {
        try {
          const parsed = JSON.parse(localRaw) as PersistEnvelope & { savedAt?: number };
          // Enforce TTL: drop expired local data instead of returning it.
          if (parsed.savedAt && now() - parsed.savedAt > ttlMs) {
            local.removeItem(name);
          } else {
            localEnv = parsed;
          }
        } catch {
          local.removeItem(name);
        }
      }

      let sessionState: Record<string, unknown> = {};
      const sessionRaw = session.getItem(sessionKey(name));
      if (sessionRaw) {
        try {
          sessionState = JSON.parse(sessionRaw) as Record<string, unknown>;
        } catch {
          session.removeItem(sessionKey(name));
        }
      }

      if (!localEnv && Object.keys(sessionState).length === 0) return null;
      const merged: PersistEnvelope = {
        state: { ...(localEnv?.state ?? {}), ...sessionState },
        version: localEnv?.version ?? 0,
      };
      return JSON.stringify(merged);
    },

    setItem: (name, value) => {
      let env: PersistEnvelope;
      try {
        env = JSON.parse(value) as PersistEnvelope;
      } catch {
        return;
      }
      const state = env.state ?? {};
      const nonSensitive: Record<string, unknown> = {};
      const sensitiveState: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(state)) {
        if (sensitive.has(k)) sensitiveState[k] = v;
        else nonSensitive[k] = v;
      }
      local.setItem(
        name,
        JSON.stringify({ state: nonSensitive, version: env.version ?? 0, savedAt: now() }),
      );
      session.setItem(sessionKey(name), JSON.stringify(sensitiveState));
    },

    removeItem: (name) => {
      local.removeItem(name);
      session.removeItem(sessionKey(name));
    },
  };
}

/**
 * Wipe every CareerVerse-owned key from both web storages. Used by the
 * "Clear all local data" control, on sign-out, and on account deletion.
 */
export function clearAllLocalData(name = 'cv-app'): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(name);
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(`${name}:session`);
  } catch {
    /* storage unavailable — nothing to clear */
  }
}
