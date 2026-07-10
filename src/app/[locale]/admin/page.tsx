'use client';

/** Admin entry — unlisted in public navigation. */

import { AdminGate } from '@/components/admin/AdminGate';
import { Link } from '@/i18n/routing';

export default function AdminPage(): React.JSX.Element {
  return (
    <AdminGate>
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-ink">CareerVerse Admin</h1>
        <p className="mt-2 text-sm text-ink-soft">You are signed in. All actions are recorded in the audit log.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link href="/admin/dashboard" className="cv-glass cv-depth-card rounded-panel p-6 font-semibold text-ink hover:text-cyan2">
            📊 Dashboard & records
          </Link>
          <Link href="/admin/review" className="cv-glass cv-depth-card rounded-panel p-6 font-semibold text-ink hover:text-cyan2">
            ✅ Review queue
          </Link>
        </div>
        <button
          onClick={() => {
            void fetch('/api/admin/logout', { method: 'POST' }).then(() => window.location.reload());
          }}
          className="mt-8 min-h-[44px] rounded-full border border-ink/10 px-6 text-sm font-semibold text-ink-soft hover:text-ink"
        >
          Sign out
        </button>
      </div>
    </AdminGate>
  );
}
