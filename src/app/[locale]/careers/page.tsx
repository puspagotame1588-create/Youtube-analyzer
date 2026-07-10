'use client';

/** Career Explorer — the five initial deep categories. */

import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { dataset } from '@/lib/data/seed';
import { Badge } from '@/components/ui/Badge';
import { yen } from '@/lib/i18n/bi';

const ICONS: Record<string, string> = {
  business: '◫',
  it: '⌘',
  hospitality: '⛩',
  foodservice: '🍱',
  realestate: '⌂',
};

export default function CareersPage(): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">{ja ? 'キャリア探索' : 'Career Explorer'}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {ja
          ? '5つの分野を深く。各キャリアタワーで入口から長期ポジションまでの階段を確認できます。'
          : 'Five deep fields. Each Career Tower shows the ladder from entry roles to long-term positions.'}
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {dataset.careers.map((c) => {
          const entry = c.levels[0];
          const top = c.levels[c.levels.length - 1];
          return (
            <Link
              key={c.id}
              href={`/careers/${c.id}`}
              className="cv-glass cv-depth-card group rounded-panel p-6 transition-all hover:-translate-y-0.5 hover:shadow-glow"
            >
              <div className="flex items-start justify-between">
                <span aria-hidden="true" className="text-3xl">{ICONS[c.field]}</span>
                <Badge tone={c.demandScore >= 85 ? 'verified' : c.demandScore >= 70 ? 'info' : 'uncertain'}>
                  {ja ? `需要 ${c.demandScore}/100` : `Demand ${c.demandScore}/100`}
                </Badge>
              </div>
              <h2 className="mt-3 text-lg font-bold text-ink group-hover:text-cyan2">{ja ? c.nameJa : c.nameEn}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{ja ? c.dailyWorkJa : c.dailyWorkEn}</p>
              <dl className="mt-4 space-y-1 text-xs text-ink-soft">
                <div className="flex justify-between">
                  <dt>{ja ? '入口の日本語' : 'Entry Japanese'}</dt>
                  <dd className="font-semibold text-ink">JLPT {c.minJlptEntry.toUpperCase()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>{ja ? '初任給（デモ）' : 'Entry salary (demo)'}</dt>
                  <dd className="font-semibold text-ink">{entry ? `${yen(entry.salaryJpy.min)}〜` : '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>{ja ? '長期ポジション' : 'Long-term role'}</dt>
                  <dd className="font-semibold text-ink">{top ? (ja ? top.titleJa : top.titleEn) : '—'}</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm font-semibold text-violet2">{ja ? 'キャリアタワーを見る →' : 'View Career Tower →'}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
