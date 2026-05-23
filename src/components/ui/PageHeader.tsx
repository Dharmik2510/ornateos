import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-8 animate-[slide-up_0.5s_ease-out_both]">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-gold-50 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-stone-400 mt-2 max-w-xl leading-relaxed">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
