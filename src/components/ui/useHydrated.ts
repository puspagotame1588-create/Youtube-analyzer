'use client';

import { useEffect, useState } from 'react';

/**
 * True after client hydration. Persisted-store values are only rendered after
 * this flips, preventing SSR/client markup mismatches.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
