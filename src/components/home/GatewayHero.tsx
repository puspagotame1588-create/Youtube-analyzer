'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useQuality } from '@/lib/store/quality';
import { SceneCanvas } from '@/components/three/SceneCanvas';

const GatewayScene = dynamic(
  () => import('@/components/three/GatewayScene').then((m) => m.GatewayScene),
  { ssr: false, loading: () => null },
);

/** Static luminous-city fallback (Tier C / no WebGL / pre-detection). */
function StaticCity(): React.JSX.Element {
  return (
    <div aria-hidden="true" className="cv-hero-gradient absolute inset-0 overflow-hidden">
      <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-end gap-2 opacity-70">
        {[38, 64, 46, 88, 56, 72, 40, 96, 60, 50, 78, 44].map((h, i) => (
          <div
            key={i}
            className="cv-depth-card w-6 rounded-t-md bg-white/80 sm:w-8"
            style={{
              height: `${h}px`,
              boxShadow: `0 0 18px rgba(${i % 3 === 0 ? '0,184,217' : i % 3 === 1 ? '139,92,246' : '16,185,129'},0.25)`,
            }}
          />
        ))}
      </div>
      <div className="absolute left-[12%] top-[22%] h-3 w-3 rounded-full bg-cyan2/60 blur-[1px]" />
      <div className="absolute right-[18%] top-[30%] h-2 w-2 rounded-full bg-violet2/60 blur-[1px]" />
      <div className="absolute left-[30%] top-[45%] h-2 w-2 rounded-full bg-emerald2/60 blur-[1px]" />
    </div>
  );
}

export function GatewayHero(): React.JSX.Element {
  const t = useTranslations('home');
  const locale = useLocale();
  const { tier } = useQuality();

  const labels = {
    university: t('scene.university'),
    vocational: t('scene.vocational'),
    work: t('scene.work'),
    scholarship: t('scene.scholarship'),
    visa: t('scene.visa'),
  };

  return (
    <section className="relative min-h-[88svh] overflow-hidden">
      <div className="absolute inset-0">
        <SceneCanvas
          label={
            locale === 'ja'
              ? '日本での未来を表す光る浮遊都市。大学・専門学校・就職への道が光の線で描かれています。'
              : 'A luminous floating city representing your future in Japan, with light paths leading to university, vocational school, and employment.'
          }
          fallback={<StaticCity />}
          className="h-full w-full"
          camera={{ position: [0, 4, 14], fov: 45 }}
        >
          <GatewayScene labels={labels} />
        </SceneCanvas>
        {tier !== 'C' && <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-base" />}
      </div>

      <div className="relative z-10 mx-auto flex min-h-[88svh] max-w-7xl flex-col items-center justify-end px-4 pb-12 text-center sm:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="cv-glass rounded-panel px-6 py-8 shadow-panel sm:px-12 sm:py-10"
        >
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-violet2">
            CareerVerse
          </p>
          <h1 className="max-w-2xl text-balance text-3xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
            {t('tagline')}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-ink-soft sm:text-lg">
            {t('sub')}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/create"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-gradient-to-r from-cyan2 to-violet2 px-8 py-3 text-base font-semibold text-white shadow-glow transition-all hover:brightness-110"
            >
              {t('cta')}
            </Link>
            <Link
              href="/schools"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-ink/10 bg-white/70 px-8 py-3 text-base font-semibold text-ink transition-all hover:border-cyan2/50"
            >
              {t('secondaryCta')}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
