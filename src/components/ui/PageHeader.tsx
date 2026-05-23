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
    <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-semibold text-gold-50 tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-stone-400 mt-1 max-w-xl">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
