import type { ReactNode } from 'react';

export type BadgeTone = 'verified' | 'demo' | 'risk' | 'uncertain' | 'sponsored' | 'info' | 'future';

const tones: Record<BadgeTone, { cls: string; icon: string }> = {
  verified: { cls: 'bg-emerald2/10 text-emerald2 border-emerald2/30', icon: '✓' },
  demo: { cls: 'bg-amber2/10 text-amber2 border-amber2/30', icon: '◳' },
  risk: { cls: 'bg-coral/10 text-coral border-coral/30', icon: '⚠' },
  uncertain: { cls: 'bg-amber2/10 text-amber2 border-amber2/30', icon: '～' },
  sponsored: { cls: 'bg-ink-soft/10 text-ink-soft border-ink-soft/30', icon: 'AD' },
  info: { cls: 'bg-indigo2/10 text-indigo2 border-indigo2/30', icon: 'ℹ' },
  future: { cls: 'bg-violet2/10 text-violet2 border-violet2/30', icon: '◇' },
};

/** Semantic badge — icon + text so color is never the only signal. */
export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }): React.JSX.Element {
  const t = tones[tone];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${t.cls}`}
    >
      <span aria-hidden="true">{t.icon}</span>
      {children}
    </span>
  );
}
