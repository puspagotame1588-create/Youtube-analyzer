'use client';

/**
 * Admin dashboard — record inventory with verification-state control,
 * beta users (local mode), feature flags, and the audit log.
 */

import { AdminGate } from '@/components/admin/AdminGate';
import { InviteManager } from '@/components/admin/InviteManager';
import { Link } from '@/i18n/routing';
import { dataset } from '@/lib/data/seed';
import { useAdminStore } from '@/lib/store/admin';
import { useAppStore } from '@/lib/store/app';
import { useHydrated } from '@/components/ui/useHydrated';
import type { VerificationStatus } from '@/lib/data/types';

const STATES: VerificationStatus[] = ['draft', 'reviewed', 'published', 'outdated', 'archived'];

const FLAGS = [
  { key: 'payments', enabled: false, note: 'Stripe integration — off for private beta' },
  { key: 'consultation-booking', enabled: false, note: 'Human consultation booking placeholder' },
  { key: 'document-upload', enabled: true, note: 'Document extraction pipeline' },
  { key: 'dark-mode', enabled: false, note: 'Beta default is light mode' },
];

function Records(): React.JSX.Element {
  const overrides = useAdminStore((s) => s.overrides);
  const setOverride = useAdminStore((s) => s.setOverride);

  const rows = [
    ...dataset.schools.map((r) => ({ id: r.id, type: 'school', name: r.nameEn, verification: r.provenance.verification, lastVerified: r.provenance.lastVerified, isDemo: r.provenance.isDemo })),
    ...dataset.scholarships.map((r) => ({ id: r.id, type: 'scholarship', name: r.nameEn, verification: r.provenance.verification, lastVerified: r.provenance.lastVerified, isDemo: r.provenance.isDemo })),
    ...dataset.careers.map((r) => ({ id: r.id, type: 'career', name: r.nameEn, verification: r.provenance.verification, lastVerified: r.provenance.lastVerified, isDemo: r.provenance.isDemo })),
    ...dataset.jobListings.map((r) => ({ id: r.id, type: 'job', name: r.titleEn, verification: r.provenance.verification, lastVerified: r.provenance.lastVerified, isDemo: r.provenance.isDemo })),
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-xs">
        <caption className="sr-only">Data records</caption>
        <thead>
          <tr className="border-b border-ink/10 uppercase tracking-wide text-ink-soft">
            <th scope="col" className="py-2 pr-3">Record</th>
            <th scope="col" className="py-2 pr-3">Type</th>
            <th scope="col" className="py-2 pr-3">Demo</th>
            <th scope="col" className="py-2 pr-3">Last verified</th>
            <th scope="col" className="py-2">Verification state</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-ink/5">
              <td className="py-2 pr-3 font-medium text-ink">{r.name}</td>
              <td className="py-2 pr-3">{r.type}</td>
              <td className="py-2 pr-3">{r.isDemo ? 'yes' : 'no'}</td>
              <td className="py-2 pr-3 tabular-nums">{r.lastVerified}</td>
              <td className="py-2">
                <select
                  value={overrides[r.id] ?? r.verification}
                  onChange={(e) => setOverride(r.id, e.target.value as VerificationStatus)}
                  aria-label={`Verification state for ${r.name}`}
                  className="rounded-lg border border-ink/10 bg-white px-2 py-1"
                >
                  {STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {overrides[r.id] && overrides[r.id] !== r.verification && (
                  <span className="ml-2 rounded-full bg-amber2/10 px-2 py-0.5 text-[10px] font-semibold text-amber2">override</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-ink-soft">
        Local beta: overrides are stored on this device and demonstrate the production review workflow (drafts never publish without approval).
      </p>
    </div>
  );
}

export default function AdminDashboardPage(): React.JSX.Element {
  const hydrated = useHydrated();
  const audit = useAdminStore((s) => s.audit);
  const account = useAppStore((s) => s.account);
  const tickets = useAppStore((s) => s.tickets);
  const corrections = useAppStore((s) => s.corrections);

  return (
    <AdminGate>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-ink">Admin — Dashboard</h1>
          <Link href="/admin/review" className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white">Review queue →</Link>
        </div>

        {hydrated && (
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {[
              { label: 'Records', value: dataset.schools.length + dataset.scholarships.length + dataset.careers.length + dataset.jobListings.length },
              { label: 'Beta users (this device)', value: account ? 1 : 0 },
              { label: 'Open tickets', value: tickets.filter((t) => t.status === 'open').length },
              { label: 'Correction reports', value: corrections.length },
            ].map((s) => (
              <div key={s.label} className="cv-glass rounded-panel p-4 text-center">
                <div className="text-2xl font-bold tabular-nums text-ink">{s.value}</div>
                <div className="text-xs text-ink-soft">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <section className="cv-glass mt-6 rounded-panel p-5">
          <h2 className="mb-3 font-bold text-ink">Data records</h2>
          {hydrated && <Records />}
        </section>

        {hydrated && <InviteManager />}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="cv-glass rounded-panel p-5">
            <h2 className="font-bold text-ink">Feature flags</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {FLAGS.map((f) => (
                <li key={f.key} className="flex items-center justify-between gap-2">
                  <span className="text-ink">{f.key}<span className="block text-xs text-ink-soft">{f.note}</span></span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${f.enabled ? 'bg-emerald2/10 text-emerald2' : 'bg-ink/5 text-ink-soft'}`}>
                    {f.enabled ? 'on' : 'off'}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="cv-glass rounded-panel p-5">
            <h2 className="font-bold text-ink">Beta users (local mode)</h2>
            {hydrated && account ? (
              <ul className="mt-3 text-sm text-ink">
                <li className="flex items-center justify-between rounded-xl bg-white/70 p-3">
                  <span>{account.displayName} · {account.email}</span>
                  <span className="text-xs text-ink-soft">joined {new Date(account.createdAt).toLocaleDateString()}</span>
                </li>
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-soft">No account on this device. (Production: Supabase user management.)</p>
            )}
          </section>
        </div>

        <section className="cv-glass mt-6 rounded-panel p-5">
          <h2 className="font-bold text-ink">Audit log</h2>
          {hydrated && (audit.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">No admin actions recorded yet.</p>
          ) : (
            <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto text-xs">
              {audit.map((a) => (
                <li key={a.id} className="flex flex-wrap justify-between gap-2 rounded-lg bg-white/60 px-3 py-2">
                  <span className="font-medium text-ink">{a.action}{a.recordId ? ` — ${a.recordId}` : ''}</span>
                  <span className="tabular-nums text-ink-soft">{new Date(a.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ))}
        </section>
      </div>
    </AdminGate>
  );
}
