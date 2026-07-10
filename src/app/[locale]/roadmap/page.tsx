'use client';

/**
 * Japan Settlement Roadmap — deliberately calm, serious visual treatment.
 * General educational information with official sources; never a "predictor".
 */

import { useLocale } from 'next-intl';
import { useAppStore } from '@/lib/store/app';
import { useHydrated } from '@/components/ui/useHydrated';
import { Link } from '@/i18n/routing';

const CHECKED = '2026-06-15';

interface StatusNode {
  id: string;
  nameEn: string;
  nameJa: string;
  descEn: string;
  descJa: string;
  requirementsEn: string[];
  requirementsJa: string[];
  riskEn?: string;
  riskJa?: string;
}

const NODES: StatusNode[] = [
  {
    id: 'student',
    nameEn: 'Student（留学）',
    nameJa: '留学',
    descEn: 'Your likely current status while at language school. Attendance and part-time-work limits (28h/week) directly affect every later step.',
    descJa: '日本語学校在籍中の一般的な在留資格。出席率と資格外活動（週28時間）の順守が、その後のすべてのステップに影響します。',
    requirementsEn: ['Enrollment at a recognized institution', 'Sufficient attendance', 'Financial support evidence'],
    requirementsJa: ['認定された教育機関への在籍', '十分な出席率', '経費支弁能力の証明'],
    riskEn: 'Low attendance or overstaying part-time limits can block future status changes.',
    riskJa: '出席率の低下や資格外活動の超過は、将来の在留資格変更の障害になり得ます。',
  },
  {
    id: 'gijinkoku',
    nameEn: 'Engineer / Specialist in Humanities / International Services（技術・人文知識・国際業務）',
    nameJa: '技術・人文知識・国際業務',
    descEn: 'The most common work status after graduating from university or vocational school (専門士). Job duties must relate to your studies.',
    descJa: '大学・専門学校（専門士）卒業後の最も一般的な就労資格。職務内容が専攻と関連している必要があります。',
    requirementsEn: ['Degree or 専門士 related to the job', 'Full-time offer with appropriate duties', 'Stable employer'],
    requirementsJa: ['職務と関連する学位または専門士', '適切な職務内容のフルタイム内定', '安定した雇用先'],
  },
  {
    id: 'ssw',
    nameEn: 'Specified Skilled Worker（特定技能）',
    nameJa: '特定技能',
    descEn: 'Direct-entry path for specific industries (e.g. food service, accommodation) via skills and language exams. Long-term implications differ by category — professional advice matters here.',
    descJa: '外食業・宿泊業など特定分野の技能・日本語試験による就労経路。分野・号数によって長期在留への影響が異なるため、専門家への相談が重要です。',
    requirementsEn: ['Industry skills exam', 'Japanese-language exam', 'Employer support system'],
    requirementsJa: ['分野別技能試験', '日本語試験', '受入れ機関の支援体制'],
    riskEn: 'Category 1 has stay limits and different family/settlement implications than work statuses.',
    riskJa: '1号は在留期間の上限があり、家族帯同や定住への影響が就労資格と異なります。',
  },
  {
    id: 'hsp',
    nameEn: 'Highly-Skilled Professional（高度専門職）',
    nameJa: '高度専門職',
    descEn: 'Points-based status (education, salary, age, Japanese ability). Can shorten some long-term timelines. Realistic mainly for higher-salary careers such as IT.',
    descJa: '学歴・年収・年齢・日本語能力などのポイント制。長期在留までの期間が短くなる場合があります。IT等の高年収キャリアで現実的です。',
    requirementsEn: ['70+ points on the official chart', 'Qualifying employment'],
    requirementsJa: ['ポイント計算表で70点以上', '対象となる就労'],
  },
  {
    id: 'pr',
    nameEn: 'Permanent Residence（永住）',
    nameJa: '永住',
    descEn: 'Long-term goal for many. Generally requires years of stable residence, income, tax and pension contributions, and good conduct. Always an individual official decision.',
    descJa: '多くの人の長期目標。一般に、安定した在留年数・収入・納税・年金の納付・素行善良が求められます。常に個別の公的審査です。',
    requirementsEn: ['Continuous residence history (commonly 10 years; shorter for HSP)', 'Stable independent income', 'Tax & pension compliance'],
    requirementsJa: ['継続した在留歴（一般に10年、高度専門職は短縮あり）', '安定した独立生計', '納税・年金の適正な納付'],
  },
];

