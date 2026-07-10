import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: 'rgb(var(--cv-base) / <alpha-value>)',
        ink: 'rgb(var(--cv-ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--cv-ink-soft) / <alpha-value>)',
        indigo2: 'rgb(var(--cv-indigo) / <alpha-value>)',
        cyan2: 'rgb(var(--cv-cyan) / <alpha-value>)',
        violet2: 'rgb(var(--cv-violet) / <alpha-value>)',
        emerald2: 'rgb(var(--cv-emerald) / <alpha-value>)',
        amber2: 'rgb(var(--cv-amber) / <alpha-value>)',
        coral: 'rgb(var(--cv-coral) / <alpha-value>)',
      },
      fontFamily: {
        sans: [
          'var(--font-inter)',
          'ui-sans-serif',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"Hiragino Sans"',
          '"Noto Sans JP"',
          '"Yu Gothic UI"',
          'sans-serif',
        ],
      },
      borderRadius: {
        panel: '1.25rem',
      },
      boxShadow: {
        panel: '0 8px 32px rgba(27, 35, 64, 0.10)',
        glow: '0 0 24px rgba(0, 184, 217, 0.35)',
      },
      backgroundImage: {
        'cv-hero':
          'linear-gradient(140deg, #f7f8fc 0%, #eef4ff 30%, #f3edff 60%, #eafcf6 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
