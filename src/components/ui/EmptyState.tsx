import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { ScrollReveal } from '../motion/ScrollReveal'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <ScrollReveal variant="scale">
      <div className="text-center py-16 px-6 rounded-2xl border border-dashed border-ink-600 bg-ink-800/40">
        <span className="inline-flex p-4 rounded-2xl bg-ink-800 mb-4 animate-float-slow">
          <Icon className="size-10 text-stone-600" strokeWidth={1.5} />
        </span>
        <h3 className="text-lg font-medium text-stone-200">{title}</h3>
        <p className="text-sm text-stone-500 mt-2 max-w-sm mx-auto">{description}</p>
        {action && <div className="mt-6">{action}</div>}
      </div>
    </ScrollReveal>
  )
}
