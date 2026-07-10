'use client';

import { useEffect } from 'react';
import { useQualityStore } from '@/lib/store/quality';

/** Runs device-tier + reduced-motion detection once on mount. */
export function QualityBoot(): null {
  const runDetection = useQualityStore((s) => s.runDetection);
  useEffect(() => {
    runDetection();
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (): void => runDetection();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [runDetection]);
  return null;
}
