import type { Bi } from '@/lib/i18n/bi';
import type { FactorId, RouteLabel } from '@/lib/simulation/types';

export const FACTOR_LABELS: Record<FactorId, Bi> = {
  affordability: { en: 'Affordability', ja: '費用適合度' },
  visa: { en: 'Visa feasibility', ja: '在留資格の実現性' },
  employment: { en: 'Employment feasibility', ja: '就職実現性' },
  salary: { en: 'Salary potential', ja: '給与ポテンシャル' },
  location: { en: 'Location preference', ja: '希望地との一致' },
  settlement: { en: 'Long-term settlement alignment', ja: '長期定住との整合性' },
  interest: { en: 'Interests & skills', ja: '興味・スキル適合' },
};

export const ROUTE_LABEL_TEXT: Record<RouteLabel, Bi> = {
  'best-overall': { en: 'Best Overall', ja: '総合ベスト' },
  safest: { en: 'Safest', ja: '最も安全' },
  fastest: { en: 'Fastest to Employment', ja: '就職まで最短' },
  'long-term': { en: 'Highest Long-Term Potential', ja: '長期的な可能性が最大' },
};

export const LEVEL_TEXT: Record<string, Bi> = {
  low: { en: 'Low', ja: '低' },
  medium: { en: 'Medium', ja: '中' },
  high: { en: 'High', ja: '高' },
  weak: { en: 'Weak', ja: '弱い' },
  moderate: { en: 'Moderate', ja: '中程度' },
  strong: { en: 'Strong', ja: '強い' },
};
