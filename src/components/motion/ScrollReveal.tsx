import type { ReactNode } from 'react'
import { useScrollReveal } from '../../hooks/useScrollReveal'

type Variant = 'up' | 'left' | 'right' | 'scale' | 'fade'

const variantClass: Record<Variant, string> = {
  up: 'reveal-up',
  left: 'reveal-left',
  right: 'reveal-right',
  scale: 'reveal-scale',
  fade: 'reveal-fade',
}

export function ScrollReveal({
  children,
  className = '',
  variant = 'up',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  variant?: Variant
  delay?: number
}) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${variantClass[variant]} ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
