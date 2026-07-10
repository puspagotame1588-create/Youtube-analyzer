'use client';

/** Scholarship Explorer. */

import { useLocale } from 'next-intl';
import { dataset } from '@/lib/data/seed';
import { realScholarships } from '@/lib/data/real';
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

      {/* Real programs — official links checked */}
      <section className="mt-6 rounded-panel border border-emerald2/25 bg-emerald2/5 p-5" aria-labelledby="real-schol-title">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="real-schol-title" className="text-lg font-bold text-ink">
            {ja ? '実在する奨学金制度（公式リンク確認済み）' : 'Real scholarship programs (official links checked)'}
          </h2>
          <Badge tone="verified">{ja ? '確認日 2026-07-10' : 'Checked 2026-07-10'}</Badge>
        </div>
        <p className="mt-1 text-xs text-ink-soft">
          {ja
            ? '金額・締切・対象条件は年度で変わります。必ず公式ページでご確認ください。多くは在籍校を通じた申請です。'
            : 'Amounts, deadlines, and eligibility change by year — always confirm on the official page. Most programs are applied to through your school.'}
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {realScholarships.map((s) => (
            <li key={s.id} className="rounded-xl border border-ink/5 bg-white/80 p-4 text-sm">
              <h3 className="font-bold text-ink">{ja ? s.nameJa : s.nameEn}</h3>
              <p className="mt-0.5 text-xs text-ink-soft">{s.provider}</p>
              <p className="mt-1 text-xs text-ink-soft">{ja ? s.noteJa : s.noteEn}</p>
              <a
                href={s.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block rounded-full border border-emerald2/40 px-3 py-1.5 text-xs font-semibold text-emerald2 hover:bg-emerald2/10"
              >
                {ja ? '公式サイト ↗' : 'Official site ↗'}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <h2 className="mt-10 text-lg font-bold text-ink">{ja ? 'デモデータ（表示例）' : 'Demonstration records (display examples)'}</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
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
