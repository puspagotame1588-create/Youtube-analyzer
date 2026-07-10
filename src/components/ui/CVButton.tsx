'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const styles: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-cyan2 to-violet2 text-white shadow-glow hover:brightness-110 active:brightness-95',
  secondary:
    'cv-glass-strong text-ink border border-ink/10 hover:border-cyan2/50 hover:shadow-panel',
  ghost: 'text-indigo2 hover:bg-indigo2/5',
  danger: 'bg-coral text-white hover:brightness-110',
};

export function CVButton({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }): React.JSX.Element {
  return (
    <button
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
