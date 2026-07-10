'use client';

/** Application Tracker — statuses, notes, deadlines per shortlisted school. */

import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useAppStore, type TrackerItem } from '@/lib/store/app';
import { useHydrated } from '@/components/ui/useHydrated';
import { dataset } from '@/lib/data/seed';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

const STATUSES: Array<{ id: TrackerItem['status']; en: string; ja: string }> = [
  { id: 'interested', en: 'Interested', ja: '検討中' },
  { id: 'preparing', en: 'Preparing', ja: '準備中' },
  { id: 'applied', en: 'Applied', ja: '出願済み' },
  { id: 'interview', en: 'Interview', ja: '面接' },
  { id: 'result', en: 'Result', ja: '結果' },
];

export default function TrackerPage(): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';
  const hydrated = useHydrated();
  const tracker = useAppStore((s) => s.tracker);
  const updateTracker = useAppStore((s) => s.updateTracker);
  const removeFromTracker = useAppStore((s) => s.removeFromTracker);

  if (!hydrated) return <PageSkeleton />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">{ja ? '出願トラッカー' : 'Application Tracker'}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {ja ? '出願の進捗・メモ・締切を1か所で管理します。' : 'Track application progress, notes, and deadlines in one place.'}
      </p>

      {tracker.length === 0 ? (
        <div className="mt-10 rounded-panel border border-dashed border-ink/15 bg-white/50 p-12 text-center">
          <p className="text-sm text-ink-soft">
            {ja ? 'まだ学校が追加されていません。学校ページから追加できます。' : 'No schools yet. Add one from any school page.'}
          </p>
          <Link href="/schools" className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-gradient-to-r from-cyan2 to-violet2 px-6 text-sm font-semibold text-white shadow-glow">
            {ja ? '学校を探す →' : 'Explore schools →'}
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {tracker.map((item) => {
            const school = dataset.schools.find((s) => s.id === item.schoolId);
            if (!school) return null;
            return (
              <article key={item.id} className="cv-glass cv-depth-card rounded-panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-ink">
                      <Link href={`/schools/${school.id}`} className="hover:text-cyan2">
                        {ja ? school.nameJa : school.nameEn}
                      </Link>
                    </h2>
                    <p className="text-xs text-ink-soft">
                      {ja ? '出願月' : 'Application months'}: {school.applicationMonths.join(', ')} · JLPT {school.jlptRequired.toUpperCase()}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromTracker(item.id)}
                    aria-label={ja ? '削除' : 'Remove'}
                    className="rounded-full p-2 text-ink-soft hover:bg-coral/10 hover:text-coral"
                  >
                    ✕
                  </button>
                </div>

                {/* Status pipeline */}
                <div role="group" aria-label={ja ? 'ステータス' : 'Status'} className="mt-4 flex flex-wrap gap-1.5">
                  {STATUSES.map((s, i) => {
                    const activeIdx = STATUSES.findIndex((x) => x.id === item.status);
                    const active = item.status === s.id;
                    const passed = i < activeIdx;
                    return (
                      <button
                        key={s.id}
                        onClick={() => updateTracker(item.id, { status: s.id })}
                        aria-pressed={active}
                        className={`min-h-[40px] rounded-full border px-4 text-xs font-semibold transition-colors ${
                          active
                            ? 'border-cyan2 bg-cyan2 text-white'
                            : passed
                              ? 'border-cyan2/40 bg-cyan2/10 text-cyan2'
                              : 'border-ink/10 bg-white/60 text-ink-soft'
                        }`}
                      >
                        {ja ? s.ja : s.en}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <label className="text-sm">
                    <span className="mb-1 block text-xs font-semibold text-ink-soft">{ja ? 'メモ' : 'Notes'}</span>
                    <textarea
                      value={item.note}
                      onChange={(e) => updateTracker(item.id, { note: e.target.value })}
                      rows={2}
                      placeholder={ja ? '必要書類、連絡内容など…' : 'Documents needed, contacts, etc.'}
                      className="w-full rounded-xl border border-ink/10 bg-white p-3 text-sm text-ink"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-xs font-semibold text-ink-soft">{ja ? '締切リマインダー' : 'Deadline reminder'}</span>
                    <input
                      type="date"
                      value={item.deadline ?? ''}
                      onChange={(e) => updateTracker(item.id, { deadline: e.target.value })}
                      className="min-h-[44px] rounded-xl border border-ink/10 bg-white px-3 text-sm text-ink"
                    />
                  </label>
                </div>
                {item.deadline && (
                  <p className="mt-2 text-xs font-medium text-amber2">
                    ⏰ {ja ? `締切: ${item.deadline}` : `Deadline: ${item.deadline}`}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
