'use client';

/** Scholarship Explorer. */

import { useLocale } from 'next-intl';
import { dataset } from '@/lib/data/seed';
import { Badge } from '@/components/ui/Badge';
import { yen } from '@/lib/i18n/bi';

export default function ScholarshipsPage(): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">{ja ? '奨学金' : 'Scholarship Explorer'}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {ja
          ? 'ベータ版の奨学金データはデモです。通知はプロフィール情報が十分な場合にのみ行われます。'
          : 'Beta scholarship data is demonstrational. Match alerts are only sent when your profile has enough information.'}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {dataset.scholarships.map((s) => (
          <article key={s.id} className="cv-glass cv-depth-card rounded-panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="font-bold text-ink">{ja ? s.nameJa : s.nameEn}</h2>
              {s.provenance.isDemo && <Badge tone="demo">{ja ? 'デモ' : 'Demo'}</Badge>}
            </div>
            <p className="mt-1 text-xs text-ink-soft">{s.provider}</p>
            <p className="mt-3 text-xl font-bold text-amber2">
              {yen(s.amountJpy)}
              <span className="text-sm font-medium text-ink-soft">
                /{s.per === 'month' ? (ja ? '月' : 'month') : s.per === 'year' ? (ja ? '年' : 'year') : ja ? '一括' : 'one-time'}
              </span>
            </p>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-xs font-semibold text-ink-soft">{ja ? '対象' : 'Eligibility'}</dt>
                <dd className="text-ink">{ja ? s.eligibilityJa : s.eligibilityEn}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-soft">{ja ? '締切' : 'Deadline'}</dt>
                <dd className="text-ink">{ja ? s.deadlineJa : s.deadlineEn}</dd>
              </div>
              <div className="flex flex-wrap gap-2 pt-1 text-xs text-ink-soft">
                <span>{s.region === 'kanto' ? (ja ? '関東' : 'Kanto') : ja ? '全国' : 'National'}</span>
                <span>· {s.institutionTypes.map((t) => (t === 'university' ? (ja ? '大学' : 'Univ.') : ja ? '専門' : 'Voc.')).join('/')}</span>
                <span>· JLPT {s.minJlpt.toUpperCase()}+</span>
                <span>· {s.nationalityRestricted ? (ja ? '国籍制限あり' : 'Nationality restricted') : ja ? '国籍制限なし' : 'No nationality restriction'}</span>
              </div>
            </dl>
            <p className="mt-3 text-xs text-ink-soft">
              {ja ? '最終確認' : 'Last checked'}: {s.provenance.lastVerified}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
