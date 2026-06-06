import { useEffect, useState } from 'react'
import { useScrollReveal } from '../../hooks/useScrollReveal'

export function AnimatedCounter({
  end,
  suffix = '',
  duration = 1400,
}: {
  end: number
  suffix?: string
  duration?: number
}) {
  const { ref, visible } = useScrollReveal<HTMLSpanElement>(0.5)
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // With reduced motion the final value is shown immediately, no tween.
  const [value, setValue] = useState(() => (prefersReduced ? end : 0))

  useEffect(() => {
    if (!visible || prefersReduced) return
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - t) ** 3
      setValue(Math.round(end * eased))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [visible, end, duration, prefersReduced])

  return (
    <span ref={ref} className="tabular-nums">
      {value}
      {suffix}
    </span>
  )
}
