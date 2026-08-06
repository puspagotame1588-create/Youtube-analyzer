import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  ASSISTANT_CHROME,
  composeAboutAnswer,
  composeNavigationAnswer,
  composeRefusal,
  composeUniversityAnswer,
  detectIntent,
  extractUniversityQueries,
  formatPostalCode,
  fromScholarshipAnswer,
} from './assistant-router';
import { SITE_FACTS } from './site-facts';
import { getUniversityByMextCode } from '@/lib/data/universities';
import { ENRICHMENT_FIELDS } from '@/lib/data/universities/types';

describe('detectIntent', () => {
  it('routes a named scholarship programme to the audited pipeline', () => {
    expect(detectIntent('How much is the JASSO Honors Scholarship?')).toBe('scholarship');
    expect(detectIntent('ロータリー米山奨学金の締切は？')).toBe('scholarship');
  });

  it('routes a Japanese institution name to the registry', () => {
    expect(detectIntent('早稲田大学の学校コードは？')).toBe('university');
  });

  it('routes an English institution name to the registry', () => {
    expect(detectIntent('What is Waseda University’s school code?')).toBe('university');
    expect(detectIntent('Tell me about the University of Tokyo')).toBe('university');
  });

  it('routes a how-do-I question to site navigation', () => {
    expect(detectIntent('Where do I track my applications?')).toBe('navigation');
    expect(detectIntent('出願の締切はどこで管理できますか？')).toBe('navigation');
  });

  it('routes a capability question to the about answer', () => {
    expect(detectIntent('what can you do?')).toBe('about');
    expect(detectIntent('何ができますか')).toBe('about');
  });

  it('returns none for a question no corpus covers', () => {
    expect(detectIntent('What is the weather in Osaka tomorrow?')).toBe('none');
    expect(detectIntent('Write me a poem')).toBe('none');
  });

  it('prefers a named programme over a page alias', () => {
    // Contains both "scholarship" (a page alias) and JASSO (an audited programme).
    expect(detectIntent('JASSO scholarship amount')).toBe('scholarship');
  });
});

describe('extractUniversityQueries', () => {
  it('extracts a Japanese institution name', () => {
    expect(extractUniversityQueries('早稲田大学の学費は？')).toContain('早稲田大学');
  });

  it('extracts an English institution name', () => {
    expect(extractUniversityQueries('Tell me about Waseda University')).toContain(
      'Waseda University',
    );
  });

  it('does not turn a whole sentence into a name', () => {
    for (const q of extractUniversityQueries('日本で一番良いと言われている大学はどこですか')) {
      expect(q.length).toBeLessThanOrEqual(21);
    }
  });

  it('returns nothing when no institution is named', () => {
    expect(extractUniversityQueries('How do I upload documents?')).toHaveLength(0);
  });
});

