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
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!visible) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setValue(end)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - t) ** 3
      setValue(Math.round(end * eased))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [visible, end, duration])

  return (
    <span ref={ref} className="tabular-nums">
      {value}
      {suffix}
    </span>
  )
}
