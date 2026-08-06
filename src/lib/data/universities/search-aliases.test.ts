import { describe, expect, it } from 'vitest';
import {
  matchUniversityAliases,
  normalizeAliasKey,
  UNIVERSITY_SEARCH_ALIASES,
} from './search-aliases';
import { getUniversityByMextCode } from './index';

describe('university search aliases', () => {
  it('points every alias at a code the registry actually contains', () => {
    for (const alias of UNIVERSITY_SEARCH_ALIASES) {
      expect(
        getUniversityByMextCode(alias.code),
        `${alias.keys[0]} -> ${alias.code} is not in the registry`,
      ).toBeDefined();
    }
  });

  it('maps each code exactly once', () => {
    const codes = UNIVERSITY_SEARCH_ALIASES.map((a) => a.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('has no duplicate search key across entries', () => {
    const keys = UNIVERSITY_SEARCH_ALIASES.flatMap((a) => a.keys.map(normalizeAliasKey));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('resolves a plain English question', () => {
    const [code] = matchUniversityAliases('What is Waseda University’s school code?');
    expect(getUniversityByMextCode(code!)!.nameJa).toBe('早稲田大学');
  });

  it('handles the possessive apostrophe and case', () => {
    expect(matchUniversityAliases("KEIO UNIVERSITY's tuition")).toHaveLength(1);
  });

  it('prefers the longest matching name', () => {
    const codes = matchUniversityAliases('Tokyo University of Foreign Studies');
    expect(codes).toHaveLength(1);
    expect(getUniversityByMextCode(codes[0]!)!.nameJa).toBe('東京外国語大学');
  });

  it('returns nothing for an institution it does not index', () => {
    expect(matchUniversityAliases('Hogwarts University')).toHaveLength(0);
  });

  it('does not resolve names of institutions that no longer exist', () => {
    // Merged into 東京科学大学 in 2024 — silently redirecting would show a card
    // the user did not ask for.
    expect(matchUniversityAliases('Tokyo Institute of Technology')).toHaveLength(0);
  });

  it('never claims an alias is an official name', () => {
    // The registry publishes no English names; aliases are a search index only.
    for (const alias of UNIVERSITY_SEARCH_ALIASES) {
      expect(getUniversityByMextCode(alias.code)!.nameEn).toBeNull();
    }
  });
});
