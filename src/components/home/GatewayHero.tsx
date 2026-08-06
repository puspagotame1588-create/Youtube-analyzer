'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useQuality } from '@/lib/store/quality';
import { SceneCanvas } from '@/components/three/SceneCanvas';
import { CAMPUSES } from '@/components/three/campus/data';

/** The 3D district is code-split and never server-rendered — it must not block paint. */
const TokyoCampusScene = dynamic(
  () => import('@/components/three/TokyoCampusScene').then((m) => m.TokyoCampusScene),
  { ssr: false, loading: () => null },
);

/**
 * Static district fallback: Tier C, no WebGL, reduced-motion "2D view", and the
 * pre-detection frame. Pure CSS — no canvas, no JS animation, no layout cost.
 */
function StaticDistrict(): React.JSX.Element {
  return (
    <div aria-hidden="true" className="cv-hero-gradient absolute inset-0 overflow-hidden">
      <svg
        className="absolute inset-x-0 bottom-0 h-[62%] w-full"
        viewBox="0 0 1440 420"
        preserveAspectRatio="xMidYMax slice"
        role="presentation"
      >
        {/* distant skyline */}
        <g fill="#c8d5ea" opacity="0.55">
          {[
            [40, 150],
            [96, 96],
            [150, 200],
            [214, 130],
            [268, 170],
            [330, 84],
            [382, 220],
            [446, 118],
            [500, 160],
            [560, 92],
            [612, 186],
            [676, 128],
            [742, 208],
            [806, 104],
            [858, 168],
            [920, 132],
            [984, 196],
            [1046, 88],
            [1100, 176],
            [1164, 122],
            [1226, 204],
            [1288, 110],
            [1348, 158],
            [1402, 190],
          ].map(([x, h], i) => (
            <rect
              key={i}
              x={x}
              y={300 - (h ?? 0)}
              width={i % 3 === 0 ? 38 : 28}
              height={h}
              rx="2"
            />
          ))}
        </g>
        {/* ground + campus lawn */}
        <rect x="0" y="298" width="1440" height="122" fill="#e9edf3" />
        <ellipse cx="720" cy="404" rx="760" ry="118" fill="#cfe0cf" />
        {/* stylised campus landmarks, echoing the 3D district */}
        <g>
          {/* clock tower */}
          <rect x="150" y="232" width="76" height="70" fill="#dcd3c4" />
          <rect x="176" y="196" width="26" height="106" fill="#c2b7a5" />
          <path d="M176 196 L189 172 L202 196 Z" fill="#49536b" />
          <circle cx="189" cy="214" r="6" fill="#fdfcf8" stroke="#3a4258" strokeWidth="2" />
          {/* copper dome hall */}
          <rect x="330" y="252" width="104" height="50" fill="#dcd3c4" />
          <path d="M356 252 a26 26 0 0 1 52 0 Z" fill="#7fb59b" />
          {/* brick library */}
          <rect x="560" y="244" width="92" height="58" fill="#a8544a" />
          <path d="M598 244 L620 220 L642 244 Z" fill="#3a4258" />
          {/* glass twin towers */}
          <rect x="980" y="188" width="44" height="114" fill="#9fc0e4" />
          <rect x="1030" y="222" width="34" height="80" fill="#7ea4cf" />
          {/* slender high-rise */}
          <rect x="1230" y="150" width="40" height="152" fill="#9fc0e4" />
          <rect x="1240" y="132" width="20" height="24" fill="#e6e9f2" />
        </g>
        {/* trees */}
        <g fill="#7fa88a">
          {[80, 260, 300, 470, 500, 700, 730, 860, 900, 1120, 1160, 1330, 1380].map((x, i) => (
            <path key={i} d={`M${x} 302 l-13 0 l13 -30 l13 30 Z`} opacity={i % 2 ? 0.85 : 0.6} />
          ))}
        </g>
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-base" />
    </div>
  );
}

/** Tracks a media query without tripping hydration — false until mounted. */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const sync = (): void => setMatches(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [query]);
  return matches;
}

