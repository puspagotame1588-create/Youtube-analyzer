/**
 * Routing and composition for the site-wide assistant.
 *
 * The assistant answers from three grounded corpora and nothing else:
 *
 *   1. the audited scholarship claims  (delegated to ./scholarship-chat)
 *   2. the MEXT university registry    (identity fields only)
 *   3. the site-facts table            (what each page does)
 *
 * Intent detection here is deterministic — regex and registry lookups, no model
 * call — and so is the composition of the university and navigation answers.
 * Only the scholarship branch involves a model, and there the model still emits
 * claim ids rather than prose (see ./scholarship-answer).
 *
 * The consequence is worth stating plainly: there is no code path in this
 * module through which a model-authored sentence can reach the user. Every
 * factual character the assistant renders comes either from a corpus record,
 * verbatim, or from the fixed chrome defined below. A question that matches no
 * corpus produces a refusal, not an improvisation.
 */

import {
  getUniversityByMextCode,
  MEXT_REGISTRY_SOURCE,
  retrieveUniversities,
  type UniversityRecord,
} from '@/lib/data/universities';
import { matchUniversityAliases } from '@/lib/data/universities/search-aliases';
import { ENRICHMENT_FIELDS } from '@/lib/data/universities/types';
import { detectProgrammes, type ResolvedAnswer } from './scholarship-chat';
import { retrieveSiteFacts, type SiteFact } from './site-facts';

export type AssistantLocale = 'en' | 'ja';

export type AssistantIntent =
  | 'scholarship'
  | 'university'
  | 'navigation'
  | 'about'
  | 'none';

/**
 * One displayable unit. `fact` carries corpus text verbatim and names the record
 * it came from; every other kind carries chrome owned by this file.
 */
export type AssistantBlock =
  | { kind: 'lead' | 'note' | 'closing' | 'not-verified-heading'; text: string }
  | { kind: 'fact'; text: string; ref: string }
  | { kind: 'not-verified'; text: string; ref?: string };

export interface AssistantCitation {
  /** Short provenance handle: a claim id, a school code, a source name. */
  label: string;
  /** The corpus statement behind the citation, when there is one. */
  detail?: string;
  /** Source text quoted verbatim, when the corpus records one. */
  excerpt?: string;
  urls: string[];
}

export interface AssistantLink {
  href: string;
  label: string;
}

export interface AssistantSection {
  id: string;
  title: string;
  subtitle?: string;
  blocks: AssistantBlock[];
  citations: AssistantCitation[];
  links: AssistantLink[];
}

export interface AssistantAnswer {
  intent: AssistantIntent;
  sections: AssistantSection[];
  refused: boolean;
  refusalReason?: string;
  /** Follow-up questions this assistant can actually answer. */
  suggestions: string[];
}

// ── Fixed chrome ─────────────────────────────────────────────────────────────

const CHROME: Record<
  AssistantLocale,
  {
    registryLead: string;
    registryNotVerified: string;
    registryProvisional: string;
    registryClosing: string;
    navLead: string;
    navAccount: string;
    aboutLead: string;
    aboutClosing: string;
    noNameMatch: string;
    sectorLabel: Record<UniversityRecord['sector'], string>;
    field: Record<
      'nameJa' | 'nameEn' | 'sector' | 'location' | 'address' | 'code' | 'website',
      string
    >;
  }
> = {
  en: {
    registryLead: 'The official MEXT school-code registry lists this institution as follows:',
    registryNotVerified:
      'Not verified for this institution — CareerVerse has not confirmed these from an official source, so they are not stated here:',
    registryProvisional:
      'This is MEXT’s provisional 2026 edition. The final edition has not been published.',
    registryClosing: 'Confirm current details on the institution’s own official website.',
    navLead: 'That is handled on this page:',
    navAccount: 'This page requires an account.',
    // No count here on purpose: the capability list below is the single source
    // of how many there are, so the sentence cannot drift out of step with it.
    aboutLead: 'I answer only from sources CareerVerse has verified:',
    aboutClosing: 'Anything outside those, I will say I cannot confirm rather than guess.',
    noNameMatch:
      'I could not match that name to a record in the MEXT school-code registry. The registry stores official Japanese names, so the Japanese name may work where the English one does not.',
    sectorLabel: { national: 'National', public: 'Public', private: 'Private' },
    field: {
      nameJa: 'Official name',
      nameEn: 'Official English name',
      sector: 'Establishment',
      location: 'Location',
      address: 'Address',
      code: 'MEXT school code',
      website: 'Official website',
    },
  },
  ja: {
    registryLead: '文部科学省の学校コード（公式）には、次のとおり記載されています：',
    registryNotVerified:
      'この学校については未確認です。公式ソースで確認できていないため、ここでは記載しません：',
    registryProvisional:
      '文部科学省の令和8年度「暫定版」に基づきます。確定版は未公表です。',
    registryClosing: '最新の情報は各学校の公式サイトでご確認ください。',
    navLead: 'その操作は次のページで行えます：',
    navAccount: 'このページの利用にはアカウントが必要です。',
    aboutLead: 'CareerVerseが検証済みのソースのみに基づいて回答します。対応範囲は次のとおりです：',
    aboutClosing: 'これら以外については、推測せず「確認できません」とお答えします。',
    noNameMatch:
      'その名称に一致する記録を文部科学省の学校コードから見つけられませんでした。収録されているのは正式な日本語名称のため、日本語名でお試しください。',
    sectorLabel: { national: '国立', public: '公立', private: '私立' },
    field: {
      nameJa: '正式名称',
      nameEn: '英語名称（公式）',
      sector: '設置区分',
      location: '所在地',
      address: '住所',
      code: '学校コード',
      website: '公式サイト',
    },
  },
};

