import { setRequestLocale } from 'next-intl/server';
import { SettingsControls } from '@/components/settings/SettingsControls';

/**
 * Settings — server-rendered shell (title, purpose, no-JS notice) with the
 * interactive controls as a client island. Without JavaScript the page still
 * explains what each setting does and how to get help.
 */
export default function SettingsPage({ params: { locale } }: { params: { locale: string } }): React.JSX.Element {
  setRequestLocale(locale);
  const ja = locale === 'ja';
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">{ja ? '設定' : 'Settings'}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {ja
          ? '表示言語、3D画質とモーション、データのエクスポート・削除をここで管理します。'
          : 'Manage interface language, 3D quality and motion, and exporting or deleting your data.'}
      </p>
      <noscript>
        <div className="mt-4 rounded-panel border border-amber2/40 bg-amber2/10 p-4 text-sm text-ink">
          {ja
            ? 'この設定画面の変更にはJavaScriptが必要です。JavaScriptなしでも、閲覧ページ（学校・キャリア・奨学金・ロードマップ・データソース）は利用できます。モーションはOSの「視差効果を減らす」設定でも制御されます。お困りの場合はサポートページからご連絡ください。'
            : 'Changing settings requires JavaScript. Without it, the browsing pages (schools, careers, scholarships, roadmap, data sources) still work, and motion also follows your OS reduced-motion preference. If you are stuck, contact us via the Support page.'}
        </div>
      </noscript>
      <SettingsControls />
    </div>
  );
}
