'use client';

/**
 * Documents — beta pipeline: upload → validation → field entry/correction →
 * explicit confirmation → profile update. Originals are not stored in the
 * local beta; passport/residence-card uploads are refused by design.
 */

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useAppStore } from '@/lib/store/app';
import { useHydrated } from '@/components/ui/useHydrated';
import type { JlptLevel } from '@/lib/simulation/types';

const ACCEPTED_KINDS = [
  { id: 'resume', en: 'Resume', ja: '履歴書' },
  { id: 'transcript', en: 'Academic transcript', ja: '成績証明書' },
  { id: 'jlpt', en: 'JLPT result', ja: 'JLPT結果' },
  { id: 'eju', en: 'EJU result', ja: 'EJU結果' },
  { id: 'attendance', en: 'Attendance certificate', ja: '出席証明書' },
  { id: 'brochure', en: 'School brochure', ja: '学校パンフレット' },
  { id: 'job-listing', en: 'Job listing', ja: '求人票' },
] as const;

const MAX_SIZE = 10 * 1024 * 1024;
const OK_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export default function DocumentsPage(): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';
  const hydrated = useHydrated();
  const account = useAppStore((s) => s.account);
  const setDraft = useAppStore((s) => s.setProfileDraft);
  const pushNotification = useAppStore((s) => s.pushNotification);

  const [kind, setKind] = useState<(typeof ACCEPTED_KINDS)[number]['id']>('jlpt');
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<'upload' | 'confirm' | 'done'>('upload');
  const [jlptField, setJlptField] = useState<JlptLevel>('n3');
  const [confirmed, setConfirmed] = useState(false);

  if (!hydrated) return <div className="p-20 text-center text-ink-soft">…</div>;

  if (!account) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-ink">{ja ? '書類のアップロードにはアカウントが必要です' : 'Documents require an account'}</h1>
        <Link href="/auth" className="mt-6 inline-flex min-h-[44px] items-center rounded-full bg-ink px-8 py-2.5 text-sm font-semibold text-white">
          {ja ? 'アカウント作成 →' : 'Create account →'}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">{ja ? '書類' : 'Documents'}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {ja
          ? '書類から情報を取り出し、あなたが確認・修正してからプロフィールに反映します。'
          : 'Information is extracted from documents, then you review and confirm it before anything updates your profile.'}
      </p>

      <div className="mt-4 rounded-panel border border-coral/25 bg-coral/5 p-4 text-sm text-ink">
        <strong className="text-coral">{ja ? '受け付けない書類：' : 'Not accepted:'}</strong>{' '}
        {ja
          ? 'パスポートと在留カードはプライベートベータではアップロードできません。'
          : 'Passport and residence-card uploads are excluded from the private beta.'}
      </div>

      <div className="mt-2 rounded-panel border border-ink/10 bg-white/60 p-4 text-xs text-ink-soft">
        {ja
          ? 'ローカルベータモードでは、ファイル自体は保存されません。検証後すぐに破棄され、入力したフィールドのみが端末に保存されます。本番環境では暗号化保存（任意）と署名付きアクセスを使用します。'
          : 'In local beta mode the file itself is never stored — it is discarded right after validation, and only the fields you confirm are kept on this device. Production uses opt-in encrypted storage with signed access.'}
      </div>

      {stage === 'upload' && (
        <form
          className="cv-glass mt-6 space-y-4 rounded-panel p-6"
          onSubmit={(e) => e.preventDefault()}
        >
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold text-ink-soft">{ja ? '書類の種類' : 'Document type'}</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as typeof kind)}
              className="min-h-[44px] w-full rounded-xl border border-ink/10 bg-white px-3 text-ink"
            >
              {ACCEPTED_KINDS.map((k) => (
                <option key={k.id} value={k.id}>{ja ? k.ja : k.en}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold text-ink-soft">
              {ja ? 'ファイル（PDF / JPG / PNG、10MBまで）' : 'File (PDF / JPG / PNG, max 10 MB)'}
            </span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                setError(null);
                const f = e.target.files?.[0];
                if (!f) return;
                if (!OK_TYPES.includes(f.type)) {
                  setError(ja ? 'このファイル形式は受け付けていません。' : 'This file type is not accepted.');
                  return;
                }
                if (f.size > MAX_SIZE) {
                  setError(ja ? 'ファイルが大きすぎます（10MBまで）。' : 'File too large (max 10 MB).');
                  return;
                }
                setFileName(f.name);
                setStage('confirm');
              }}
              className="block w-full rounded-xl border border-dashed border-ink/20 bg-white p-6 text-sm text-ink-soft file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
            />
          </label>
          {error && <p role="alert" className="text-sm text-coral">{error}</p>}
        </form>
      )}

      {stage === 'confirm' && (
        <div className="cv-glass mt-6 rounded-panel p-6">
          <h2 className="font-bold text-ink">{ja ? '抽出フィールドの確認' : 'Review extracted fields'}</h2>
          <p className="mt-1 text-xs text-ink-soft">
            {ja
              ? `${fileName} — ローカルベータでは自動抽出を行わないため、値をご自身で入力・確認してください。確認するまでプロフィールは変更されません。`
              : `${fileName} — the local beta does not auto-extract, so please enter and verify the values yourself. Nothing updates your profile until you confirm.`}
          </p>

          {kind === 'jlpt' ? (
            <label className="mt-4 block text-sm">
              <span className="mb-1 block text-xs font-semibold text-ink-soft">{ja ? '認定レベル' : 'Certified level'}</span>
              <select
                value={jlptField}
                onChange={(e) => setJlptField(e.target.value as JlptLevel)}
                className="min-h-[44px] w-full rounded-xl border border-ink/10 bg-white px-3 text-ink"
              >
                {(['n5', 'n4', 'n3', 'n2', 'n1'] as const).map((l) => (
                  <option key={l} value={l}>{l.toUpperCase()}</option>
                ))}
              </select>
            </label>
          ) : (
            <p className="mt-4 rounded-xl bg-amber2/10 px-3 py-2 text-sm text-amber2">
              {ja
                ? 'この書類種別のフィールド反映はベータでは未対応です。記録のみ行われます。'
                : 'Profile mapping for this document type is not yet supported in the beta; the upload is recorded only.'}
            </p>
          )}

          <label className="mt-4 flex min-h-[44px] cursor-pointer items-start gap-3 text-sm text-ink">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[#00B8D9]" />
            {ja ? '上記の値が正しいことを確認しました。' : 'I confirm these values are correct.'}
          </label>

          <div className="mt-4 flex gap-2">
            <button
              disabled={!confirmed}
              onClick={() => {
                if (kind === 'jlpt') setDraft({ jlptCurrent: jlptField });
                pushNotification({
                  titleEn: 'Document processed',
                  titleJa: '書類を処理しました',
                  bodyEn: `${fileName ?? 'Document'} was processed. The original file was discarded; confirmed fields were saved.`,
                  bodyJa: `${fileName ?? '書類'}を処理しました。元ファイルは破棄され、確認済みフィールドのみ保存されました。`,
                });
                setStage('done');
              }}
              className="min-h-[44px] rounded-full bg-gradient-to-r from-cyan2 to-violet2 px-6 text-sm font-semibold text-white shadow-glow disabled:opacity-40"
            >
              {ja ? '確認して反映' : 'Confirm & apply'}
            </button>
            <button onClick={() => setStage('upload')} className="min-h-[44px] rounded-full px-5 text-sm text-ink-soft">
              {ja ? 'キャンセル' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {stage === 'done' && (
        <div className="cv-glass mt-6 rounded-panel p-6 text-center" role="status">
          <p className="text-2xl" aria-hidden="true">✓</p>
          <h2 className="mt-2 font-bold text-ink">{ja ? '反映しました' : 'Applied'}</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {ja
              ? '元のファイルは保存されていません。確認済みの値のみプロフィールに反映されました。'
              : 'The original file was not stored. Only your confirmed values were applied to the profile.'}
          </p>
          <button onClick={() => { setStage('upload'); setConfirmed(false); setFileName(null); }} className="mt-4 min-h-[44px] rounded-full border border-ink/10 px-6 text-sm font-semibold text-ink">
            {ja ? '別の書類をアップロード' : 'Upload another document'}
          </button>
        </div>
      )}
    </div>
  );
}