describe('composeUniversityAnswer', () => {
  it('states only fields the registry record actually carries', () => {
    const answer = composeUniversityAnswer('早稲田大学の学校コードは？', 'en');
    expect(answer.refused).toBe(false);

    const record = getUniversityByMextCode('F113310103581');
    expect(record).toBeDefined();

    const facts = answer.sections[0]!.blocks.filter((b) => b.kind === 'fact');
    expect(facts.length).toBeGreaterThan(0);

    // Every fact block must be traceable to this record: its value appears on
    // the record, and its ref is the record's own school code.
    const values = [
      record!.nameJa,
      record!.nameEn ?? '',
      record!.prefectureJa,
      record!.municipalityJa,
      record!.addressJa,
      formatPostalCode(record!.postalCode),
      record!.mextSchoolCode,
      record!.officialWebsiteUrl ?? '',
      'National',
      'Public',
      'Private',
    ].filter(Boolean);

    for (const f of facts) {
      if (f.kind !== 'fact') continue;
      expect(f.ref).toBe(record!.mextSchoolCode);
      expect(values.some((v) => f.text.includes(v))).toBe(true);
    }
  });

  it('never invents an English name the registry does not publish', () => {
    // All 825 records ship nameEn: null, so no answer may contain one.
    const answer = composeUniversityAnswer('Waseda University', 'en');
    const record = getUniversityByMextCode('F113310103581')!;
    expect(record.nameEn).toBeNull();
    expect(answer.sections[0]!.subtitle).toBeUndefined();
    const text = answer.sections[0]!.blocks.map((b) => b.text).join(' ');
    expect(text).not.toMatch(/Official English name/);
  });

  it('resolves an English query through the alias index', () => {
    const answer = composeUniversityAnswer('What is Waseda University’s school code?', 'en');
    expect(answer.refused).toBe(false);
    expect(answer.sections[0]!.title).toBe('早稲田大学');
  });

  it('lists every enrichment family as explicitly not verified', () => {
    const answer = composeUniversityAnswer('早稲田大学の学費は？', 'en');
    const notVerified = answer.sections[0]!.blocks.filter((b) => b.kind === 'not-verified');
    expect(notVerified).toHaveLength(ENRICHMENT_FIELDS.length);
  });

  it('cites the MEXT registry source on every section', () => {
    const answer = composeUniversityAnswer('東京大学', 'ja');
    for (const s of answer.sections) {
      expect(s.citations.length).toBeGreaterThan(0);
      expect(s.citations[0]!.urls[0]).toContain('mext.go.jp');
    }
  });

  it('adds the postal separator without altering the digits', () => {
    expect(formatPostalCode('1698050')).toBe('169-8050');
    expect(formatPostalCode('1698050').replace('-', '')).toBe('1698050');
    // Anything unexpected is passed through, not reshaped.
    expect(formatPostalCode('16980')).toBe('16980');
  });

  it('refuses with no-name-match rather than claiming absence', () => {
    const answer = composeUniversityAnswer('Hogwarts University', 'en');
    expect(answer.refused).toBe(true);
    expect(answer.refusalReason).toBe('no-name-match');
    expect(answer.sections).toHaveLength(0);
  });

  it('does not link to the dataset-backed school detail route', () => {
    // /schools/[id] reads the curated dataset, not the registry — a registry id
    // there renders "school not found".
    const answer = composeUniversityAnswer('早稲田大学', 'en');
    for (const l of answer.sections[0]!.links) {
      expect(l.href).not.toMatch(/^\/schools\/.+/);
    }
  });
});

describe('composeNavigationAnswer', () => {
  it('answers with a real page and its purpose text verbatim', () => {
    const answer = composeNavigationAnswer('Where do I track my applications?', 'en');
    expect(answer.refused).toBe(false);

    const tracker = SITE_FACTS.find((f) => f.id === 'page-tracker')!;
    const section = answer.sections.find((s) => s.id === 'page-tracker');
    expect(section).toBeDefined();
    expect(section!.links[0]!.href).toBe(tracker.href);

    const fact = section!.blocks.find((b) => b.kind === 'fact');
    expect(fact && fact.kind === 'fact' && fact.text).toBe(tracker.purposeEn);
  });

  it('uses the Japanese purpose text for the ja locale', () => {
    const answer = composeNavigationAnswer('出願の進捗はどこで管理できますか？', 'ja');
    const tracker = SITE_FACTS.find((f) => f.id === 'page-tracker')!;
    const section = answer.sections.find((s) => s.id === 'page-tracker')!;
    const fact = section.blocks.find((b) => b.kind === 'fact');
    expect(fact && fact.kind === 'fact' && fact.text).toBe(tracker.purposeJa);
  });

  it('flags pages that require an account', () => {
    const answer = composeNavigationAnswer('How do I upload documents?', 'en');
    const section = answer.sections.find((s) => s.id === 'page-documents')!;
    expect(section.blocks.some((b) => b.kind === 'note')).toBe(true);
  });

  it('refuses when nothing matches', () => {
    const answer = composeNavigationAnswer('zzzzzz', 'en');
    expect(answer.refused).toBe(true);
    expect(answer.refusalReason).toBe('no-matching-page');
  });
});