export function GatewayHero(): React.JSX.Element {
  const t = useTranslations('home');
  const locale = useLocale();
  const { tier } = useQuality();

  // The hint only makes sense while the interactive canvas is actually on screen.
  const [sceneLive, setSceneLive] = useState(false);
  const handleModeChange = useCallback((mode: '2d' | '3d') => setSceneLive(mode === '3d'), []);

  /**
   * Below 768px the canvas is skipped entirely — not merely swapped for a
   * fallback by SceneCanvas's own tier logic, which is device-capability based
   * and would happily run WebGL on a capable phone. A static SVG on a phone is
   * the right call regardless of what the GPU could manage.
   */
  const wideEnoughFor3D = useMediaQuery('(min-width: 768px)');

  const ja = locale === 'ja';
  const campusList = CAMPUSES.map((c) => (ja ? c.nameJa : c.nameEn)).join(ja ? '、' : ', ');
  const sceneLabel = ja
    ? `東京の大学街を表した3Dシーン。${campusList}のキャンパスを様式化して表現しています（実際の建築を再現したものではありません）。`
    : `A 3D miniature of a Tokyo university district showing stylised representations of ${campusList}. The buildings are visual representations, not architectural reproductions.`;

  const trustPoints = [
    { key: 'sources', title: t('trustPoint1Title'), body: t('trustPoint1Body') },
    { key: 'assumptions', title: t('trustPoint2Title'), body: t('trustPoint2Body') },
    { key: 'inspect', title: t('trustPoint3Title'), body: t('trustPoint3Body') },
  ];

  return (
    <section className="relative overflow-hidden bg-base" aria-labelledby="hero-title">
      {/*
        Two columns on desktop: copy at 44%, canvas full-bleed to the right edge
        at 56%. Below 1024px they stack, copy first. The canvas is a grid cell
        rather than an absolutely-positioned backdrop, which is what lets the
        copy sit on the page background with no glass panel and no
        backdrop-filter behind it.
      */}
      <div className="grid grid-cols-1 lg:min-h-[40rem] lg:grid-cols-[44fr_56fr]">
        <div className="flex flex-col justify-center px-6 py-12 text-center sm:px-10 sm:py-16 lg:py-20 lg:pl-12 lg:pr-10 lg:text-left xl:pl-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="mx-auto w-full max-w-xl lg:mx-0"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-violet2 sm:text-sm">
              CareerVerse
            </p>
            <h1
              id="hero-title"
              className="text-balance text-[2rem] font-bold leading-[1.15] tracking-tight text-ink sm:text-5xl lg:text-[3.25rem]"
            >
              {t('tagline')}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-ink-soft sm:text-lg lg:mx-0">
              {t('sub')}
            </p>

            {/* Three across while the column is full width; stacked once it
                narrows to 44%, where three columns would be ~150px each. */}
            <ul className="mt-7 grid gap-4 border-y border-ink/10 py-5 text-left sm:grid-cols-3 lg:grid-cols-1 lg:gap-3">
              {trustPoints.map((p) => (
                <li key={p.key}>
                  <p className="text-sm font-semibold text-ink">{p.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">{p.body}</p>
                </li>
              ))}
            </ul>

            <p className="mt-5 text-sm text-ink-soft">{t('audience')}</p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
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

            <p className="mt-6 text-xs text-ink-soft">{t('heroNote')}</p>
          </motion.div>
        </div>

        <div className="relative h-[45vh] w-full lg:h-auto">
          {/* SceneCanvas's own wrapper is `relative`, so it cannot also be the
              absolutely-positioned box — the two position utilities collide and
              it collapses to zero height. The absolute layer goes here instead,
              giving its `h-full` a definite height to resolve against. */}
          <div className="absolute inset-0">
            {wideEnoughFor3D ? (
              <SceneCanvas
                label={sceneLabel}
                fallback={<StaticDistrict />}
                className="h-full w-full"
                /* Reframed for the 56%-wide canvas — see the framing note in
                 TokyoCampusScene. */
                camera={{ position: [0, 134, 148], fov: 32 }}
                onModeChange={handleModeChange}
                shadows={tier === 'A'}
                filmic
              >
                <TokyoCampusScene showLabels />
              </SceneCanvas>
            ) : (
              <StaticDistrict />
            )}
          </div>

          {/* Softens the column boundary. Wider on desktop, where it is the
              actual seam; on the stacked layout the seam is horizontal, so the
              bottom fade does the work instead. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-base via-base/70 to-transparent lg:w-40"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-base lg:hidden"
          />

          {/* Interaction hint — only meaningful when the live scene is on screen. */}
          {sceneLive && (
            <div className="pointer-events-none absolute bottom-4 right-4 z-10 flex flex-col items-end gap-1.5 text-right">
              <p className="rounded-full bg-ink/75 px-4 py-1.5 text-xs font-medium text-white backdrop-blur">
                {t('sceneHint')}
              </p>
              <p className="max-w-[18rem] text-[11px] text-ink-soft">{t('sceneDisclaimer')}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