export default function RoadmapPage(): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';
  const hydrated = useHydrated();
  const account = useAppStore((s) => s.account);

  return (
    <div className="bg-white/40">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-bold text-indigo2 sm:text-3xl">
          {ja ? '日本定住ロードマップ' : 'Japan Settlement Roadmap'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink">
          {ja
            ? '在留資格（Residence status）の一般的な流れを、落ち着いて確認するためのページです。これは一般的な教育情報であり、法的助言ではありません。最終的な判断は出入国在留管理庁が個別に行います。'
            : 'A calm overview of common residence-status（在留資格）pathways. This is general educational information, not legal advice. Final decisions are always made individually by the Immigration Services Agency.'}
        </p>

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink-soft">
          <span className="rounded-full bg-indigo2/10 px-3 py-1 text-indigo2">{ja ? `情報確認日: ${CHECKED}` : `Information checked: ${CHECKED}`}</span>
          <a
            href="https://www.moj.go.jp/isa/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-indigo2/30 px-3 py-1 text-indigo2 hover:bg-indigo2/5"
          >
            {ja ? '公式：出入国在留管理庁 ↗' : 'Official source: Immigration Services Agency ↗'}
          </a>
        </div>

        {hydrated && !account && (
          <p className="mt-4 rounded-xl border border-ink/10 bg-white p-3 text-xs text-ink-soft">
            {ja
              ? 'アカウントを作成すると、現在の在留資格と期限を登録して期限リマインダーを受け取れます。'
              : 'With an account you can record your current status and expiration date to receive deadline reminders.'}
          </p>
        )}

        {/* The roadmap — calm vertical flow */}
        <ol className="mt-10 space-y-0">
          {NODES.map((n, i) => (
            <li key={n.id} className="relative flex gap-5 pb-10">
              {i < NODES.length - 1 && (
                <span aria-hidden="true" className="absolute left-[15px] top-9 h-full w-px bg-indigo2/25" />
              )}
              <span
                aria-hidden="true"
                className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-indigo2/40 bg-white text-xs font-bold text-indigo2"
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1 rounded-xl border border-indigo2/15 bg-white p-5 shadow-sm">
                <h2 className="font-bold text-indigo2">{ja ? n.nameJa : n.nameEn}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink">{ja ? n.descJa : n.descEn}</p>
                <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  {ja ? '一般的な要件' : 'Common requirements'}
                </h3>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-ink-soft">
                  {(ja ? n.requirementsJa : n.requirementsEn).map((r, j) => (
                    <li key={j}>{r}</li>
                  ))}
                </ul>
                {n.riskEn && (
                  <p className="mt-3 rounded-lg border border-coral/25 bg-coral/5 px-3 py-2 text-xs text-ink">
                    <strong className="text-coral">{ja ? '注意：' : 'Caution:'}</strong> {ja ? n.riskJa : n.riskEn}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>

        <section className="rounded-panel border border-indigo2/20 bg-indigo2/5 p-6">
          <h2 className="font-bold text-indigo2">{ja ? '専門家への相談が必要なとき' : 'When professional advice is required'}</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink">
            <li>{ja ? '自分の個別の状況について判断が必要なとき' : 'Any judgment about your individual situation'}</li>
            <li>{ja ? '期限が近い、または情報が矛盾しているとき' : 'Deadlines are near or information seems contradictory'}</li>
            <li>{ja ? '不許可歴・特殊な経歴があるとき' : 'Past refusals or unusual history'}</li>
          </ul>
          <p className="mt-3 text-sm text-ink">
            {ja
              ? '行政書士（申請取次）や弁護士などの資格を持つ専門家に相談してください。サポートページから相談窓口の案内をリクエストできます。'
              : 'Consult a qualified professional such as a certified gyoseishoshi (immigration procedures specialist) or lawyer. You can request a referral from the Support page.'}
          </p>
          <Link href="/support" className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-indigo2 px-6 text-sm font-semibold text-white hover:brightness-110">
            {ja ? 'サポートへ' : 'Go to Support'}
          </Link>
        </section>
      </div>
    </div>
  );
}
