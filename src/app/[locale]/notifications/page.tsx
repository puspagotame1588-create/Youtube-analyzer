'use client';

/** Notifications — deadlines, saved-data events, beta announcements. */

import { useLocale } from 'next-intl';
import { useAppStore } from '@/lib/store/app';
import { useHydrated } from '@/components/ui/useHydrated';
import { dataset } from '@/lib/data/seed';

export default function NotificationsPage(): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';
  const hydrated = useHydrated();
  const notifications = useAppStore((s) => s.notifications);
  const markRead = useAppStore((s) => s.markRead);
  const tracker = useAppStore((s) => s.tracker);

  if (!hydrated) return <div className="p-20 text-center text-ink-soft">…</div>;

  const deadlines = tracker
    .filter((t) => t.deadline)
    .map((t) => ({ t, school: dataset.schools.find((s) => s.id === t.schoolId) }))
    .filter((x) => x.school);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">{ja ? 'お知らせ' : 'Notifications'}</h1>

      {deadlines.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber2">{ja ? '締切リマインダー' : 'Deadline reminders'}</h2>
          <ul className="mt-2 space-y-2">
            {deadlines.map(({ t, school }) => (
              <li key={t.id} className="rounded-panel border border-amber2/25 bg-amber2/5 p-4 text-sm">
                <strong className="text-ink">{ja ? school!.nameJa : school!.nameEn}</strong>
                <span className="ml-2 text-ink-soft">⏰ {t.deadline}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        {notifications.length === 0 && deadlines.length === 0 ? (
          <div className="rounded-panel border border-dashed border-ink/15 bg-white/50 p-12 text-center text-sm text-ink-soft">
            {ja ? 'お知らせはまだありません。' : 'No notifications yet.'}
          </div>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => markRead(n.id)}
                  className={`w-full rounded-panel p-4 text-left text-sm transition-colors ${
                    n.read ? 'bg-white/50 text-ink-soft' : 'cv-glass cv-depth-card text-ink'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <strong>{ja ? n.titleJa : n.titleEn}</strong>
                    {!n.read && <span className="shrink-0 rounded-full bg-cyan2/10 px-2 py-0.5 text-[10px] font-bold text-cyan2">{ja ? '未読' : 'NEW'}</span>}
                  </div>
                  <p className="mt-1 text-xs">{ja ? n.bodyJa : n.bodyEn}</p>
                  <p className="mt-1 text-[10px] text-ink-soft/70">{new Date(n.createdAt).toLocaleString(ja ? 'ja-JP' : 'en-US')}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
