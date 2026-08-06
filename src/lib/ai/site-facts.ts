/**
 * Server-owned corpus describing what each page of CareerVerse does.
 *
 * This is the assistant's entire factual world for "how do I…" / "where is…"
 * questions. It is hand-written and version-controlled: a navigation answer is
 * a lookup into this table, never a model-authored sentence. That keeps the
 * site-wide assistant under the same rule as the scholarship bot — the model
 * can select an entry, but it cannot describe a feature that does not exist.
 *
 * Every `purpose` here must describe behaviour that is actually implemented.
 * When a page changes, this file changes with it.
 */

export interface SiteFact {
  /** Stable id, used as the citation label the UI renders. */
  id: string;
  /** Locale-relative href. The `Link` from `@/i18n/routing` adds the locale. */
  href: string;
  labelEn: string;
  labelJa: string;
  /** What the page actually does. Shown verbatim — never paraphrased. */
  purposeEn: string;
  purposeJa: string;
  /** Terms that route a question here. Matching only narrows; it never adds facts. */
  aliases: RegExp;
  /** True when the page needs a signed-in account. */
  requiresAccount?: boolean;
}

export const SITE_FACTS: SiteFact[] = [
  {
    id: 'page-create',
    href: '/create',
    labelEn: 'Create Future',
    labelJa: '未来をつくる',
    purposeEn:
      'Describe your goal in your own words — typed or by voice — to start a route simulation.',
    purposeJa:
      '目標を自分の言葉で入力（音声入力も可）して、ルートのシミュレーションを開始します。',
    aliases:
      /\b(create|get started|start|begin|first step|how do i (start|begin)|new simulation)\b|はじめ|始め|作成|開始|最初/i,
  },
  {
    id: 'page-universe',
    href: '/universe',
    labelEn: 'Simulation Universe',
    labelJa: 'シミュレーション宇宙',
    purposeEn:
      'View your simulated routes with their overall scores, months to first job, and expected education cost. A 2D summary is available when the 3D view is not.',
    purposeJa:
      'シミュレーション済みのルートを、総合スコア・就職までの期間・教育費（期待値）とあわせて表示します。3D表示が使えない場合は2D要約を利用できます。',
    aliases: /\b(universe|simulation|3d|2d|route[s]? view|my routes)\b|宇宙|シミュレーション|ルート表示/i,
  },
  {
    id: 'page-schools',
    href: '/schools',
    labelEn: 'School Galaxy',
    labelJa: '学校ギャラクシー',
    purposeEn:
      'Browse universities and vocational schools with their institution type, city, program length, and required JLPT level.',
    purposeJa:
      '大学・専門学校を、種別・所在地・修業年限・必要JLPTレベルとあわせて閲覧します。',
    aliases: /\b(school|schools|vocational|senmon|college|galaxy)\b|学校|専門学校|進学先/i,
  },
  {
    id: 'page-schools-compare',
    href: '/schools/compare',
    labelEn: 'Compare schools',
    labelJa: '学校を比較',
    purposeEn: 'Put selected schools side by side to compare their listed attributes.',
    purposeJa: '選択した学校を並べて、掲載されている項目を比較します。',
    aliases: /\bcompare (school|schools)\b|学校.*比較|比較.*学校/i,
  },
  {
    id: 'page-careers',
    href: '/careers',
    labelEn: 'Career Explorer',
    labelJa: 'キャリア探索',
    purposeEn:
      'Explore career fields with their day-to-day work, entry-level Japanese requirement, and demand score.',
    purposeJa:
      '職種ごとの仕事内容・入口の日本語レベル・需要スコアを確認します。',
    aliases: /\b(career|careers|job|jobs|work|occupation|industry)\b|仕事|職業|キャリア|就職先/i,
  },
  {
    id: 'page-scholarships',
    href: '/scholarships',
    labelEn: 'Scholarship Explorer',
    labelJa: '奨学金',
    purposeEn:
      'Browse scholarship programmes with checked official links, and ask the Scholarship Source Assistant about the five audited programmes.',
    purposeJa:
      '公式リンク確認済みの奨学金制度を閲覧し、監査済み5制度について奨学金ソースアシスタントに質問できます。',
    aliases: /\b(scholarship|scholarships|funding|grant|tuition support)\b|奨学金|給付|授業料支援/i,
  },
  {
    id: 'page-roadmap',
    href: '/roadmap',
    labelEn: 'Settlement Roadmap',
    labelJa: '日本定住ロードマップ',
    purposeEn:
      'See the stages of settling in Japan, with the Immigration Services Agency listed as the official source.',
    purposeJa:
      '日本定住までの段階を、出入国在留管理庁を公式ソースとして示したうえで確認します。',
    aliases:
      /\b(roadmap|visa|residence|status of residence|immigration|permanent|settle|settlement)\b|ビザ|在留資格|定住|永住|入管|ロードマップ/i,
  },
  {
    id: 'page-plan',
    href: '/plan',
    labelEn: 'Action Plan',
    labelJa: 'アクションプラン',
    purposeEn:
      'See the action plan for your chosen route. It appears after you run a simulation.',
    purposeJa:
      '選択したルートのアクションプランを表示します。シミュレーションの実行後に利用できます。',
    aliases: /\b(action plan|plan|next steps|todo|checklist)\b|プラン|計画|やること/i,
  },
  {
    id: 'page-tracker',
    href: '/tracker',
    labelEn: 'Application Tracker',
    labelJa: '出願トラッカー',
    purposeEn:
      'Track application progress, notes, and deadlines in one place. Schools are added from any school page.',
    purposeJa:
      '出願の進捗・メモ・締切を1か所で管理します。学校は各学校ページから追加します。',
    aliases: /\b(tracker|track|application|applications|deadline|deadlines)\b|出願|トラッカー|締切|進捗/i,
  },
  {
    id: 'page-compare',
    href: '/compare',
    labelEn: 'Compare routes',
    labelJa: 'ルート比較',
    purposeEn:
      'Compare your simulated routes on overall score and the conservative case. It appears after you run a simulation.',
    purposeJa:
      'シミュレーション済みルートを総合スコアと保守的ケースで比較します。シミュレーションの実行後に利用できます。',
    aliases: /\bcompare (route|routes|future|futures)\b|ルート.*比較|未来.*比較/i,
  },
  {
    id: 'page-documents',
    href: '/documents',
    labelEn: 'Documents',
    labelJa: '書類',
    purposeEn: 'Upload and manage your application documents. This page requires an account.',
    purposeJa: '出願書類をアップロードして管理します。このページはアカウントが必要です。',
    aliases: /\b(document|documents|upload|file|files|paperwork)\b|書類|アップロード|提出物/i,
    requiresAccount: true,
  },
  {
    id: 'page-sources',
    href: '/sources',
    labelEn: 'Data Sources',
    labelJa: 'データソース',
    purposeEn: 'See every registered information source behind the data on this site.',
    purposeJa: 'サイト上のデータの裏付けとなる登録済み情報源の一覧を確認します。',
    aliases: /\b(source|sources|citation|citations|evidence|where.*data.*from|reference)\b|ソース|出典|情報源|根拠/i,
  },
  {
    id: 'page-methodology',
    href: '/methodology',
    labelEn: 'Methodology',
    labelJa: '評価方法',
    purposeEn: 'Read how scores are calculated and what weight each factor carries.',
    purposeJa: 'スコアの算出方法と各評価要素の重みを確認します。',
    aliases:
      /\b(methodology|how.*score|scoring|weight|weights|calculated|algorithm)\b|評価方法|スコア.*仕組|重み|算出/i,
  },
  {
    id: 'page-support',
    href: '/support',
    labelEn: 'Support',
    labelJa: 'サポート',
    purposeEn: 'Send a message to the CareerVerse team, choosing a category for your question.',
    purposeJa: 'カテゴリを選んで、CareerVerseチームにメッセージを送信します。',
    aliases: /\b(support|help|contact|bug|problem|issue|feedback)\b|サポート|問い合わせ|不具合|help/i,
  },
  {
    id: 'page-profile',
    href: '/profile',
    labelEn: 'Profile',
    labelJa: 'プロフィール',
    purposeEn: 'View and edit your profile details.',
    purposeJa: 'プロフィール情報の確認と編集を行います。',
    aliases: /\b(profile|my account|account details)\b|プロフィール|profile/i,
  },
  {
    id: 'page-settings',
    href: '/settings',
    labelEn: 'Settings',
    labelJa: '設定',
    purposeEn: 'Change your CareerVerse settings.',
    purposeJa: 'CareerVerseの設定を変更します。',
    aliases: /\b(setting|settings|preference|preferences|language|locale)\b|設定|言語切替/i,
  },
  {
    id: 'page-notifications',
    href: '/notifications',
    labelEn: 'Notifications',
    labelJa: '通知',
    purposeEn: 'Read your notifications.',
    purposeJa: '通知を確認します。',
    aliases: /\b(notification|notifications|alert|alerts)\b|通知|お知らせ/i,
  },
  {
    id: 'page-privacy',
    href: '/privacy',
    labelEn: 'Privacy',
    labelJa: 'プライバシー',
    purposeEn: 'Read how CareerVerse handles your data.',
    purposeJa: 'CareerVerseにおけるデータの取り扱いを確認します。',
    aliases: /\b(privacy|data protection|gdpr|my data|delete.*account)\b|プライバシー|個人情報|データ.*扱/i,
  },
  {
    id: 'page-terms',
    href: '/terms',
    labelEn: 'Terms',
    labelJa: '利用規約',
    purposeEn: 'Read the terms of use for CareerVerse.',
    purposeJa: 'CareerVerseの利用規約を確認します。',
    aliases: /\b(terms|terms of use|legal|agreement)\b|規約|利用条件/i,
  },
];

/**
 * The disclaimer that governs every answer this assistant gives. Mirrors the
 * site footer — CareerVerse is educational information, not advice.
 */
export const SITE_DISCLAIMER = {
  en: 'CareerVerse provides general educational information, not legal or immigration advice. Final decisions on residence status are always made by official review.',
  ja: 'CareerVerseは一般的な教育情報を提供するものであり、法務・入管に関する助言ではありません。在留資格の最終判断は常に公的な審査によって行われます。',
} as const;

const BY_ID = new Map(SITE_FACTS.map((f) => [f.id, f]));

export function getSiteFact(id: string): SiteFact | undefined {
  return BY_ID.get(id);
}

/**
 * Ranks pages by how many distinct alias matches a question produces. Returns
 * only genuine matches — an unmatched question yields an empty list, which the
 * router turns into a refusal rather than a guess.
 */
export function retrieveSiteFacts(message: string, limit = 3): SiteFact[] {
  return SITE_FACTS.filter((f) => f.aliases.test(message)).slice(0, limit);
}
