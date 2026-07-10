'use client';

/**
 * Admin invite management. Only hashes are ever stored or configured — the
 * plain code exists only in this browser at generation time and in the
 * invitation the founder sends. Activation is via the INVITE_CODE_HASHES env
 * (hash[:expiresISO[:maxUses]], comma-separated); removing an entry revokes
 * the code immediately. A local registry tracks what was issued to whom.
 */

import { useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface IssuedInvite {
  id: string;
  label: string;
  hash: string;
  expiresAt?: string;
  maxUses?: number;
  createdAt: string;
  revoked: boolean;
}

interface InviteRegistryState {
  invites: IssuedInvite[];
  add: (i: Omit<IssuedInvite, 'id' | 'createdAt' | 'revoked'>) => void;
  setRevoked: (id: string, revoked: boolean) => void;
}

const useInviteRegistry = create<InviteRegistryState>()(
  persist(
    (set, get) => ({
      invites: [],
      add: (i) =>
        set({
          invites: [
            { ...i, id: Math.random().toString(36).slice(2, 10), createdAt: new Date().toISOString(), revoked: false },
            ...get().invites,
          ],
        }),
      setRevoked: (id, revoked) =>
        set({ invites: get().invites.map((x) => (x.id === id ? { ...x, revoked } : x)) }),
    }),
    { name: 'cv-admin-invites', storage: createJSONStorage(() => localStorage) },
  ),
);

function randomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  const raw = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  return `CV-${raw.slice(0, 5)}-${raw.slice(5)}`;
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function InviteManager(): React.JSX.Element {
  const { invites, add, setRevoked } = useInviteRegistry();
  const [label, setLabel] = useState('');
  const [expires, setExpires] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [generated, setGenerated] = useState<{ code: string; hash: string } | null>(null);

  const activeEnvValue = invites
    .filter((i) => !i.revoked)
    .map((i) => [i.hash, i.expiresAt ?? '', i.maxUses ?? ''].filter(Boolean).join(':'))
    .join(',');

  const generate = async (): Promise<void> => {
    const code = randomCode();
    const hash = await sha256Hex(code.trim().toUpperCase());
    add({
      label: label || 'unnamed',
      hash,
      ...(expires ? { expiresAt: expires } : {}),
      ...(maxUses ? { maxUses: Number(maxUses) } : {}),
    });
    setGenerated({ code, hash });
    setLabel('');
  };

  return (
    <section className="cv-glass mt-6 rounded-panel p-5">
      <h2 className="font-bold text-ink">Invite codes</h2>
      <p className="mt-1 text-xs text-ink-soft">
        Codes are hashed with SHA-256; the plain code is shown once, below, and never stored.
        Activation: copy the env value into <code className="rounded bg-ink/5 px-1">INVITE_CODE_HASHES</code> on the
        deployment and redeploy. Removing an entry revokes the code. Expiry is enforced server-side; use-count limits
        are best-effort until a shared database is configured (documented limitation).
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <label className="text-xs font-semibold text-ink-soft">
          Label (who is it for)
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1 block min-h-[40px] w-full rounded-lg border border-ink/10 bg-white px-2 text-sm font-normal text-ink" />
        </label>
        <label className="text-xs font-semibold text-ink-soft">
          Expires (optional)
          <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className="mt-1 block min-h-[40px] w-full rounded-lg border border-ink/10 bg-white px-2 text-sm font-normal text-ink" />
        </label>
        <label className="text-xs font-semibold text-ink-soft">
          Max uses (optional)
          <input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="mt-1 block min-h-[40px] w-full rounded-lg border border-ink/10 bg-white px-2 text-sm font-normal text-ink" />
        </label>
        <button onClick={() => void generate()} className="min-h-[40px] self-end rounded-full bg-ink px-5 text-xs font-semibold text-white">
          Generate code
        </button>
      </div>

      {generated && (
        <div className="mt-4 rounded-xl border border-emerald2/30 bg-emerald2/5 p-4 text-sm">
          <p className="font-bold text-ink">
            New invite code: <code className="rounded bg-white px-2 py-0.5 text-emerald2">{generated.code}</code>
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            Share this with the invitee now — it is not stored anywhere. Hash: <code className="break-all">{generated.hash}</code>
          </p>
        </div>
      )}

      {invites.length > 0 && (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <caption className="sr-only">Issued invites</caption>
              <thead>
                <tr className="border-b border-ink/10 uppercase tracking-wide text-ink-soft">
                  <th scope="col" className="py-2 pr-3">Label</th>
                  <th scope="col" className="py-2 pr-3">Hash (prefix)</th>
                  <th scope="col" className="py-2 pr-3">Expires</th>
                  <th scope="col" className="py-2 pr-3">Max uses</th>
                  <th scope="col" className="py-2 pr-3">Created</th>
                  <th scope="col" className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((i) => (
                  <tr key={i.id} className="border-b border-ink/5">
                    <td className="py-2 pr-3 font-medium text-ink">{i.label}</td>
                    <td className="py-2 pr-3"><code>{i.hash.slice(0, 12)}…</code></td>
                    <td className="py-2 pr-3">{i.expiresAt ?? '—'}</td>
                    <td className="py-2 pr-3">{i.maxUses ?? '—'}</td>
                    <td className="py-2 pr-3 tabular-nums">{new Date(i.createdAt).toLocaleDateString()}</td>
                    <td className="py-2">
                      <button
                        onClick={() => setRevoked(i.id, !i.revoked)}
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                          i.revoked ? 'border-ink/10 text-ink-soft' : 'border-coral/40 text-coral hover:bg-coral/5'
                        }`}
                      >
                        {i.revoked ? 'revoked — undo' : 'revoke'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 rounded-xl bg-ink/5 p-3 text-xs">
            <p className="font-semibold text-ink">INVITE_CODE_HASHES value (active codes):</p>
            <code className="mt-1 block break-all text-ink-soft">{activeEnvValue || '(none — the default beta code stays active until this is set)'}</code>
          </div>
        </>
      )}
    </section>
  );
}