/** What the assistant can do, stated as three checkable capabilities. */
const ABOUT_CAPABILITIES: Record<AssistantLocale, { text: string; ref: string }[]> = {
  en: [
    {
      text: 'Universities: official name, establishment type, location and MEXT school code for the institutions in the MEXT school-code registry.',
      ref: 'registry',
    },
    {
      text: 'Scholarships: the five programmes whose official pages CareerVerse has audited, quoted as the audit recorded them.',
      ref: 'scholarship-audit',
    },
    {
      text: 'This site: what each page does and where to find it.',
      ref: 'site-facts',
    },
  ],
  ja: [
    {
      text: '大学：文部科学省の学校コードに収録されている学校の正式名称・設置区分・所在地・学校コード。',
      ref: 'registry',
    },
    {
      text: '奨学金：CareerVerseが公式ページを監査した5制度について、監査時の記載どおりに引用します。',
      ref: 'scholarship-audit',
    },
    {
      text: 'このサイト：各ページの機能と場所。',
      ref: 'site-facts',
    },
  ],
};

const SUGGESTIONS: Record<AssistantLocale, string[]> = {
  en: [
    'What is Waseda University’s MEXT school code?',
    'How much is the JASSO Honors Scholarship?',
    'Where do I track my applications?',
  ],
  ja: ['早稲田大学の学校コードは？', 'JASSO学習奨励費の金額は？', '出願の進捗はどこで管理できますか？'],
};

export const assistantSuggestions = (locale: AssistantLocale): string[] => SUGGESTIONS[locale];

// ── Intent detection ─────────────────────────────────────────────────────────

const ABOUT_RE =
  /\b(what (can|do) you (do|answer)|who are you|what is careerverse|help me|what are you)\b|何ができ|どんなこと|使い方|careerverseとは/i;

/**
 * A Japanese institution name: any run of non-delimiter characters ending in
 * 大学. Bounded so a whole sentence cannot become a "name".
 */
const JA_UNIVERSITY_RE = /([^\s、。，．,.?？!！「」『』（）()]{1,20}?大学(?:院)?)/g;

