'use client';

import { Component, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { useLocale } from 'next-intl';
import { useQuality } from '@/lib/store/quality';

/**
 * Shared scene shell with full resilience:
 * - quality tiers (dpr, antialias, frameloop) and Tier C / no-WebGL fallback
 * - error boundary + WebGL context-loss handling → 2D fallback with retry
 * - user-facing "2D view" toggle so the simplified view is always one tap away
 * - the canvas streams in behind content and never blocks the page
 */

class SceneErrorBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(): void {
    this.props.onError();
  }

  render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}

export function SceneCanvas({
  children,
  fallback,
  className = '',
  camera = { position: [0, 4, 14] as [number, number, number], fov: 45 },
  label,
  onModeChange,
}: {
  children: ReactNode;
  fallback: ReactNode;
  className?: string;
  camera?: { position: [number, number, number]; fov: number };
  label: string;
  /** Optional: notified whenever the canvas swaps between the live and 2D view. */
  onModeChange?: (mode: '2d' | '3d') => void;
}): React.JSX.Element {
  const { tier, reducedMotion, detected } = useQuality();
  const locale = useLocale();
  const ja = locale === 'ja';
  const [force2D, setForce2D] = useState(false);
  const [sceneError, setSceneError] = useState(false);
  const [ready, setReady] = useState(false);

  // If the canvas hasn't produced a frame within 12s, offer the 2D view
  // instead of an indefinite implicit "loading" state.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (ready || force2D || sceneError) return;
    const id = setTimeout(() => setTimedOut(true), 12_000);
    return () => clearTimeout(id);
  }, [ready, force2D, sceneError]);

  const use2D = !detected || tier === 'C' || force2D || sceneError;

  useEffect(() => {
    onModeChange?.(use2D ? '2d' : '3d');
  }, [use2D, onModeChange]);

  if (use2D) {
    return (
      <div className={`relative ${className}`}>
        {fallback}
        {/* An explicit switch to 2D is not a failure: tearing the canvas down can
            trip the error boundary, so a deliberate force2D always wins here. */}
        {sceneError && !force2D && (
          <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-white/90 px-4 py-1.5 text-xs text-ink shadow-panel">
            {ja ? '3D表示でエラーが発生したため、2D表示に切り替えました。' : '3D view hit an error — switched to the 2D view.'}{' '}
            <button
              onClick={() => {
                setSceneError(false);
                setForce2D(false);
                setReady(false);
                setTimedOut(false);
              }}
              className="font-semibold text-cyan2 hover:underline"
            >
              {ja ? '再試行' : 'Retry 3D'}
            </button>
          </div>
        )}
        {detected && tier !== 'C' && force2D && (
          <button
            onClick={() => {
              setSceneError(false);
              setForce2D(false);
              setReady(false);
              setTimedOut(false);
            }}
            className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-panel hover:text-cyan2"
          >
            {ja ? '3D表示に戻す' : 'Back to 3D view'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} role="img" aria-label={label}>
      {/* Loading shimmer until the first frame */}
      {!ready && (
        <div aria-hidden="true" className="cv-hero-gradient absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-white/85 px-4 py-2 text-xs font-medium text-ink-soft shadow-panel">
            {timedOut
              ? ja
                ? '3Dの読み込みに時間がかかっています…'
                : '3D is taking a while to load…'
              : ja
                ? '3Dシーンを読み込み中…'
                : 'Loading 3D scene…'}
            {timedOut && (
              <button onClick={() => setForce2D(true)} className="ml-2 font-semibold text-cyan2 hover:underline">
                {ja ? '2D表示を使う' : 'Use 2D view'}
              </button>
            )}
          </div>
        </div>
      )}

      <SceneErrorBoundary onError={() => setSceneError(true)}>
        <Canvas
          flat /* NoToneMapping — keeps the pearl-and-pastel palette true to token colors */
          dpr={tier === 'A' ? [1, 2] : [1, 1.5]}
          gl={{
            antialias: tier === 'A',
            powerPreference: tier === 'A' ? 'high-performance' : 'low-power',
            alpha: true,
          }}
          camera={camera}
          frameloop={reducedMotion ? 'demand' : 'always'}
          style={{ touchAction: 'pan-y' }}
          onCreated={({ gl }) => {
            setReady(true);
            gl.domElement.addEventListener(
              'webglcontextlost',
              (e) => {
                e.preventDefault();
                setSceneError(true);
              },
              { once: true },
            );
          }}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      </SceneErrorBoundary>

      {/* Always-available simplified view */}
      <button
        onClick={() => setForce2D(true)}
        className="absolute right-3 top-3 z-10 rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold text-ink-soft shadow-panel backdrop-blur hover:text-ink"
      >
        {ja ? '2D表示' : '2D view'}
      </button>
    </div>
  );
}
