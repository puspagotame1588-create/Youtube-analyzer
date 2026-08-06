/**
 * Romaji / English search aliases for the MEXT registry.
 *
 * WHY THIS EXISTS: the canonical MEXT school-code release carries Japanese
 * names only — all 825 records have `nameEn: null`. Without an alias index an
 * English-speaking visitor asking about "Waseda University" matches nothing,
 * which is the wrong answer for a site whose audience is foreign students.
 *
 * WHAT THIS IS NOT: these strings are a SEARCH INDEX, not official names. None
 * of them is ever displayed as a fact. An answer built from a record resolved
 * through this table still shows only the official Japanese name the registry
 * publishes, because that is the only name an official source backs.
 *
 * Every code below was verified against the registry at authoring time, and
 * `search-aliases.test.ts` re-verifies on every run — an alias pointing at a
 * code the registry does not contain fails the build.
 *
 * Institutions that no longer exist under a former name are deliberately
 * absent. 東京工業大学 and 東京医科歯科大学 merged into 東京科学大学 in 2024;
 * silently redirecting the old names would show a card the user did not ask
 * for, so those queries fall through to an honest "could not match" instead.
 */

export interface UniversityAlias {
  /** Immutable MEXT school code — the registry's own primary key. */
  code: string;
  /** Lowercase search keys. Matched against the normalized question. */
  keys: string[];
}

export const UNIVERSITY_SEARCH_ALIASES: UniversityAlias[] = [
  { code: 'F113310103581', keys: ['waseda university', 'waseda'] },
  { code: 'F113310102984', keys: ['keio university', 'keio gijuku university', 'keio'] },
  { code: 'F113110102700', keys: ['university of tokyo', 'tokyo university', 'todai'] },
  { code: 'F126110107407', keys: ['kyoto university', 'university of kyoto'] },
  { code: 'F127110107852', keys: ['osaka university', 'university of osaka', 'handai'] },
  { code: 'F104110100856', keys: ['tohoku university'] },
  { code: 'F123110106429', keys: ['nagoya university'] },
  { code: 'F140110110592', keys: ['kyushu university'] },
  { code: 'F101110100010', keys: ['hokkaido university'] },
  { code: 'F113110102791', keys: ['hitotsubashi university'] },
  { code: 'F108110101423', keys: ['university of tsukuba', 'tsukuba university'] },
  { code: 'F128110108654', keys: ['kobe university'] },
  { code: 'F134110109780', keys: ['hiroshima university'] },
  { code: 'F113110112030', keys: ['institute of science tokyo', 'science tokyo'] },
  { code: 'F113310103064', keys: ['sophia university'] },
  { code: 'F113310103536', keys: ['meiji university'] },
  { code: 'F113310103563', keys: ['rikkyo university', 'saint pauls university'] },
  { code: 'F113310103224', keys: ['chuo university'] },
  { code: 'F113310103484', keys: ['hosei university'] },
  { code: 'F113310102920', keys: ['aoyama gakuin university', 'aoyama gakuin'] },
  { code: 'F126310107617', keys: ['ritsumeikan university'] },
  { code: 'F126310107564', keys: ['doshisha university'] },
  { code: 'F127310108081', keys: ['kansai university'] },
  { code: 'F128310108847', keys: ['kwansei gakuin university', 'kwansei gakuin'] },
  { code: 'F113310103395', keys: ['nihon university', 'nippon university'] },
  { code: 'F113310103368', keys: ['toyo university'] },
  { code: 'F113310103028', keys: ['komazawa university'] },
  { code: 'F113310103162', keys: ['senshu university'] },
  { code: 'F113310103233', keys: ['tokai university'] },
  { code: 'F127310108116', keys: ['kindai university', 'kinki university'] },
  { code: 'F114110104592', keys: ['yokohama national university'] },
  { code: 'F112110102337', keys: ['chiba university'] },
  { code: 'F133110109503', keys: ['okayama university'] },
  { code: 'F117110105393', keys: ['kanazawa university'] },
  { code: 'F115110105046', keys: ['niigata university'] },
  { code: 'F143110111295', keys: ['kumamoto university'] },
  { code: 'F120110105771', keys: ['shinshu university'] },
  { code: 'F111110101945', keys: ['saitama university'] },
  { code: 'F113110102728', keys: ['tokyo university of foreign studies', 'gaidai'] },
  { code: 'F113110102755', keys: ['ochanomizu university'] },
  { code: 'F113210102824', keys: ['tokyo metropolitan university'] },
  { code: 'F127210111989', keys: ['osaka metropolitan university'] },
  { code: 'F105210101077', keys: ['akita international university'] },
  { code: 'F144310111450', keys: ['ritsumeikan asia pacific university'] },
  { code: 'F113310103714', keys: ['international christian university'] },
  { code: 'F113110102782', keys: ['university of electro communications'] },
  { code: 'F113110102773', keys: ['tokyo university of agriculture and technology'] },
  { code: 'F114110104609', keys: ['graduate university for advanced studies', 'sokendai'] },
];

/** Lowercase, strip punctuation, collapse whitespace. Not a display transform. */
export function normalizeAliasKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’'`."]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const KEYS: { key: string; code: string }[] = UNIVERSITY_SEARCH_ALIASES.flatMap((a) =>
  a.keys.map((key) => ({ key: normalizeAliasKey(key), code: a.code })),
).sort((a, b) => b.key.length - a.key.length);

/**
 * Finds registry codes whose alias appears in the question. Longest key first,
 * so "tokyo university of foreign studies" wins over "tokyo university".
 */
export function matchUniversityAliases(message: string, limit = 3): string[] {
  const normalized = normalizeAliasKey(message);
  if (normalized === '') return [];

  const codes: string[] = [];
  const consumed: string[] = [];

  for (const { key, code } of KEYS) {
    if (codes.length >= limit) break;
    if (codes.includes(code)) continue;
    if (!normalized.includes(key)) continue;
    // Skip a short key already covered by a longer match, so "tokyo university
    // of foreign studies" does not also return the University of Tokyo.
    if (consumed.some((longer) => longer.includes(key))) continue;
    codes.push(code);
    consumed.push(key);
  }

  return codes;
}
