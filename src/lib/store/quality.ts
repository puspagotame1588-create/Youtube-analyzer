'use client';

/**
 * Rendering-quality and motion state. Kept separate from business data.
 * Tier A: full visuals. Tier B: balanced. Tier C: essential (no WebGL canvas).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type QualityTier = 'A' | 'B' | 'C';
export type QualityPreference = 'auto' | 'full' | 'balanced' | 'battery' | 'reduced';

interface QualityState {
  preference: QualityPreference;
  detectedTier: QualityTier;
  reducedMotionOS: boolean;
  webglAvailable: boolean;
  detected: boolean;
  setPreference: (p: QualityPreference) => void;
  runDetection: () => void;
}

function detectTier(): { tier: QualityTier; webgl: boolean } {
  if (typeof window === 'undefined') return { tier: 'B', webgl: true };
  let webgl = false;
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    webgl = Boolean(gl);
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webgl = false;
  }
  if (!webgl) return { tier: 'C', webgl };

  const nav = navigator as Navigator & { deviceMemory?: number };
  const memory = nav.deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency || 4;
  const isMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);

  if (memory >= 8 && cores >= 8 && !isMobile) return { tier: 'A', webgl };
  if (memory >= 4 && cores >= 4) return { tier: 'B', webgl };
  return { tier: 'C', webgl };
}

export const useQualityStore = create<QualityState>()(
  persist(
    (set) => ({
      preference: 'auto',
      detectedTier: 'B',
      reducedMotionOS: false,
      webglAvailable: true,
      detected: false,
      setPreference: (preference) => set({ preference }),
      runDetection: () => {
        const { tier, webgl } = detectTier();
        const reduced =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        set({ detectedTier: tier, webglAvailable: webgl, reducedMotionOS: reduced, detected: true });
      },
    }),
    { name: 'cv-quality', partialize: (s) => ({ preference: s.preference }) },
  ),
);

/** Effective tier after user preference and OS settings. */
export function effectiveTier(s: Pick<QualityState, 'preference' | 'detectedTier' | 'webglAvailable'>): QualityTier {
  if (!s.webglAvailable) return 'C';
  switch (s.preference) {
    case 'full':
      return 'A';
    case 'balanced':
      return 'B';
    case 'battery':
    case 'reduced':
      return 'C';
    default:
      return s.detectedTier;
  }
}

export function effectiveReducedMotion(s: Pick<QualityState, 'preference' | 'reducedMotionOS'>): boolean {
  return s.reducedMotionOS || s.preference === 'reduced';
}

export function useQuality(): {
  tier: QualityTier;
  reducedMotion: boolean;
  webglAvailable: boolean;
  detected: boolean;
  preference: QualityPreference;
  setPreference: (p: QualityPreference) => void;
  runDetection: () => void;
} {
  const s = useQualityStore();
  return {
    tier: effectiveTier(s),
    reducedMotion: effectiveReducedMotion(s),
    webglAvailable: s.webglAvailable,
    detected: s.detected,
    preference: s.preference,
    setPreference: s.setPreference,
    runDetection: s.runDetection,
  };
}
