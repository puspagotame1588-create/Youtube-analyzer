'use client';

/**
 * Career Detail — the Career Tower: long-term development as a vertical
 * structure. Depth-styled stacked levels (works on every tier), with skills,
 * Japanese level, qualifications, salary, visa compatibility and obstacles.
 */

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { dataset } from '@/lib/data/seed';
import { realJobLinks } from '@/lib/data/real';
import { Badge } from '@/components/ui/Badge';
import { yen } from '@/lib/i18n/bi';

export default function CareerDetailPage(): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';
  const params = useParams<{ id: string }>();
  const reducedMotion = useReducedMotion();
  const career = dataset.careers.find((c) => c.id === params.id);
  const [openLevel, setOpenLevel] = useState<string | null>(career?.levels[0]?.id ?? null);

  if (!career) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-ink">{ja ? 'キャリアが見つかりません' : 'Career not found'}</h1>
        <Link href="/careers" className="mt-4 inline-block text-sm text-cyan2 hover:underline">← {ja ? 'キャリア探索へ' : 'Back to Career Explorer'}</Link>
      </div>
    );
  }

  const jobs = dataset.jobListings.filter((j) => j.careerId === career.id);
  const levels = [...career.levels].reverse(); // top of the tower first

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/careers" className="text-sm text-indigo2 hover:underline">← {ja ? 'キャリア探索' : 'Career Explorer'}</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">{ja ? career.nameJa : career.nameEn}</h1>
        <div className="flex gap-1.5">
          {career.provenance.isDemo && <Badge tone="demo">{ja ? 'デモデータ' : 'Demonstration data'}</Badge>}
          <Badge tone="info">{ja ? '確認日' : 'Checked'}: {career.provenance.lastVerified}</Badge>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink">{ja ? career.dailyWorkJa : career.dailyWorkEn}</p>

      {/* The Tower */}
      <section className="mt-8" aria-labelledby="tower-title">
        <h2 id="tower-title" className="text-lg font-bold text-ink">{ja ? 'キャリアタワー' : 'Career Tower'}</h2>
        <p className="mt-1 text-xs text-ink-soft">
          {ja ? '上の階ほど長期のポジション。階をタップすると詳細が開きます。' : 'Higher floors are longer-term positions. Tap a floor for details.'}
        </p>
        <div className="mx-auto mt-6 max-w-xl">
          {levels.map((l, i) => {
            const depth = levels.length - i; // wider at the bottom
            const open = openLevel === l.id;
            return (
              <motion.div
                key={l.id}
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                style={{ width: `${72 + depth * (28 / levels.length)}%` }}
                className="mx-auto"
              >
                <button
                  onClick={() => setOpenLevel(open ? null : l.id)}
                  aria-expanded={open}
                  className={`cv-depth-card w-full rounded-xl border-2 p-4 text-left transition-all ${
                    open ? 'border-violet2 bg-violet2/10' : 'border-white/80 bg-white/85 hover:border-violet2/40'
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-bold text-ink">{ja ? l.titleJa : l.titleEn}</span>
                    <span className="text-xs text-ink-soft">
                      {l.yearsFromEntry === 0 ? (ja ? '入口' : 'Entry') : ja ? `+${l.yearsFromEntry}年` : `+${l.yearsFromEntry} yrs`}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-ink-soft">
                    {yen(l.salaryJpy.min)}–{yen(l.salaryJpy.max)}
                    {l.salaryJpy.isDemo && <span className="text-amber2"> {ja ? '（デモ値）' : '(demo)'}</span>} · JLPT {l.jlptTypical.toUpperCase()}
                  </div>
                </button>
                {open && (
                  <div className="mx-2 rounded-b-xl border border-t-0 border-violet2/20 bg-white/70 p-4 text-sm">
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-xs font-semibold text-ink-soft">{ja ? '必要スキル' : 'Required skills'}</dt>
                        <dd className="text-ink">{(ja ? l.skillsJa : l.skillsEn).join(' · ') || '—'}</dd>
                      </div>
                      {(l.qualificationsEn.length > 0 || l.qualificationsJa.length > 0) && (
                        <div>
                          <dt className="text-xs font-semibold text-ink-soft">{ja ? '資格' : 'Qualifications'}</dt>
                          <dd className="text-ink">{(ja ? l.qualificationsJa : l.qualificationsEn).join(' · ')}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-xs font-semibold text-ink-soft">{ja ? 'よくある壁' : 'Common obstacles'}</dt>
                        <dd className="text-ink">{ja ? l.obstaclesJa : l.obstaclesEn}</dd>
                      </div>
                      <div className="rounded-lg bg-indigo2/5 p-2">
                        <dt className="text-xs font-semibold text-indigo2">{ja ? '在留資格' : 'Residence status（在留資格）'}</dt>
                        <dd className="text-xs text-ink">{ja ? l.visaNoteJa : l.visaNoteEn}</dd>
                      </div>
                    </dl>
                  </div>
                )}
                {i < levels.length - 1 && (
                  <div aria-hidden="true" className="mx-auto h-3 w-0.5 bg-gradient-to-b from-violet2/50 to-transparent" />
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="cv-glass rounded-panel p-5 text-sm">
          <h2 className="font-bold text-ink">{ja ? '働き方' : 'Work-life'}</h2>
          <p className="mt-2 text-ink-soft">{ja ? career.workLifeJa : career.workLifeEn}</p>
        </section>
        <section className="rounded-panel border border-indigo2/20 bg-indigo2/5 p-5 text-sm">
          <h2 className="font-bold text-indigo2">{ja ? '長期定住との関係' : 'Long-term settlement relevance'}</h2>
          <p className="mt-2 text-ink">{ja ? career.settlementRelevanceJa : career.settlementRelevanceEn}</p>
        </section>
      </div>

      <section className="cv-glass mt-4 rounded-panel p-5">
        <h2 className="font-bold text-ink">{ja ? '公式の採用・就職支援リンク' : 'Official recruitment & job-support links'}</h2>
        <p className="mt-1 text-xs text-ink-soft">
          {ja
            ? 'この分野に関連する、実在の公式採用ページと公的支援機関です。募集内容は変わるため、必ず公式ページでご確認ください。'
            : 'Real official recruitment pages and public services related to this field. Openings change — always confirm on the official page.'}
        </p>
        <ul className="mt-3 space-y-3">
          {realJobLinks
            .filter((r) => r.field === career.field || r.field === 'all')
            .map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald2/20 bg-emerald2/5 p-3 text-sm">
                <div className="min-w-0">
                  <strong className="text-ink">{ja ? r.orgJa : r.orgEn}</strong>
                  <p className="text-xs text-ink-soft">
                    {ja ? r.noteJa : r.noteEn}
                    <span className="ml-1 text-emerald2">
                      · {r.kind === 'government' ? (ja ? '公的機関' : 'government') : ja ? '企業公式' : 'company official'} · {ja ? '確認日' : 'checked'} {r.meta.retrievedAt}
                    </span>
                  </p>
                </div>
                <a
                  href={r.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-emerald2/40 px-4 py-2 text-xs font-semibold text-emerald2 hover:bg-emerald2/10"
                >
                  {ja ? '公式ページ ↗' : 'Official page ↗'}
                </a>
              </li>
            ))}
        </ul>

        {jobs.length > 0 && (
          <>
            <h3 className="mt-6 text-sm font-bold text-ink">{ja ? '求人イメージ（架空のデモ）' : 'Vacancy examples (fictional demo)'}</h3>
            <p className="mt-1 text-xs text-ink-soft">
              {ja
                ? '以下は求人票の見え方を示す架空の例で、応募はできません。'
                : 'The listings below are fictional examples of how vacancies will look. They cannot be applied to.'}
            </p>
            <ul className="mt-2 space-y-3">
              {jobs.map((j) => (
                <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber2/20 bg-amber2/5 p-3 text-sm">
                  <div>
                    <strong className="text-ink">{ja ? j.titleJa : j.titleEn}</strong>
                    <p className="text-xs text-ink-soft">
                      {j.company} · {j.city} · {yen(j.salaryJpy.min)}–{yen(j.salaryJpy.max)} · JLPT {j.jlpt.toUpperCase()} ·{' '}
                      <span className="font-semibold text-amber2">{ja ? 'デモ' : 'demo'}</span>
                    </p>
                  </div>
                  <span
                    aria-disabled="true"
                    className="cursor-not-allowed rounded-full border border-ink/10 bg-white/60 px-4 py-2 text-xs font-semibold text-ink-soft"
                  >
                    {ja ? 'デモ — 応募先はありません' : 'Demonstration — no external application'}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
