'use client';

/** School Detail — full profile with provenance, correction reporting, tracker. */

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { dataset } from '@/lib/data/seed';
import { useAppStore } from '@/lib/store/app';
import { useHydrated } from '@/components/ui/useHydrated';
import { Badge } from '@/components/ui/Badge';
import { yen } from '@/lib/i18n/bi';

export default function SchoolDetailPage(): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';
  const hydrated = useHydrated();
  const params = useParams<{ id: string }>();
  const school = dataset.schools.find((s) => s.id === params.id);
  const addToTracker = useAppStore((s) => s.addToTracker);
  const tracker = useAppStore((s) => s.tracker);
  const toggleShortlist = useAppStore((s) => s.toggleShortlist);
  const shortlist = useAppStore((s) => s.shortlist);
  const submitCorrection = useAppStore((s) => s.submitCorrection);
  const [correcting, setCorrecting] = useState(false);
  const [correctionText, setCorrectionText] = useState('');
  const [correctionSent, setCorrectionSent] = useState(false);
  const [trackerMsg, setTrackerMsg] = useState(false);

  if (!school) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-ink">{ja ? '学校が見つかりません' : 'School not found'}</h1>
        <Link href="/schools" className="mt-4 inline-block text-sm text-cyan2 hover:underline">
          ← {ja ? 'スクールギャラクシーへ' : 'Back to School Galaxy'}
        </Link>
      </div>
    );
  }

  const total = school.firstYearCostJpy + school.annualTuitionJpy * (school.programYears - 1);
  const scholarships = dataset.scholarships.filter((s) => school.scholarshipIds.includes(s.id));
  const inTracker = hydrated && tracker.some((t) => t.schoolId === school.id);
  const sources = dataset.sources.filter((s) => school.provenance.sourceIds.includes(s.id));

  const questionsToAsk = ja
    ? [
        '留学生の在籍数と国籍の内訳を教えてください。',
        `JLPT ${school.jlptRequired.toUpperCase()}未満でも条件付き合格はありますか？`,
        '学費の分納・延納制度はありますか？',
        '留学生向けのキャリア支援は具体的に何がありますか？',
        '卒業生の就職先の例を教えてください。',
      ]
    : [
        'How many international students are enrolled, and from which countries?',
        `Is conditional admission possible below JLPT ${school.jlptRequired.toUpperCase()}?`,
        'Can tuition be paid in installments or deferred?',
        'What career support is specifically available to international students?',
        'Where have recent graduates been employed?',
      ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/schools" className="text-sm text-indigo2 hover:underline">
        ← {ja ? 'スクールギャラクシー' : 'School Galaxy'}
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">{ja ? school.nameJa : school.nameEn}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {school.institutionType === 'university' ? (ja ? '大学' : 'University') : ja ? '専門学校（専門士）' : 'Vocational school (専門士)'} ·{' '}
            {school.city.charAt(0).toUpperCase() + school.city.slice(1)} · {school.programYears}{ja ? '年課程' : '-year program'}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {school.provenance.isDemo && <Badge tone="demo">{ja ? 'デモデータ' : 'Demonstration data'}</Badge>}
          {school.sponsored && <Badge tone="sponsored">{ja ? 'スポンサー' : 'Sponsored'}</Badge>}
          <Badge tone="info">{ja ? '最終確認' : 'Last verified'}: {school.provenance.lastVerified}</Badge>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink">{ja ? school.descriptionJa : school.descriptionEn}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="cv-glass rounded-panel p-5">
          <h2 className="font-bold text-ink">{ja ? '費用' : 'Costs'}</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-ink-soft">{ja ? '初年度納入金' : 'First-year total'}</dt><dd className="font-semibold text-ink">{yen(school.firstYearCostJpy)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">{ja ? '2年目以降（年間）' : 'Annual tuition after'}</dt><dd className="font-semibold text-ink">{yen(school.annualTuitionJpy)}</dd></div>
            <div className="flex justify-between border-t border-ink/10 pt-2"><dt className="text-ink-soft">{ja ? '総額（目安）' : 'Program total (est.)'}</dt><dd className="font-bold text-ink">{yen(total)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">{ja ? '周辺の生活費（月）' : 'Living cost / month'}</dt><dd className="text-ink">{yen(school.livingCostMonthlyJpy)}</dd></div>
          </dl>
        </section>

        <section className="cv-glass rounded-panel p-5">
          <h2 className="font-bold text-ink">{ja ? '出願要件' : 'Admission requirements'}</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-ink-soft">JLPT</dt><dd className="font-semibold text-ink">{school.jlptRequired.toUpperCase()}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">EJU</dt><dd className="text-ink">{school.ejuRequired ? (ja ? '必要' : 'Required') : ja ? '不要' : 'Not required'}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">{ja ? '出願月' : 'Application months'}</dt><dd className="text-ink">{school.applicationMonths.join(', ')}</dd></div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">{ja ? '留学生サポート' : 'Intl support'}</dt>
              <dd className="text-ink">{school.intlSupport === 'excellent' ? (ja ? '手厚い' : 'Excellent') : school.intlSupport === 'good' ? (ja ? '良い' : 'Good') : ja ? '基本' : 'Basic'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">{ja ? '就職・進学実績' : 'Employment outcomes'}</dt>
              <dd className="text-ink">
                {school.employmentOutcome ? `${Math.round(school.employmentOutcome.value * 100)}%` : ja ? 'データなし' : 'No data'}
                {school.employmentOutcome?.isDemo && <span className="ml-1 text-[10px] text-amber2">{ja ? '（デモ）' : '(demo)'}</span>}
              </dd>
            </div>
          </dl>
          {!school.employmentOutcome && (
            <p className="mt-2 rounded-lg bg-amber2/10 px-3 py-2 text-xs text-amber2">
              {ja ? 'この項目のデータが不足しています。信頼度は下がります。' : 'Data missing for this field — confidence is reduced.'}
            </p>
          )}
        </section>
      </div>

      <section className="cv-glass mt-4 rounded-panel p-5">
        <h2 className="font-bold text-ink">{ja ? 'キャリア支援' : 'Career support'}</h2>
        <p className="mt-2 text-sm text-ink-soft">{ja ? school.careerSupportJa : school.careerSupportEn}</p>
      </section>

      {scholarships.length > 0 && (
        <section className="cv-glass mt-4 rounded-panel p-5">
          <h2 className="font-bold text-ink">{ja ? '対象となり得る奨学金' : 'Potentially matching scholarships'}</h2>
          <ul className="mt-3 space-y-3">
            {scholarships.map((s) => (
              <li key={s.id} className="rounded-xl border border-amber2/20 bg-amber2/5 p-3 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <strong className="text-ink">{ja ? s.nameJa : s.nameEn}</strong>
                  <span className="text-ink-soft">
                    {yen(s.amountJpy)}/{s.per === 'month' ? (ja ? '月' : 'mo') : s.per === 'year' ? (ja ? '年' : 'yr') : ja ? '一括' : 'once'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-soft">{ja ? s.eligibilityJa : s.eligibilityEn} · {ja ? s.deadlineJa : s.deadlineEn}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="cv-glass mt-4 rounded-panel p-5">
        <h2 className="font-bold text-ink">{ja ? '学校に聞くべき質問' : 'Questions to ask this school'}</h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-ink-soft">
          {questionsToAsk.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-panel border border-ink/5 bg-white/60 p-5 text-xs text-ink-soft">
        <h2 className="text-sm font-bold text-ink">{ja ? '情報源と検証' : 'Sources & verification'}</h2>
        <ul className="mt-2 space-y-1">
          {sources.map((s) => (
            <li key={s.id}>
              <span className="font-medium text-ink">{ja ? s.nameJa : s.nameEn}</span> · {s.type} · {ja ? '取得' : 'retrieved'} {s.retrievedAt}
            </li>
          ))}
        </ul>
        <p className="mt-2">
          {ja ? `検証状態: ${school.provenance.verification} · 確認者: ${school.provenance.reviewer} · 次回確認: ${school.provenance.reviewDueAt}`
              : `Verification: ${school.provenance.verification} · reviewer: ${school.provenance.reviewer} · next review: ${school.provenance.reviewDueAt}`}
        </p>
        {!correcting && !correctionSent && (
          <button onClick={() => setCorrecting(true)} className="mt-3 min-h-[40px] rounded-full border border-coral/40 px-4 text-xs font-semibold text-coral hover:bg-coral/5">
            {ja ? '誤りを報告する' : 'Report a correction'}
          </button>
        )}
        {correcting && (
          <form
            className="mt-3 flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!correctionText.trim()) return;
              submitCorrection({ recordType: 'school', recordId: school.id, message: correctionText.trim() });
              setCorrecting(false);
              setCorrectionSent(true);
            }}
          >
            <label htmlFor="correction" className="font-medium text-ink">
              {ja ? 'どの情報が誤っていますか？' : 'What information is incorrect?'}
            </label>
            <textarea
              id="correction"
              value={correctionText}
              onChange={(e) => setCorrectionText(e.target.value)}
              rows={3}
              className="rounded-xl border border-ink/10 bg-white p-3 text-sm text-ink"
            />
            <div className="flex gap-2">
              <button type="submit" className="min-h-[40px] rounded-full bg-ink px-5 text-xs font-semibold text-white">
                {ja ? '送信' : 'Submit'}
              </button>
              <button type="button" onClick={() => setCorrecting(false)} className="min-h-[40px] rounded-full px-4 text-xs text-ink-soft">
                {ja ? 'キャンセル' : 'Cancel'}
              </button>
            </div>
          </form>
        )}
        {correctionSent && (
          <p role="status" className="mt-3 font-medium text-emerald2">
            {ja ? '報告ありがとうございます。レビュー担当が確認します。' : 'Thank you — a reviewer will check this report.'}
          </p>
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => {
            addToTracker(school.id);
            setTrackerMsg(true);
          }}
          disabled={inTracker}
          className="min-h-[44px] rounded-full bg-gradient-to-r from-cyan2 to-violet2 px-6 text-sm font-semibold text-white shadow-glow disabled:opacity-60"
        >
          {inTracker ? (ja ? '出願トラッカーに追加済み ✓' : 'In application tracker ✓') : ja ? '出願トラッカーに追加' : 'Add to application tracker'}
        </button>
        <button
          onClick={() => toggleShortlist(school.id)}
          className="min-h-[44px] rounded-full border border-ink/10 bg-white/70 px-6 text-sm font-semibold text-ink"
        >
          {hydrated && shortlist.includes(school.id) ? (ja ? '候補から外す' : 'Remove from shortlist') : ja ? '候補に追加' : 'Shortlist'}
        </button>
        <Link href="/schools/compare" className="inline-flex min-h-[44px] items-center rounded-full border border-ink/10 bg-white/70 px-6 text-sm font-semibold text-ink">
          {ja ? '学校を比較' : 'Compare schools'}
        </Link>
      </div>
      {trackerMsg && (
        <p role="status" className="mt-3 text-sm font-medium text-emerald2">
          {ja ? '出願トラッカーに追加しました。' : 'Added to your application tracker.'}
        </p>
      )}
    </div>
  );
}
