/**
 * Bilingual content helper. UI chrome uses next-intl messages; data-driven and
 * page-level content is authored as typed {en, ja} pairs colocated with the
 * page (see DECISIONS.md #16) so both languages are always present at compile
 * time. Future locales extend this type.
 */

export interface Bi {
  en: string;
  ja: string;
}

export const pick = (b: Bi, locale: string): string => (locale === 'ja' ? b.ja : b.en);

export const yen = (v: number): string => `¥${v.toLocaleString()}`;

export const months = (m: number, locale: string): string => {
  if (locale === 'ja') {
    return m >= 12 ? `${Math.floor(m / 12)}年${m % 12 ? `${m % 12}か月` : ''}` : `${m}か月`;
  }
  if (m >= 12) {
    const y = Math.floor(m / 12);
    const rest = m % 12;
    return `${y} yr${y > 1 ? 's' : ''}${rest ? ` ${rest} mo` : ''}`;
  }
  return `${m} mo`;
};
