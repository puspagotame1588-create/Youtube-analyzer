import { setRequestLocale } from 'next-intl/server';
import { dataset } from '@/lib/data/seed';
import { realSchools, realScholarships, realJobLinks, officialLegalSources } from '@/lib/data/real';
import {
  verifiedPrograms,
  verifiedVacancies,
  verifiedCounts,
  presentableScholarships,
  blockedScholarships,
} from '@/lib/data/verified';

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
                  <span className="block text-ink-soft">
                    {s.url.startsWith('internal:')
                      ? ja
                        ? '内部文書（評価方法ページ参照）'
                        : 'Internal document (see Methodology page)'
                      : s.url}
                  </span>
                </td>
                <td className="py-2 pr-3">{s.type}</td>
                <td className="py-2 pr-3 tabular-nums">{s.retrievedAt}</td>
                <td className="py-2">{s.reviewer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-lg font-bold">{ja ? '検証済みレコード（record_verified）' : 'Verified records (record_verified)'}</h2>
      <p className="mt-2 text-ink-soft">
        {ja
          ? `データ状態モデル: source_discovered → official_url_confirmed → field_extracted → field_verified → record_verified → simulation_eligible（→ outdated / archived）。監査の結果、必須項目が公式に非公表のレコードは verification_blocked とし、検証済みとしては表示しません（現在 ${verifiedCounts.scholarshipsVerificationBlocked} 件）。URLのみ確認したレコードは検証済みレコードではありません。現在の完全検証数 — 大学プログラム: ${verifiedCounts.universitiesFullyVerified} / 奨学金: ${verifiedCounts.scholarshipsFullyVerified} / 求人: ${verifiedCounts.vacanciesFullyVerified}。simulation_eligible のレコードはまだ0件で、シミュレーションは引き続きデモデータのみを使用します。`
          : `Data-state model: source_discovered → official_url_confirmed → field_extracted → field_verified → record_verified → simulation_eligible (→ outdated / archived). A record whose critical field an audit could not confirm from any official source is marked verification_blocked and is never shown as verified (${verifiedCounts.scholarshipsVerificationBlocked} today). A URL-confirmed record is NOT a verified record. Fully verified today — university programs: ${verifiedCounts.universitiesFullyVerified} / scholarships: ${verifiedCounts.scholarshipsFullyVerified} / vacancies: ${verifiedCounts.vacanciesFullyVerified}. No record is simulation_eligible yet — simulations still use only the demonstration dataset.`}
      </p>

      <h3 className="mt-4 font-bold">{ja ? '奨学金（検証済み）' : 'Scholarships (verified)'}</h3>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-xs">
          <caption className="sr-only">Verified scholarships</caption>
          <thead>
            <tr className="border-b border-ink/10 uppercase tracking-wide text-ink-soft">
              <th scope="col" className="py-2 pr-3">{ja ? '制度' : 'Program'}</th>
              <th scope="col" className="py-2 pr-3">{ja ? '年度' : 'Year'}</th>
              <th scope="col" className="py-2 pr-3">{ja ? '金額' : 'Amount'}</th>
              <th scope="col" className="py-2 pr-3">{ja ? '申請経路' : 'Route'}</th>
              <th scope="col" className="py-2 pr-3">{ja ? '締切/状況' : 'Deadline/status'}</th>
              <th scope="col" className="py-2">{ja ? '確認日→次回' : 'Checked→next'}</th>
            </tr>
          </thead>
          <tbody>
            {presentableScholarships.map((v) => (
              <tr key={v.id} className="border-b border-ink/5 align-top">
                <td className="py-2 pr-3 font-medium">{ja ? v.nameJa : v.nameEn}<span className="block text-ink-soft">{v.provider}</span></td>
                <td className="py-2 pr-3">{v.academicYear}</td>
                <td className="py-2 pr-3"><a className="text-indigo2 hover:underline" href={v.amount.sourceUrl} target="_blank" rel="noopener noreferrer">{v.amount.value}</a></td>
                <td className="py-2 pr-3">{v.applicationRoute}</td>
                <td className="py-2 pr-3"><a className="text-indigo2 hover:underline" href={v.deadlineStatus.sourceUrl} target="_blank" rel="noopener noreferrer">{v.deadlineStatus.value}</a></td>
                <td className="py-2 tabular-nums">{v.checkedAt} → {v.nextReviewAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {blockedScholarships.length > 0 && (
        <>
          <h3 className="mt-6 font-bold text-amber2">
            {ja ? '奨学金（監査済み・保留：検証不能な必須項目あり）' : 'Scholarships (audited — withheld: a critical field is unobtainable)'}
          </h3>
          <p className="mt-2 text-xs text-ink-soft">
            {ja
              ? 'これらのレコードは公式ソースと照合済みで、事実の相違は見つかっていません。ただし、出願判断に必要な項目が公式には一切公表されていないため、検証済みとしては表示しません。該当項目は在籍校・財団に直接ご確認ください。'
              : 'These records were checked against the controlling official source and no factual mismatch was found. They are withheld from the verified table because a field you would need in order to apply is not published by any official source. Confirm those fields with your institution or the foundation directly.'}
          </p>
          <ul className="mt-2 space-y-2 text-xs">
            {blockedScholarships.map((v) => (
              <li key={v.id} className="rounded-xl border border-amber2/30 bg-amber2/5 p-3">
                <strong className="text-ink">{ja ? v.nameJa : v.nameEn}</strong>
                <span className="text-ink-soft"> — {v.provider} · state: <code>{v.state}</code></span>
                <span className="mt-1 block text-ink-soft">
                  {ja ? '検証できなかった項目:' : 'Could not be verified:'}
                </span>
                <ul className="ml-4 list-disc text-ink-soft">
                  {v.missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3 className="mt-4 font-bold">{ja ? '大学・課程（部分検証）' : 'University programs (partially verified)'}</h3>
      <ul className="mt-2 space-y-2 text-xs text-ink-soft">
        {verifiedPrograms.map((p) => (
          <li key={p.id} className="rounded-xl border border-ink/10 bg-white p-3">
            <strong className="text-ink">{ja ? p.institutionJa : p.institutionEn}</strong> — {p.intakeYear} · state: <code>{p.state}</code>
            {Object.entries(p.fields).map(([k, fld]) => (
              <span key={k} className="block">✓ {k}: <a className="text-indigo2 hover:underline" href={fld.sourceUrl} target="_blank" rel="noopener noreferrer">{fld.value}</a></span>
            ))}
            <span className="block text-amber2">{ja ? '未検証' : 'Missing'}: {p.missing.join(' / ')}</span>
            <span className="block">{ja ? '確認' : 'Checked'} {p.checkedAt} → {p.nextReviewAt}（{ja ? '募集期は90日周期' : '90-day admissions cycle'}）</span>
          </li>
        ))}
      </ul>

      <h3 className="mt-4 font-bold">{ja ? '現在の求人（7日周期で再確認）' : 'Current vacancies (7-day re-check cycle)'}</h3>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <caption className="sr-only">Verified vacancies</caption>
          <thead>
            <tr className="border-b border-ink/10 uppercase tracking-wide text-ink-soft">
              <th scope="col" className="py-2 pr-3">{ja ? '職種' : 'Title'}</th>
              <th scope="col" className="py-2 pr-3">{ja ? '企業' : 'Employer'}</th>
              <th scope="col" className="py-2 pr-3">{ja ? '勤務地' : 'Location'}</th>
              <th scope="col" className="py-2 pr-3">{ja ? '形態' : 'Type'}</th>
              <th scope="col" className="py-2 pr-3">{ja ? '給与' : 'Salary'}</th>
              <th scope="col" className="py-2">{ja ? '確認日' : 'Checked'}</th>
            </tr>
          </thead>
          <tbody>
            {verifiedVacancies.map((v) => (
              <tr key={v.id} className="border-b border-ink/5 align-top">
                <td className="py-2 pr-3 font-medium"><a className="text-indigo2 hover:underline" href={v.sourceUrl} target="_blank" rel="noopener noreferrer">{v.title}</a></td>
                <td className="py-2 pr-3">{v.employer}</td>
                <td className="py-2 pr-3">{v.location}</td>
                <td className="py-2 pr-3">{v.employmentType}</td>
                <td className="py-2 pr-3">{v.salary}</td>
                <td className="py-2 tabular-nums">{v.checkedAt}{v.postedAt ? ` (posted ${v.postedAt})` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-lg font-bold">{ja ? '実データ登録簿（URL確認済み・未検証）' : 'Real-data register (URL-confirmed, not yet verified)'}</h2>
      <p className="mt-2 text-ink-soft">
        {ja
          ? '以下の実在レコードは、名称と公式URLをウェブ検索で確認したものです（取得日・確認者・次回確認日つき）。数値情報は各公式サイトでの確認が完了するまで保存していません。AIが収集した情報が自動公開されることはありません。'
          : 'The real records below have their names and official URLs confirmed via web search (with retrieval date, reviewer, and next-review date). Numeric details are not stored until confirmed on each official site. Nothing collected by AI is auto-published.'}
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <caption className="sr-only">{ja ? '実データ登録簿' : 'Real-data register'}</caption>
          <thead>
            <tr className="border-b border-ink/10 uppercase tracking-wide text-ink-soft">
              <th scope="col" className="py-2 pr-3">{ja ? 'レコード' : 'Record'}</th>
              <th scope="col" className="py-2 pr-3">{ja ? '種別' : 'Type'}</th>
              <th scope="col" className="py-2 pr-3">URL</th>
              <th scope="col" className="py-2 pr-3">{ja ? 'URL状態' : 'URL status'}</th>
              <th scope="col" className="py-2 pr-3">{ja ? '取得日' : 'Retrieved'}</th>
              <th scope="col" className="py-2">{ja ? '次回確認' : 'Next review'}</th>
            </tr>
          </thead>
          <tbody>
            {[
              ...realSchools.map((r) => ({ id: r.id, name: ja ? r.nameJa : r.nameEn, type: r.institutionType, url: r.officialUrl, status: r.urlStatus, meta: r.meta })),
              ...realScholarships.map((r) => ({ id: r.id, name: ja ? r.nameJa : r.nameEn, type: 'scholarship', url: r.officialUrl, status: r.urlStatus, meta: r.meta })),
              ...realJobLinks.map((r) => ({ id: r.id, name: ja ? r.orgJa : r.orgEn, type: r.kind, url: r.officialUrl, status: r.urlStatus, meta: r.meta })),
            ].map((r) => (
              <tr key={r.id} className="border-b border-ink/5 align-top">
                <td className="py-2 pr-3 font-medium">{r.name}</td>
                <td className="py-2 pr-3">{r.type}</td>
                <td className="py-2 pr-3 break-all text-ink-soft">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-indigo2 hover:underline">{r.url}</a>
                </td>
                <td className="py-2 pr-3">{r.status}</td>
                <td className="py-2 pr-3 tabular-nums">{r.meta.retrievedAt}</td>
                <td className="py-2 tabular-nums">{r.meta.nextReviewAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-lg font-bold">{ja ? '法令・在留資格の公式情報源' : 'Official legal-information sources'}</h2>
      <ul className="mt-2 list-inside list-disc space-y-1 text-ink-soft">
        {[
          officialLegalSources.studentParttime,
          officialLegalSources.shikakugai,
          officialLegalSources.prGuideline,
          officialLegalSources.prProcedure,
          officialLegalSources.statusList,
        ].map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-indigo2 hover:underline">
                {ja ? s.labelJa : s.labelEn} ↗
              </a>
            </li>
          ))}
        <li className="list-none pt-1 text-xs">{ja ? `確認日: ${officialLegalSources.checkedAt}` : `Checked: ${officialLegalSources.checkedAt}`}</li>
      </ul>

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
