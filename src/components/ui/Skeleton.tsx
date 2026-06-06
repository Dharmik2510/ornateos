/** Loading placeholders with a shimmer sweep. See `.skeleton` in index.css. */

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} aria-hidden />
}

/** A stat-tile-shaped placeholder that matches StatCard's footprint. */
export function SkeletonStatCard() {
  return (
    <div className="glass-card p-5 space-y-3" aria-hidden>
      <Skeleton className="size-9 rounded-lg" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}

/** A list-row-shaped placeholder for order/memo/maker lists. */
export function SkeletonRow() {
  return (
    <div
      className="flex items-center justify-between rounded-xl bg-ink-800 border border-ink-600 px-4 py-3"
      aria-hidden
    >
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-4 w-12" />
    </div>
  )
}

/** Render `count` copies of a skeleton element. */
export function SkeletonList({
  count = 3,
  children,
}: {
  count?: number
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>{children}</div>
      ))}
    </div>
  )
}
