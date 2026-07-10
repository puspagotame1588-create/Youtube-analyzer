import { setRequestLocale } from 'next-intl/server';
import { dataset } from '@/lib/data/seed';

export default function SourcesPage({ params: { locale } }: { params: { locale: string } }): React.JSX.Element {
  setRequestLocale(locale);
  const ja = locale === 'ja';

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-sm leading-relaxed text-ink">
      <h1 className="text-2xl font-bold sm:text-3xl">{ja ? 'データソース' : 'Data Sources'}</h1>
      <p className="mt-3 text-ink-soft">
        {ja
          ? 'プライベートベータのデータは、明示的にラベル付けされたデモデータ（架空だが現実的な関東の例）と、政府機関の参考情報で構成されています。無断スクレイピングは一切行いません。すべての公開レコードには情報源・取得日・検証状態・確認者が記録され、AIが収集した情報は管理者の承認なしに公開されません。'
          : 'Private-beta data consists of clearly labeled demonstration records (fictional but representative Kanto examples) plus government reference information. No unauthorized scraping is ever used. Every public record carries its source, retrieval date, verification state, and reviewer, and nothing collected by AI is published without admin approval.'}
      </p>

      <h2 className="mt-8 text-lg font-bold">{ja ? '登録済みの情報源' : 'Registered sources'}</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-xs">
          <caption className="sr-only">{ja ? '情報源一覧' : 'Source registry'}</caption>
          <thead>
            <tr className="border-b border-ink/10 uppercase tracking-wide text-ink-soft">
              <th scope="col" className="py-2 pr-3">{ja ? '名称' : 'Name'}</th>
              <th scope="col" className="py-2 pr-3">{ja ? '種別' : 'Type'}</th>
              <th scope="col" className="py-2 pr-3">{ja ? '取得日' : 'Retrieved'}</th>
              <th scope="col" className="py-2">{ja ? '確認者' : 'Reviewer'}</th>
            </tr>
          </thead>
          <tbody>
            {dataset.sources.map((s) => (
              <tr key={s.id} className="border-b border-ink/5 align-top">
                <td className="py-2 pr-3">
                  <span className="font-medium">{ja ? s.nameJa : s.nameEn}</span>
                  <span className="block text-ink-soft">{s.url}</span>
                </td>
                <td className="py-2 pr-3">{s.type}</td>
                <td className="py-2 pr-3 tabular-nums">{s.retrievedAt}</td>
                <td className="py-2">{s.reviewer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-lg font-bold">{ja ? 'カバレッジ' : 'Coverage'}</h2>
      <ul className="mt-2 list-inside list-disc space-y-1 text-ink-soft">
        <li>{ja ? `学校: ${dataset.schools.length}校（すべてデモ）` : `Schools: ${dataset.schools.length} (all demonstration)`}</li>
        <li>{ja ? `奨学金: ${dataset.scholarships.length}件（デモ）` : `Scholarships: ${dataset.scholarships.length} (demonstration)`}</li>
        <li>{ja ? `キャリア分野: ${dataset.careers.length}分野` : `Career fields: ${dataset.careers.length}`}</li>
        <li>{ja ? `求人例: ${dataset.jobListings.length}件（デモ）` : `Example vacancies: ${dataset.jobListings.length} (demonstration)`}</li>
      </ul>
      <p className="mt-3 rounded-xl border border-amber2/30 bg-amber2/5 p-3 text-ink">
        {ja
          ? 'このベータ版は関東地域のサンプルのみを対象としており、全国のカバレッジを主張するものではありません。誤りを見つけた場合は各ページの「誤りを報告」からお知らせください。'
          : 'This beta covers a Kanto sample only and makes no claim of nationwide coverage. If you find an error, use “Report a correction” on any record page.'}
      </p>
    </div>
  );
}
