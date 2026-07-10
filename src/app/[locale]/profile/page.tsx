'use client';

/**
 * Profile — progressive collection with uncertainty support and a
 * completeness meter that explains what would improve reliability.
 */

import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useAppStore } from '@/lib/store/app';
import { useHydrated } from '@/components/ui/useHydrated';
import type { EducationLevel, JlptLevel, LocationId } from '@/lib/simulation/types';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

export default function ProfilePage(): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';
  const hydrated = useHydrated();
  const account = useAppStore((s) => s.account);
  const draft = useAppStore((s) => s.profileDraft);
  const setDraft = useAppStore((s) => s.setProfileDraft);
  const scenarios = useAppStore((s) => s.scenarios);
  const deleteScenario = useAppStore((s) => s.deleteScenario);

  if (!hydrated) return <PageSkeleton />;

  if (!account) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-ink">{ja ? 'プロフィールにはアカウントが必要です' : 'Profile requires an account'}</h1>
        <Link href="/auth" className="mt-6 inline-flex min-h-[44px] items-center rounded-full bg-ink px-8 py-2.5 text-sm font-semibold text-white">
          {ja ? 'アカウント作成 →' : 'Create account →'}
        </Link>
      </div>
    );
  }

  const fields: Array<{ key: string; label: string; filled: boolean; hint: string }> = [
    { key: 'goal', label: ja ? '目標' : 'Goal', filled: Boolean(draft.goalText), hint: ja ? '目標があると分野の一致度が正確になります' : 'improves interest matching' },
    { key: 'field', label: ja ? '分野' : 'Field', filled: Boolean(draft.field), hint: ja ? '推奨ルートの中心です' : 'drives route generation' },
    { key: 'education', label: ja ? '学歴' : 'Education', filled: Boolean(draft.education), hint: ja ? '在留資格の実現性に影響します' : 'affects visa feasibility' },
    { key: 'jlpt', label: 'JLPT', filled: Boolean(draft.jlptCurrent), hint: ja ? '就職実現性に大きく影響します' : 'strongly affects employment feasibility' },
    { key: 'budget', label: ja ? '予算' : 'Budget', filled: Boolean(draft.budgetJpy), hint: ja ? '費用適合度の計算に必要です' : 'needed for affordability' },
    { key: 'location', label: ja ? '希望地' : 'Location', filled: Boolean(draft.location), hint: ja ? '学校の選定に使われます' : 'used for school selection' },
    { key: 'salary', label: ja ? '希望給与' : 'Desired salary', filled: Boolean(draft.desiredSalaryJpy), hint: ja ? '給与スコアが正確になります' : 'refines salary scoring' },
  ];
  const completeness = Math.round((fields.filter((f) => f.filled).length / fields.length) * 100);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">{ja ? 'プロフィール' : 'Profile'}</h1>
      <p className="mt-1 text-sm text-ink-soft">{account.email} · {ja ? 'ローカルベータモード' : 'local beta mode'}</p>

      <section className="cv-glass mt-6 rounded-panel p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-ink">{ja ? 'プロフィール完成度' : 'Profile completeness'}</h2>
          <span className="text-xl font-bold tabular-nums text-cyan2">{completeness}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-ink/5">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan2 to-violet2" style={{ width: `${completeness}%` }} />
        </div>
        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          {fields.map((f) => (
            <li key={f.key} className="flex items-start gap-2">
              <span aria-hidden="true" className={f.filled ? 'text-emerald2' : 'text-ink-soft/40'}>
                {f.filled ? '✓' : '○'}
              </span>
              <span className={f.filled ? 'text-ink' : 'text-ink-soft'}>
                {f.label}
                {!f.filled && <span className="block text-xs text-ink-soft/80">{f.hint}</span>}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-soft">
          {ja
            ? '不足している項目を埋めると、シミュレーションの信頼性が上がります。不確実な値（例：予算はたぶん50万円）も入力できます。'
            : 'Filling missing items improves simulation reliability. Uncertain values (e.g. “budget: possibly ¥500,000”) are supported.'}
        </p>
      </section>

      <section className="cv-glass mt-4 rounded-panel p-5">
        <h2 className="font-bold text-ink">{ja ? '基本情報の編集' : 'Edit basics'}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold text-ink-soft">{ja ? '目標' : 'Goal'}</span>
            <input
              value={draft.goalText ?? ''}
              onChange={(e) => setDraft({ goalText: e.target.value })}
              className="min-h-[44px] w-full rounded-xl border border-ink/10 bg-white px-3 text-ink"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold text-ink-soft">{ja ? '学歴' : 'Education'}</span>
            <select
              value={draft.education ?? ''}
              onChange={(e) => setDraft({ education: e.target.value as EducationLevel })}
              className="min-h-[44px] w-full rounded-xl border border-ink/10 bg-white px-3 text-ink"
            >
              <option value="" disabled>—</option>
              <option value="highschool">{ja ? '高校卒業' : 'High school'}</option>
              <option value="some-college">{ja ? '短大・専門など' : 'Some college'}</option>
              <option value="bachelor">{ja ? '学士' : 'Bachelor'}</option>
              <option value="master">{ja ? '修士以上' : 'Master+'}</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold text-ink-soft">JLPT</span>
            <select
              value={draft.jlptCurrent ?? ''}
              onChange={(e) => setDraft({ jlptCurrent: e.target.value as JlptLevel })}
              className="min-h-[44px] w-full rounded-xl border border-ink/10 bg-white px-3 text-ink"
            >
              <option value="" disabled>—</option>
              {(['none', 'n5', 'n4', 'n3', 'n2', 'n1'] as const).map((l) => (
                <option key={l} value={l}>{l === 'none' ? (ja ? 'なし' : 'None') : l.toUpperCase()}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold text-ink-soft">{ja ? '希望地' : 'Location'}</span>
            <select
              value={draft.location ?? ''}
              onChange={(e) => setDraft({ location: e.target.value as LocationId })}
              className="min-h-[44px] w-full rounded-xl border border-ink/10 bg-white px-3 text-ink"
            >
              <option value="" disabled>—</option>
              {(['tokyo', 'yokohama', 'chiba', 'saitama', 'kanto-any'] as const).map((l) => (
                <option key={l} value={l}>{l === 'kanto-any' ? (ja ? '関東どこでも' : 'Anywhere in Kanto') : l}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold text-ink-soft">{ja ? '希望年収（円）' : 'Desired salary (JPY/yr)'}</span>
            <input
              type="number"
              min={0}
              step={100000}
              value={draft.desiredSalaryJpy ?? ''}
              onChange={(e) => setDraft({ desiredSalaryJpy: e.target.value ? Number(e.target.value) : undefined })}
              className="min-h-[44px] w-full rounded-xl border border-ink/10 bg-white px-3 text-ink"
            />
          </label>
        </div>
        <p className="mt-3 text-xs text-ink-soft">
          {ja ? '変更は次回のシミュレーション実行時に反映されます。' : 'Changes apply the next time you run a simulation.'}
        </p>
      </section>

      <section className="cv-glass mt-4 rounded-panel p-5">
        <h2 className="font-bold text-ink">{ja ? '保存済みシミュレーション' : 'Saved simulations'}</h2>
        {scenarios.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">{ja ? 'まだ保存されていません。' : 'Nothing saved yet.'}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {scenarios.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink/5 bg-white/70 p-3 text-sm">
                <div>
                  <strong className="text-ink">{s.name}</strong>
                  <span className="ml-2 text-xs text-ink-soft">{new Date(s.savedAt).toLocaleDateString(ja ? 'ja-JP' : 'en-US')} · {s.result.routes.length} {ja ? 'ルート' : 'routes'}</span>
                </div>
                <button onClick={() => deleteScenario(s.id)} className="rounded-full border border-coral/30 px-4 py-1.5 text-xs font-semibold text-coral hover:bg-coral/5">
                  {ja ? '削除' : 'Delete'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