describe('site facts integrity', () => {
  it('points every link at a route that exists', () => {
    const appDir = path.resolve(__dirname, '../../app/[locale]');
    for (const fact of SITE_FACTS) {
      const dir = path.join(appDir, fact.href);
      expect(
        existsSync(path.join(dir, 'page.tsx')),
        `${fact.id} -> ${fact.href} has no page.tsx`,
      ).toBe(true);
    }
  });

  it('has unique ids', () => {
    const ids = SITE_FACTS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('supplies both locales for every entry', () => {
    for (const f of SITE_FACTS) {
      expect(f.purposeEn.length).toBeGreaterThan(0);
      expect(f.purposeJa.length).toBeGreaterThan(0);
      expect(f.labelEn.length).toBeGreaterThan(0);
      expect(f.labelJa.length).toBeGreaterThan(0);
    }
  });
});

describe('composeAboutAnswer / composeRefusal', () => {
  it('describes capabilities without promising a fourth one', () => {
    const answer = composeAboutAnswer('en');
    const facts = answer.sections[0]!.blocks.filter((b) => b.kind === 'fact');
    expect(facts).toHaveLength(3);
    expect(answer.refused).toBe(false);
  });

  it('refuses out-of-scope questions with usable suggestions', () => {
    const answer = composeRefusal('en');
    expect(answer.refused).toBe(true);
    expect(answer.refusalReason).toBe('out-of-scope');
    expect(answer.suggestions.length).toBeGreaterThan(0);
  });
});

describe('fromScholarshipAnswer', () => {
  const resolved = {
    sections: [
      {
        programme: 'jasso',
        labelEn: 'JASSO Honors Scholarship',
        labelJa: 'JASSO学習奨励費',
        blocks: [
          { kind: 'lead' as const, text: 'The audited official sources confirm the following:' },
          { kind: 'fact' as const, claimId: 'c-1', text: 'Monthly amount is 48,000 JPY.' },
        ],
        answer: 'x',
        gate: null,
        scopeWarning: null,
        citations: [
          { claimId: 'c-1', statement: 'Monthly amount is 48,000 JPY.', excerpt: '月額48,000円', sourceUrls: ['https://example.org'] },
        ],
        unpublished: [],
      },
    ],
    refused: false,
    verifiedAt: '2026-07-10',
    productionStatus: null,
    droppedClaimIds: [],
  };

  it('carries composed text through unchanged', () => {
    const answer = fromScholarshipAnswer(resolved, 'en');
    expect(answer.intent).toBe('scholarship');
    const fact = answer.sections[0]!.blocks.find((b) => b.kind === 'fact');
    expect(fact && fact.kind === 'fact' && fact.text).toBe('Monthly amount is 48,000 JPY.');
    expect(fact && fact.kind === 'fact' && fact.ref).toBe('c-1');
  });

  it('preserves citations and their source urls', () => {
    const answer = fromScholarshipAnswer(resolved, 'en');
    expect(answer.sections[0]!.citations[0]!.urls).toEqual(['https://example.org']);
  });

  it('propagates a refusal instead of rendering an empty section', () => {
    const answer = fromScholarshipAnswer(
      { ...resolved, sections: [], refused: true, refusalReason: 'no-relevant-claims' },
      'en',
    );
    expect(answer.refused).toBe(true);
    expect(answer.refusalReason).toBe('no-relevant-claims');
  });
});

describe('chrome carries no institution-specific facts', () => {
  it('has no digits in any connective string', () => {
    // A number in the chrome would be a fact the corpus did not supply.
    for (const locale of ['en', 'ja'] as const) {
      const c = ASSISTANT_CHROME[locale];
      const strings = [
        c.registryLead,
        c.registryNotVerified,
        c.registryClosing,
        c.navLead,
        c.navAccount,
        c.aboutLead,
        c.aboutClosing,
        c.noNameMatch,
      ];
      for (const s of strings) {
        expect(s, `chrome string contains a digit: ${s}`).not.toMatch(/\d/);
      }
    }
  });
});
