import { AlertTriangle, ChevronRight, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { ScrollReveal } from '../components/motion/ScrollReveal'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { useAsyncData } from '../hooks/useAsyncData'
import { computeAllMakerStats } from '../lib/makerStats'
import { fetchMakerOrders, fetchMakers } from '../lib/orders'

async function loadMakerStats() {
  const [makers, orders] = await Promise.all([fetchMakers(), fetchMakerOrders()])
  return computeAllMakerStats(makers, orders)
}

function MakerCardSkeleton() {
  return (
    <div className="rounded-2xl border border-ink-600 bg-ink-800 p-5 space-y-4" aria-hidden>
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
      </div>
    </div>
  )
}

export function MakersPage() {
  const { data, loading } = useAsyncData(loadMakerStats)
  const stats = data ?? []

  return (
    <div className="space-y-8">
      <PageHeader
        title="Makers"
        description="Per-maker dashboard — pending work, overdue commitments, and history."
      />

      {loading && !data ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <MakerCardSkeleton key={i} />
          ))}
        </div>
      ) : stats.length === 0 ? (
        <EmptyState
          icon={User}
          title="No makers yet"
          description="Once you place an order with a karigar, they will appear here with their pending work and history."
          action={
            <Link
              to="/orders"
              className="inline-flex items-center min-h-[44px] px-4 rounded-xl bg-gold-500/20 text-gold-200 hover:bg-gold-500/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 text-sm font-semibold"
            >
              Place your first order →
            </Link>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {stats.map((s, i) => (
            <ScrollReveal key={s.maker.id} variant="up" delay={i * 60}>
              <Link
                to={`/makers/${s.maker.id}`}
                className="group block h-full rounded-2xl border border-ink-600 bg-ink-800 p-5 transition-all duration-300 hover:border-gold-500/40 hover:bg-ink-700/80 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                aria-label={`Open ${s.maker.name}'s dashboard`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-xl bg-gold-500/15 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <User className="size-5 text-gold-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-100 group-hover:text-gold-100 transition-colors">
                        {s.maker.name}
                      </h3>
                      <p className="text-xs text-stone-500">
                        {s.totalOrders} orders · {s.receivedCount} received
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="size-5 text-stone-600 group-hover:text-gold-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-ink-900/60 py-2 transition-colors group-hover:bg-ink-900">
                    <p className="text-lg font-bold text-violet-300">{s.pendingCount}</p>
                    <p className="text-[10px] text-stone-500 uppercase">Pending</p>
                  </div>
                  <div className="rounded-lg bg-ink-900/60 py-2 transition-colors group-hover:bg-ink-900">
                    <p className="text-lg font-bold text-gold-300">{s.pendingGrams}g</p>
                    <p className="text-[10px] text-stone-500 uppercase">With them</p>
                  </div>
                  <div
                    className={`rounded-lg py-2 transition-colors ${
                      s.overdueCount > 0
                        ? 'bg-amber-950/50 animate-glow-amber'
                        : 'bg-ink-900/60 group-hover:bg-ink-900'
                    }`}
                  >
                    <p
                      className={`text-lg font-bold ${
                        s.overdueCount > 0 ? 'text-amber-300' : 'text-stone-400'
                      }`}
                    >
                      {s.overdueCount}
                    </p>
                    <p className="text-[10px] text-stone-500 uppercase">Overdue</p>
                  </div>
                </div>

                {s.overdueCount > 0 && (
                  <p className="mt-3 text-xs text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="size-3" />
                    {s.overdueCount} past promised date
                  </p>
                )}
              </Link>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  )
}
