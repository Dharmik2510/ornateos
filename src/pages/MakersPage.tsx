import { AlertTriangle, ChevronRight, User } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { computeAllMakerStats, type MakerDashboardStats } from '../lib/makerStats'
import { fetchMakerOrders, fetchMakers } from '../lib/orders'

export function MakersPage() {
  const [stats, setStats] = useState<MakerDashboardStats[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [makers, orders] = await Promise.all([
        fetchMakers(),
        fetchMakerOrders(),
      ])
      setStats(computeAllMakerStats(makers, orders))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Makers"
        description="Per-maker dashboard — pending work, overdue commitments, and history."
      />

      {loading && (
        <p className="text-center text-stone-500 py-12">Loading makers…</p>
      )}

      {!loading && stats.length === 0 && (
        <div className="text-center py-12 rounded-2xl border border-dashed border-ink-600 space-y-3">
          <User className="size-10 mx-auto text-stone-600" />
          <p className="text-stone-400">No makers yet.</p>
          <Link to="/orders" className="text-gold-400 hover:underline text-sm">
            Place your first order →
          </Link>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {stats.map((s) => (
          <Link
            key={s.maker.id}
            to={`/makers/${s.maker.id}`}
            className="group rounded-2xl border border-ink-600 bg-ink-800 p-5 hover:border-gold-500/40 hover:bg-ink-700/80 transition"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-gold-500/15 flex items-center justify-center">
                  <User className="size-5 text-gold-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-100 group-hover:text-gold-100">
                    {s.maker.name}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {s.totalOrders} orders · {s.receivedCount} received
                  </p>
                </div>
              </div>
              <ChevronRight className="size-5 text-stone-600 group-hover:text-gold-400 shrink-0" />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-ink-900/60 py-2">
                <p className="text-lg font-bold text-violet-300">{s.pendingCount}</p>
                <p className="text-[10px] text-stone-500 uppercase">Pending</p>
              </div>
              <div className="rounded-lg bg-ink-900/60 py-2">
                <p className="text-lg font-bold text-gold-300">{s.pendingGrams}g</p>
                <p className="text-[10px] text-stone-500 uppercase">With them</p>
              </div>
              <div
                className={`rounded-lg py-2 ${
                  s.overdueCount > 0 ? 'bg-amber-950/50' : 'bg-ink-900/60'
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
        ))}
      </div>
    </div>
  )
}
