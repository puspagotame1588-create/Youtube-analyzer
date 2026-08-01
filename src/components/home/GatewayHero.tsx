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
    <section className="relative overflow-hidden" aria-labelledby="hero-title">
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

      {/* Content is vertically centred inside a content-sized hero: the scene sits
          behind it rather than pushing it to the fold, so there is no dead space
          above the headline on any viewport. */}
      <div className="relative z-10 mx-auto flex min-h-[34rem] max-w-7xl flex-col items-center justify-center px-4 py-16 text-center sm:min-h-[38rem] sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="cv-glass w-full max-w-3xl rounded-panel px-6 py-10 shadow-panel sm:px-12 sm:py-12"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-violet2 sm:text-sm">
            CareerVerse
          </p>
          <h1
            id="hero-title"
            className="text-balance text-[2rem] font-bold leading-[1.15] tracking-tight text-ink sm:text-5xl lg:text-[3.5rem]"
          >
            {t('tagline')}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-ink-soft sm:text-lg">
            {t('sub')}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/create"
              className="inline-flex min-h-[48px] w-full max-w-xs items-center justify-center rounded-full bg-gradient-to-r from-cyan2 to-violet2 px-8 py-3 text-base font-semibold text-white shadow-glow transition-all hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:w-auto"
            >
              {t('cta')}
            </Link>
            <Link
              href="/universe"
              className="inline-flex min-h-[48px] w-full max-w-xs items-center justify-center rounded-full border border-ink/10 bg-white/70 px-8 py-3 text-base font-semibold text-ink transition-all hover:border-cyan2/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan2 sm:w-auto"
            >
              {t('secondaryCta')}
            </Link>
          </div>
          <p className="mt-6 text-sm text-ink-soft">{t('heroNote')}</p>
        </motion.div>
      </div>
    </section>
  );
}