/** An English institution name containing the word University. */
const EN_UNIVERSITY_RE =
  /\b((?:[A-Z][\w'’-]*\s+){0,3}University(?:\s+of\s+[A-Z][\w'’-]*(?:\s+[A-Z][\w'’-]*){0,2})?)/g;

/**
 * Pulls candidate institution names out of a question. Returns the longest
 * candidates first, so "Tokyo University of Science" is tried before "University".
 */
export function extractUniversityQueries(message: string): string[] {
  const found = [
    ...[...message.matchAll(JA_UNIVERSITY_RE)].map((m) => m[1]),
    ...[...message.matchAll(EN_UNIVERSITY_RE)].map((m) => m[1]),
  ]
    .filter((s): s is string => typeof s === 'string')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return [...new Set(found)].sort((a, b) => b.length - a.length);
}

/**
 * Deterministic intent routing.
 *
 * Order matters. A named scholarship programme wins over everything, because
 * that question has an audited answer. A named institution wins over navigation,
 * because "Waseda University" is a stronger signal than the word "university"
 * appearing near a page alias.
 */
export function detectIntent(message: string): AssistantIntent {
  if (detectProgrammes(message).length > 0) return 'scholarship';
  if (
    extractUniversityQueries(message).length > 0 ||
    matchUniversityAliases(message).length > 0
  ) {
    return 'university';
  }
  if (ABOUT_RE.test(message)) return 'about';
  if (retrieveSiteFacts(message).length > 0) return 'navigation';
  return 'none';
}

// ── University answers (deterministic, registry-composed) ────────────────────

const MAX_UNIVERSITY_SECTIONS = 3;

/**
 * Inserts the standard Japanese postal separator. Presentation only — the digits
 * are the registry's, unchanged and in order. Anything that does not look like a
 * 7-digit code is returned untouched rather than reshaped to fit.
 */
export function formatPostalCode(code: string): string {
  return /^\d{7}$/.test(code) ? `${code.slice(0, 3)}-${code.slice(3)}` : code;
}

/**
 * Composes an answer from registry records. Every fact block is a field read off
 * a record; the labels are chrome. Fields the registry does not carry are listed
 * as explicitly not verified, using each record's own note text.
 */
export function composeUniversityAnswer(
  message: string,
  locale: AssistantLocale,
): AssistantAnswer {
  const c = CHROME[locale];
  const source = MEXT_REGISTRY_SOURCE;

  // Romaji aliases first: the registry stores Japanese names only, so an English
  // question can only reach a record through the alias index.
  let records: UniversityRecord[] = matchUniversityAliases(message, MAX_UNIVERSITY_SECTIONS)
    .map((code) => getUniversityByMextCode(code))
    .filter((r): r is UniversityRecord => r !== undefined);

  if (records.length === 0) {
    for (const q of extractUniversityQueries(message)) {
      const hit = retrieveUniversities(q, { limit: MAX_UNIVERSITY_SECTIONS });
      if (hit.records.length > 0) {
        records = hit.records;
        break;
      }
    }
  }

  if (records.length === 0) {
    // Note the reason: the NAME did not match. A failed substring search cannot
    // establish that an institution is absent from the registry, so the copy
    // this maps to must not claim it is.
    return {
      intent: 'university',
      sections: [],
      refused: true,
      refusalReason: 'no-name-match',
      suggestions: SUGGESTIONS[locale],
    };
  }

  const sections = records.map((r) => {
    const blocks: AssistantBlock[] = [{ kind: 'lead', text: c.registryLead }];
    const push = (label: string, value: string): void => {
      blocks.push({ kind: 'fact', text: `${label}: ${value}`, ref: r.mextSchoolCode });
    };

    push(c.field.nameJa, r.nameJa);
    if (r.nameEn) push(c.field.nameEn, r.nameEn);
    push(c.field.sector, c.sectorLabel[r.sector]);
    push(c.field.location, `${r.prefectureJa}${r.municipalityJa}`);
    push(c.field.address, `〒${formatPostalCode(r.postalCode)} ${r.addressJa}`);
    push(c.field.code, r.mextSchoolCode);
    if (r.officialWebsiteUrl) push(c.field.website, r.officialWebsiteUrl);

    blocks.push({ kind: 'not-verified-heading', text: c.registryNotVerified });
    for (const f of ENRICHMENT_FIELDS) {
      const status = r.enrichment[f];
      blocks.push({
        kind: 'not-verified',
        text: locale === 'ja' ? status.noteJa : status.noteEn,
      });
    }

    if (r.provisional) blocks.push({ kind: 'note', text: c.registryProvisional });
    blocks.push({ kind: 'closing', text: c.registryClosing });

    const citations: AssistantCitation[] = [
      {
        label: locale === 'ja' ? source.nameJa : source.nameEn,
        detail: locale === 'ja' ? `取得日: ${source.retrievedAt}` : `Retrieved ${source.retrievedAt}`,
        urls: [source.url],
      },
    ];
    if (r.officialWebsiteUrl) {
      citations.push({ label: r.nameJa, urls: [r.officialWebsiteUrl] });
    }

    return {
      id: r.id,
      title: r.nameJa,
      subtitle: r.nameEn ?? undefined,
      blocks,
      citations,
      // Deliberately not `/schools/${r.id}`: that detail route is backed by the
      // curated dataset, not the MEXT registry, so a registry id renders "not
      // found". Link to the browse page, which exists for every visitor.
      links: [
        { href: '/schools', label: locale === 'ja' ? '学校ギャラクシー' : 'School Galaxy' },
      ],
    };
  });

  return { intent: 'university', sections, refused: false, suggestions: SUGGESTIONS[locale] };
}

// ── Navigation answers (deterministic, site-facts-composed) ──────────────────

export function composeNavigationAnswer(
  message: string,
  locale: AssistantLocale,
): AssistantAnswer {
  const c = CHROME[locale];
  const facts: SiteFact[] = retrieveSiteFacts(message);

  if (facts.length === 0) {
    return {
      intent: 'navigation',
      sections: [],
      refused: true,
      refusalReason: 'no-matching-page',
      suggestions: SUGGESTIONS[locale],
    };
  }

  const sections = facts.map((f) => {
    const blocks: AssistantBlock[] = [
      { kind: 'lead', text: c.navLead },
      { kind: 'fact', text: locale === 'ja' ? f.purposeJa : f.purposeEn, ref: f.id },
    ];
    if (f.requiresAccount) blocks.push({ kind: 'note', text: c.navAccount });

    return {
      id: f.id,
      title: locale === 'ja' ? f.labelJa : f.labelEn,
      blocks,
      citations: [],
      links: [{ href: f.href, label: locale === 'ja' ? f.labelJa : f.labelEn }],
    };
  });

  return { intent: 'navigation', sections, refused: false, suggestions: SUGGESTIONS[locale] };
}

// ── Capability answer ────────────────────────────────────────────────────────

export function composeAboutAnswer(locale: AssistantLocale): AssistantAnswer {
  const c = CHROME[locale];
  const blocks: AssistantBlock[] = [
    { kind: 'lead', text: c.aboutLead },
    ...ABOUT_CAPABILITIES[locale].map(
      (cap): AssistantBlock => ({ kind: 'fact', text: cap.text, ref: cap.ref }),
    ),
    { kind: 'closing', text: c.aboutClosing },
  ];

  return {
    intent: 'about',
    sections: [
      {
        id: 'about',
        title: locale === 'ja' ? 'できること' : 'What I can answer',
        blocks,
        citations: [],
        links: [
          { href: '/sources', label: locale === 'ja' ? 'データソース' : 'Data Sources' },
          { href: '/methodology', label: locale === 'ja' ? '評価方法' : 'Methodology' },
        ],
      },
    ],
    refused: false,
    suggestions: SUGGESTIONS[locale],
  };
}

// ── Scholarship answers (adapted, not re-composed) ───────────────────────────

/**
 * Adapts an answer that the scholarship pipeline already composed and verified.
 *
 * This is a shape change only. No text is rewritten, reordered or merged here —
 * doing so would step outside the `isComposedFromCorpus` tripwire that made the
 * answer trustworthy in the first place.
 */
export function fromScholarshipAnswer(
  resolved: ResolvedAnswer,
  locale: AssistantLocale,
): AssistantAnswer {
  if (resolved.refused || resolved.sections.length === 0) {
    return {
      intent: 'scholarship',
      sections: [],
      refused: true,
      refusalReason: resolved.refusalReason ?? 'no-supported-sections',
      suggestions: SUGGESTIONS[locale],
    };
  }

  const sections = resolved.sections.map((s): AssistantSection => {
    const blocks: AssistantBlock[] = s.blocks.map((b): AssistantBlock => {
      switch (b.kind) {
        case 'fact':
          return { kind: 'fact', text: b.text, ref: b.claimId };
        case 'unpublished':
          return { kind: 'not-verified', text: b.text, ref: b.claimId };
        case 'unpublished-heading':
          return { kind: 'not-verified-heading', text: b.text };
        default:
          return { kind: b.kind, text: b.text };
      }
    });

    const citations: AssistantCitation[] = [
      ...s.citations.map((c) => ({
        label: c.claimId,
        detail: c.statement,
        excerpt: c.excerpt,
        urls: c.sourceUrls,
      })),
      ...s.unpublished.map((c) => ({
        label: c.claimId,
        detail: c.statement,
        urls: c.sourceUrls,
      })),
    ];

    return {
      id: s.programme,
      title: locale === 'ja' ? s.labelJa : s.labelEn,
      subtitle: s.scopeWarning ?? undefined,
      blocks,
      citations,
      links: [
        { href: '/scholarships', label: locale === 'ja' ? '奨学金ページ' : 'Scholarship Explorer' },
      ],
    };
  });

  return { intent: 'scholarship', sections, refused: false, suggestions: SUGGESTIONS[locale] };
}

/** Refusal for a question no corpus covers. */
export function composeRefusal(locale: AssistantLocale): AssistantAnswer {
  return {
    intent: 'none',
    sections: [],
    refused: true,
    refusalReason: 'out-of-scope',
    suggestions: SUGGESTIONS[locale],
  };
}

/** Exposed for tests asserting the chrome carries no institution-specific facts. */
export const ASSISTANT_CHROME = CHROME;
