import { AlertTriangle, ClipboardList, Package, RefreshCw, Scale } from 'lucide-react'
import { fetchMakerOrders } from '../lib/orders'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { PageHeader } from '../components/ui/PageHeader'
import { ScrollReveal } from '../components/motion/ScrollReveal'
import { Link } from 'react-router-dom'
import { computeDashboard } from '../lib/api'
import { fetchTransactions } from '../lib/supabase'
import type { DashboardStats, TransactionRow } from '../types/ledger'

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  sub?: string
  icon: typeof Package
  accent: string
}) {
  return (
    <div className="glass-card glass-card-hover p-5 space-y-2 group">
      <div className={`inline-flex p-2 rounded-lg ${accent} group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="size-5" />
      </div>
      <p className="text-xs text-stone-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-stone-50">{value}</p>
      {sub && <p className="text-xs text-stone-400">{sub}</p>}
    </div>
  )
}

export function DashboardPage() {
  const { business } = useAuth()
  const [rows, setRows] = useState<TransactionRow[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchTransactions()
      setRows(data)
      setStats(await computeDashboard(data))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const [pendingOrders, setPendingOrders] = useState<
    Awaited<ReturnType<typeof fetchMakerOrders>>
  >([])

  useEffect(() => {
    void fetchMakerOrders('pending').then(setPendingOrders)
  }, [rows])

  const memos = rows.filter(
    (r) =>
      r.status === 'confirmed' &&
      (r.record.type === 'memo_out' || r.record.type === 'memo_return'),
  )

  return (
    <div className="space-y-8">
      <PageHeader
        title={business?.name ?? 'Dashboard'}
        description="Live inventory, memos, and maker orders for your business."
        action={
        <button
          type="button"
          onClick={() => void load()}
          className="p-2 rounded-lg text-stone-400 hover:bg-ink-700 hover:text-gold-300"
          aria-label="Refresh"
        >
          <RefreshCw className={`size-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        }
      />

      <ScrollReveal variant="up">
        <Link
          to="/record"
          className="block mb-6 rounded-2xl border border-gold-500/25 bg-gradient-to-r from-gold-500/10 to-transparent p-5 hover:border-gold-500/40 transition-all duration-300 hover:-translate-y-0.5 group"
        >
          <p className="text-sm text-gold-400 font-medium">Quick action</p>
          <p className="text-lg font-semibold text-stone-100 mt-1 group-hover:text-gold-100 transition-colors">
            Record a memo, sale, or maker order →
          </p>
        </Link>
      </ScrollReveal>

      {stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ScrollReveal variant="up" delay={0}>
          <StatCard
            label="Inventory (gold)"
            value={`${stats.inventoryGrams} g`}
            sub="Net grams in stock"
            icon={Package}
            accent="bg-gold-500/20 text-gold-300"
          />
          </ScrollReveal>
          <ScrollReveal variant="up" delay={80}>
          <StatCard
            label="Orders with makers"
            value={String(stats.pendingMakerOrders)}
            sub={`${stats.gramsWithMakers} g pending · ${stats.overdueMakerOrders} overdue`}
            icon={ClipboardList}
            accent="bg-violet-500/20 text-violet-300"
          />
          </ScrollReveal>
          <ScrollReveal variant="up" delay={160}>
          <StatCard
            label="Pending memos"
            value={String(stats.pendingMemos)}
            sub={`${stats.memoExposureGrams} g exposure`}
            icon={Scale}
            accent="bg-blue-500/20 text-blue-300"
          />
          </ScrollReveal>
          <ScrollReveal variant="up" delay={240}>
          <StatCard
            label="Memo exposure"
            value={`${stats.memoExposureGrams} g`}
            sub="Gold out on memo"
            icon={AlertTriangle}
            accent="bg-amber-500/20 text-amber-300"
          />
          </ScrollReveal>
          <ScrollReveal variant="up" delay={320}>
          <StatCard
            label="Transactions"
            value={String(stats.recentCount)}
            sub="All time in system"
            icon={RefreshCw}
            accent="bg-emerald-500/20 text-emerald-300"
          />
          </ScrollReveal>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wide">
            Pending maker orders
          </h3>
          <Link to="/orders" className="text-xs text-gold-400 hover:underline">
            Manage orders →
          </Link>
        </div>
        {pendingOrders.length === 0 ? (
          <p className="text-stone-500 text-sm py-4 text-center rounded-xl border border-dashed border-ink-600">
            No orders with makers.{' '}
            <Link to="/orders" className="text-gold-400 hover:underline">
              Place an order
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {pendingOrders.slice(0, 5).map((o) => (
              <li
                key={o.id}
                className="rounded-xl bg-ink-800 border border-ink-600 px-4 py-3 flex justify-between"
              >
                <div>
                  <p className="font-medium text-stone-100">
                    <Link
                      to={`/makers/${o.maker_id}`}
                      className="hover:text-gold-300 hover:underline"
                    >
                      {o.maker_name}
                    </Link>
                    {' '}
                    — {o.item_category}
                  </p>
                  <p className="text-xs text-stone-500">
                    Ordered {o.ordered_at}
                    {o.promised_at ? ` · due ${o.promised_at}` : ''}
                  </p>
                </div>
                <span className="text-sm text-gold-300">
                  {o.weight_ordered} {o.unit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wide">
          Pending & recent memos
        </h3>
        {memos.length === 0 ? (
          <p className="text-stone-500 text-sm py-6 text-center rounded-xl border border-dashed border-ink-600">
            No memos yet.{' '}
            <Link to="/record" className="text-gold-400 hover:underline">
              Record your first memo
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {memos.slice(0, 8).map((r) => (
              <li
                key={r.id}
                className="flex justify-between items-center rounded-xl bg-ink-800 border border-ink-600 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-stone-100">{r.summary}</p>
                  <p className="text-xs text-stone-500">
                    {r.record.party} · {r.record.date}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    r.record.type === 'memo_out'
                      ? 'bg-amber-950 text-amber-300'
                      : 'bg-emerald-950 text-emerald-300'
                  }`}
                >
                  {r.record.type === 'memo_out' ? 'issued' : 'returned'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wide">
          Recent transactions
        </h3>
        <div className="overflow-x-auto rounded-xl border border-ink-600">
          <table className="w-full text-sm">
            <thead className="bg-ink-700 text-stone-400 text-left">
              <tr>
                <th className="px-4 py-2">Summary</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Weight</th>
                <th className="px-4 py-2">Party</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-stone-500">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                rows.slice(0, 12).map((r) => (
                  <tr key={r.id} className="border-t border-ink-600">
                    <td className="px-4 py-2 text-stone-200">{r.summary}</td>
                    <td className="px-4 py-2 text-stone-400">{r.record.type}</td>
                    <td className="px-4 py-2">
                      {r.record.weight != null
                        ? `${r.record.weight} ${r.record.unit}`
                        : '—'}
                    </td>
                    <td className="px-4 py-2">{r.record.party}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
