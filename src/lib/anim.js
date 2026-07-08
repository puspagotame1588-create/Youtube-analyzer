// Shared Framer Motion variants + hooks

import { useEffect, useRef, useState } from 'react'
import { useInView, animate } from 'framer-motion'

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] },
  }),
}

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.8, ease: 'easeOut' } },
}

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

export const viewportOnce = { once: true, margin: '-80px' }

/**
 * Animated count-up that starts when the element scrolls into view.
 * Usage: const { ref, value } = useCountUp(94, { decimals: 0 })
 */
export function useCountUp(target, { duration = 1.6, decimals = 0 } = {}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(Number(v.toFixed(decimals))),
    })
    return () => controls.stop()
  }, [inView, target, duration, decimals])

  return { ref, value }
}
