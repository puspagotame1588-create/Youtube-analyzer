'use client';

import { Suspense, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { useQuality } from '@/lib/store/quality';

/**
 * Shared scene shell: applies quality tier (dpr, antialias, frameloop),
 * renders the 2D fallback for Tier C / missing WebGL, and never blocks the
 * page — the canvas streams in behind content.
 */
export function SceneCanvas({
  children,
  fallback,
  className = '',
  camera = { position: [0, 4, 14] as [number, number, number], fov: 45 },
  label,
}: {
  children: ReactNode;
  fallback: ReactNode;
  className?: string;
  camera?: { position: [number, number, number]; fov: number };
  label: string;
}): React.JSX.Element {
  const { tier, reducedMotion, detected } = useQuality();

  // Until detection runs (first client effect), show the lightweight fallback
  // so first paint is instant on every device.
  if (!detected || tier === 'C') {
    return <div className={className}>{fallback}</div>;
  }

  return (
    <div className={className} role="img" aria-label={label}>
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
      >
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  );
}
