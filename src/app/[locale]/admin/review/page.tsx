'use client';

/**
 * Admin review queue — correction reports from users, draft records
 * (AI-extracted data always lands here; it can never auto-publish), and
 * a form for staging new manual drafts.
 */

import { useState } from 'react';
import { AdminGate } from '@/components/admin/AdminGate';
import { Link } from '@/i18n/routing';
import { useAdminStore, type DraftRecord } from '@/lib/store/admin';
import { useAppStore } from '@/lib/store/app';
import { useHydrated } from '@/components/ui/useHydrated';

export default function AdminReviewPage(): React.JSX.Element {
  const hydrated = useHydrated();
  const corrections = useAppStore((s) => s.corrections);
  const tickets = useAppStore((s) => s.tickets);
  const reviewed = useAdminStore((s) => s.reviewedCorrections);
  const markReviewed = useAdminStore((s) => s.markCorrectionReviewed);
  const drafts = useAdminStore((s) => s.drafts);
  const addDraft = useAdminStore((s) => s.addDraft);
  const setDraftStatus = useAdminStore((s) => s.setDraftStatus);

  const [form, setForm] = useState({ type: 'school' as DraftRecord['type'], nameEn: '', nameJa: '', sourceUrl: '', note: '' });

  return (
    <AdminGate>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-ink">Admin — Review queue</h1>
          <Link href="/admin/dashboard" className="rounded-full border border-ink/10 px-5 py-2 text-sm font-semibold text-ink">← Dashboard</Link>
        </div>

        <section className="cv-glass mt-6 rounded-panel p-5">
          <h2 className="font-bold text-ink">Correction reports</h2>
          {hydrated && (corrections.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">No correction reports. Users can file them from any record page.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {corrections.map((c) => {
                const done = reviewed.includes(c.id);
                return (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/70 p-3">
                    <div>
                      <strong className="text-ink">{c.recordType}: {c.recordId}</strong>
                      <p className="text-xs text-ink-soft">{c.message}</p>
                      <p className="text-[10px] text-ink-soft/70">{new Date(c.createdAt).toLocaleString()}</p>
                    </div>
                    {done ? (
                      <span className="rounded-full bg-emerald2/10 px-3 py-1 text-xs font-semibold text-emerald2">reviewed ✓</span>
                    ) : (
                      <button onClick={() => markReviewed(c.id)} className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white">
                        Mark reviewed
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          ))}
        </section>

        <section className="cv-glass mt-4 rounded-panel p-5">
          <h2 className="font-bold text-ink">Draft records (pre-publication)</h2>
          <p className="mt-1 text-xs text-ink-soft">
            AI-extracted and manually staged records wait here. Nothing publishes without explicit approval — publishing requires source URL, retrieval date, and reviewer.
          </p>
          {hydrated && drafts.length > 0 && (
            <ul className="mt-3 space-y-2 text-sm">
              {drafts.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/70 p-3">
                  <div>
                    <strong className="text-ink">[{d.type}] {d.nameEn} / {d.nameJa}</strong>
                    <p className="text-xs text-ink-soft">{d.sourceUrl} — {d.note}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      d.status === 'published' ? 'bg-emerald2/10 text-emerald2' : d.status === 'rejected' ? 'bg-coral/10 text-coral' : 'bg-amber2/10 text-amber2'
                    }`}>{d.status}</span>
                    {d.status === 'draft' && (
                      <>
                        <button onClick={() => setDraftStatus(d.id, 'reviewed')} className="rounded-full border border-ink/10 px-3 py-1.5 text-xs font-semibold text-ink">Mark reviewed</button>
                        <button onClick={() => setDraftStatus(d.id, 'rejected')} className="rounded-full border border-coral/30 px-3 py-1.5 text-xs font-semibold text-coral">Reject</button>
                      </>
                    )}
                    {d.status === 'reviewed' && (
                      <button onClick={() => setDraftStatus(d.id, 'published')} className="rounded-full bg-emerald2 px-3 py-1.5 text-xs font-semibold text-white">Publish</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form
            className="mt-4 grid gap-3 rounded-xl border border-ink/10 bg-white/60 p-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.nameEn || !form.sourceUrl) return;
              addDraft(form);
              setForm({ type: 'school', nameEn: '', nameJa: '', sourceUrl: '', note: '' });
            }}
          >
            <label className="text-xs font-semibold text-ink-soft">
              Type
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as DraftRecord['type'] })} className="mt-1 block min-h-[40px] w-full rounded-lg border border-ink/10 bg-white px-2 text-sm font-normal text-ink">
                {(['school', 'scholarship', 'career', 'job'] as const).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-ink-soft">
              Source URL (required)
              <input value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} className="mt-1 block min-h-[40px] w-full rounded-lg border border-ink/10 bg-white px-2 text-sm font-normal text-ink" placeholder="https://official-site.example" />
            </label>
            <label className="text-xs font-semibold text-ink-soft">
              Name (EN, required)
              <input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="mt-1 block min-h-[40px] w-full rounded-lg border border-ink/10 bg-white px-2 text-sm font-normal text-ink" />
            </label>
            <label className="text-xs font-semibold text-ink-soft">
              Name (JA)
              <input value={form.nameJa} onChange={(e) => setForm({ ...form, nameJa: e.target.value })} className="mt-1 block min-h-[40px] w-full rounded-lg border border-ink/10 bg-white px-2 text-sm font-normal text-ink" />
            </label>
            <label className="text-xs font-semibold text-ink-soft sm:col-span-2">
              Note
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="mt-1 block min-h-[40px] w-full rounded-lg border border-ink/10 bg-white px-2 text-sm font-normal text-ink" />
            </label>
            <button type="submit" className="min-h-[40px] rounded-full bg-ink px-5 text-xs font-semibold text-white sm:col-span-2">
              Stage as draft
            </button>
          </form>
        </section>

        <section className="cv-glass mt-4 rounded-panel p-5">
          <h2 className="font-bold text-ink">Support tickets</h2>
          {hydrated && (tickets.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">No tickets on this device.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {tickets.map((t) => (
                <li key={t.id} className="rounded-xl bg-white/70 p-3">
                  <div className="flex flex-wrap justify-between gap-2">
                    <strong className="text-ink">{t.category}</strong>
                    <span className="text-xs text-ink-soft">
                      {new Date(t.createdAt).toLocaleString()} · {t.status}
                      {t.escalated && <span className="ml-1 font-semibold text-indigo2">· escalated</span>}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">{t.message}</p>
                  {t.email && <p className="mt-1 text-[10px] text-ink-soft/70">reply-to: {t.email}</p>}
                </li>
              ))}
            </ul>
          ))}
        </section>
      </div>
    </AdminGate>
  );
}
