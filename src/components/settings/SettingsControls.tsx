'use client';

/** Interactive settings controls (client island). The page shell is server-rendered. */

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { useAppStore } from '@/lib/store/app';
import { useQuality, type QualityPreference } from '@/lib/store/quality';
import { useHydrated } from '@/components/ui/useHydrated';
import { useState } from 'react';

export function SettingsControls(): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();
  const { preference, setPreference, tier, webglAvailable, reducedMotion } = useQuality();
  const account = useAppStore((s) => s.account);
  const exportData = useAppStore((s) => s.exportData);
  const deleteAccount = useAppStore((s) => s.deleteAccount);
  const [confirmDelete, setConfirmDelete] = useState(false);


  const prefs: Array<{ id: QualityPreference; en: string; ja: string; desc: { en: string; ja: string } }> = [
    { id: 'auto', en: 'Auto (recommended)', ja: '自動（推奨）', desc: { en: 'Detects your device capability.', ja: '端末性能を自動判定します。' } },
    { id: 'full', en: 'Full visual quality', ja: '最高画質', desc: { en: 'All particles and effects.', ja: 'すべてのパーティクルとエフェクト。' } },
    { id: 'balanced', en: 'Balanced', ja: 'バランス', desc: { en: 'Reduced effects for most phones.', ja: '多くのスマホ向けの軽量設定。' } },
    { id: 'battery', en: 'Battery saver', ja: 'バッテリー節約', desc: { en: '2D views with depth styling. No WebGL.', ja: '3Dを使わず、奥行きのある2D表示。' } },
    { id: 'reduced', en: 'Reduced motion', ja: 'モーション削減', desc: { en: 'Minimal animation everywhere.', ja: 'アニメーションを最小限に。' } },
  ];

  const download = (): void => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'careerverse-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <section className="cv-glass mt-6 rounded-panel p-5">
        <h2 className="font-bold text-ink">{ja ? '表示言語' : 'Interface language'}</h2>
        <div className="mt-3 flex gap-2">
          {(['en', 'ja'] as const).map((l) => (
            <button
              key={l}
              onClick={() => router.replace(pathname, { locale: l })}
              aria-pressed={locale === l}
              className={`min-h-[44px] rounded-full border px-6 text-sm font-semibold ${
                locale === l ? 'border-ink bg-ink text-white' : 'border-ink/10 bg-white/60 text-ink-soft'
              }`}
            >
              {l === 'en' ? 'English' : '日本語'}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          {ja
            ? '中国語（簡体字）・ベトナム語・韓国語・タガログ語・ネパール語は今後対応予定です。'
            : 'Simplified Chinese, Vietnamese, Korean, Tagalog, and Nepali are planned.'}
        </p>
      </section>

      <section className="cv-glass mt-4 rounded-panel p-5">
        <h2 className="font-bold text-ink">{ja ? '画質・モーション' : 'Visual quality & motion'}</h2>
        <p className="mt-1 text-xs text-ink-soft">
          {ja
            ? `現在の描画ティア: ${tier} · WebGL: ${webglAvailable ? (ja ? '利用可能' : '') : '利用不可'} · OSのモーション削減: ${reducedMotion ? 'ON' : 'OFF'}`
            : `Current rendering tier: ${tier} · WebGL: ${webglAvailable ? 'available' : 'unavailable'} · OS reduced motion: ${reducedMotion ? 'on' : 'off'}`}
        </p>
        <div className="mt-3 grid gap-2">
          {prefs.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreference(p.id)}
              aria-pressed={hydrated && preference === p.id}
              className={`rounded-xl border-2 p-3 text-left text-sm transition-colors ${
                hydrated && preference === p.id ? 'border-cyan2 bg-cyan2/5' : 'border-transparent bg-white/60 hover:border-cyan2/30'
              }`}
            >
              <strong className="text-ink">{ja ? p.ja : p.en}</strong>
              <span className="block text-xs text-ink-soft">{ja ? p.desc.ja : p.desc.en}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="cv-glass mt-4 rounded-panel p-5">
        <h2 className="font-bold text-ink">{ja ? 'データ' : 'Your data'}</h2>
        <p className="mt-1 text-xs text-ink-soft">
          {ja
            ? 'ローカルベータモード：すべてのデータはこの端末に保存されています。'
            : 'Local beta mode: all data lives on this device.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={download} className="min-h-[44px] rounded-full border border-ink/10 bg-white/70 px-6 text-sm font-semibold text-ink">
            {ja ? 'データをエクスポート（JSON）' : 'Export data (JSON)'}
          </button>
        </div>
      </section>

      {hydrated && account && (
        <section className="mt-4 rounded-panel border border-coral/25 bg-coral/5 p-5">
          <h2 className="font-bold text-coral">{ja ? 'アカウント削除' : 'Delete account'}</h2>
          <p className="mt-1 text-xs text-ink-soft">
            {ja
              ? 'アカウントと保存データ（シミュレーション・トラッカー・チケット等）をすべて削除します。元に戻せません。'
              : 'Removes your account and all saved data (simulations, tracker, tickets). This cannot be undone.'}
          </p>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="mt-3 min-h-[44px] rounded-full border border-coral/40 px-6 text-sm font-semibold text-coral hover:bg-coral/10">
              {ja ? '削除する…' : 'Delete…'}
            </button>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  deleteAccount();
                  router.push('/');
                }}
                className="min-h-[44px] rounded-full bg-coral px-6 text-sm font-semibold text-white"
              >
                {ja ? '完全に削除する' : 'Permanently delete'}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="min-h-[44px] rounded-full px-5 text-sm text-ink-soft">
                {ja ? 'キャンセル' : 'Cancel'}
              </button>
            </div>
          )}
        </section>
      )}
    </>
  );
}
