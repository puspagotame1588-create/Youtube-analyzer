'use client';

/**
 * Admin gate: verifies the server-side session cookie via /api/admin/session
 * and renders a login form until authenticated. The access code is checked
 * only on the server.
 */

import { useEffect, useState, type ReactNode } from 'react';

export function AdminGate({ children }: { children: ReactNode }): React.JSX.Element {
  const [state, setState] = useState<'checking' | 'login' | 'ok'>('checking');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch('/api/admin/session')
      .then((r) => setState(r.ok ? 'ok' : 'login'))
      .catch(() => setState('login'));
  }, []);

  if (state === 'checking') {
    return <div className="p-20 text-center text-sm text-ink-soft">Checking session…</div>;
  }

  if (state === 'login') {
    return (
      <div className="mx-auto max-w-sm px-4 py-20">
        <div className="rounded-panel border border-ink/10 bg-white p-8 shadow-panel">
          <h1 className="text-lg font-bold text-ink">CareerVerse Admin</h1>
          <p className="mt-1 text-xs text-ink-soft">Restricted area. All actions are audited.</p>
          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              setBusy(true);
              setError(null);
              void fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
              })
                .then((r) => {
                  if (r.ok) setState('ok');
                  else if (r.status === 503)
                    setError('Admin login is disabled: no strong ADMIN_ACCESS_CODE is configured (fail-closed). Run scripts/setup-credentials.mjs and set the env var.');
                  else setError(r.status === 429 ? 'Too many attempts — wait 10 minutes.' : 'Invalid access code.');
                })
                .catch(() => setError('Network error.'))
                .finally(() => setBusy(false));
            }}
          >
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-ink-soft">Access code</span>
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-ink/10 bg-white px-3 text-ink"
                autoComplete="current-password"
              />
            </label>
            {error && <p role="alert" className="text-xs text-coral">{error}</p>}
            <button type="submit" disabled={busy} className="min-h-[44px] w-full rounded-full bg-ink text-sm font-semibold text-white disabled:opacity-50">
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
