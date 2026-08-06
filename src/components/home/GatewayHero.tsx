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
            [40, 150], [96, 96], [150, 200], [214, 130], [268, 170], [330, 84],
            [382, 220], [446, 118], [500, 160], [560, 92], [612, 186], [676, 128],
            [742, 208], [806, 104], [858, 168], [920, 132], [984, 196], [1046, 88],
            [1100, 176], [1164, 122], [1226, 204], [1288, 110], [1348, 158], [1402, 190],
          ].map(([x, h], i) => (
            <rect key={i} x={x} y={300 - (h ?? 0)} width={i % 3 === 0 ? 38 : 28} height={h} rx="2" />
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

export function GatewayHero(): React.JSX.Element {
  const t = useTranslations('home');
  const locale = useLocale();
  const { tier } = useQuality();

  // Labels are DOM overlays; on narrow viewports they crowd the card, so the
  // scene renders without them and the district reads as pure atmosphere.
  // The hint only makes sense while the interactive canvas is actually on screen.
  const [sceneLive, setSceneLive] = useState(false);
  const handleModeChange = useCallback((mode: '2d' | '3d') => setSceneLive(mode === '3d'), []);

  const [wideEnoughForLabels, setWideEnoughForLabels] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = (): void => setWideEnoughForLabels(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

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
    <section className="relative overflow-hidden" aria-labelledby="hero-title">
      <div className="absolute inset-0">
        <SceneCanvas
          label={sceneLabel}
          fallback={<StaticDistrict />}
          className="h-full w-full"
          /* ~29° elevation at ~115 units on a 32° lens — see the framing note in
             TokyoCampusScene. The old [0,19,70]/45° sat 15° up and inside the
             fabric, which is why the district read as a street rather than a model. */
          camera={{ position: [0, 62, 104], fov: 32 }}
          onModeChange={handleModeChange}
          shadows={tier === 'A'}
          filmic
        >
          <TokyoCampusScene showLabels={wideEnoughForLabels} />
        </SceneCanvas>
        {tier !== 'C' && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-base" />
        )}
      </div>

      {/* pointer-events-none lets drag-to-rotate reach the canvas everywhere the
          card and its controls aren't. */}
      <div className="pointer-events-none relative z-10 mx-auto flex min-h-[32rem] max-w-7xl flex-col items-center justify-center px-4 py-12 text-center sm:min-h-[36rem] sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="cv-glass pointer-events-auto w-full max-w-3xl rounded-panel px-6 py-8 shadow-panel sm:px-12 sm:py-10"
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

          <ul className="mt-7 grid gap-4 border-y border-ink/10 py-5 text-left sm:grid-cols-3">
            {trustPoints.map((p) => (
              <li key={p.key}>
                <p className="text-sm font-semibold text-ink">{p.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">{p.body}</p>
              </li>
            ))}
          </ul>

          <p className="mt-5 text-sm text-ink-soft">{t('audience')}</p>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
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

        {/* Interaction hint — only meaningful when the live scene is on screen. */}
        {sceneLive && (
          <div className="pointer-events-none mt-6 flex flex-col items-center gap-1.5">
            <p className="rounded-full bg-ink/75 px-4 py-1.5 text-xs font-medium text-white backdrop-blur">
              {t('sceneHint')}
            </p>
            <p className="text-[11px] text-ink-soft">{t('sceneDisclaimer')}</p>
          </div>
        )}
      </div>
    </section>
  );
}
