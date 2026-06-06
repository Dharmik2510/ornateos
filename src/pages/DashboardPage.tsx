import {
  AlertTriangle,
  ClipboardList,
  Inbox,
  Package,
  RefreshCw,
  Scale,
} from 'lucide-react'
import { fetchMakerOrders } from '../lib/orders'
import { useAuth } from '../contexts/AuthContext'
import { PageHeader } from '../components/ui/PageHeader'
import { ScrollReveal } from '../components/motion/ScrollReveal'
import { StatCard } from '../components/ui/StatCard'
import { EmptyState } from '../components/ui/EmptyState'
import { SkeletonStatCard, SkeletonList, SkeletonRow } from '../components/ui/Skeleton'
import { useAsyncData } from '../hooks/useAsyncData'
import { Link } from 'react-router-dom'
import { computeDashboard } from '../lib/api'
import { fetchTransactions } from '../lib/supabase'

async function loadDashboard() {
  const rows = await fetchTransactions()
  const [stats, pendingOrders] = await Promise.all([
    computeDashboard(rows),
    fetchMakerOrders('pending'),
  ])
  return { rows, stats, pendingOrders }
}

export function DashboardPage() {
  const { business } = useAuth()
  const { data, loading, reload } = useAsyncData(loadDashboard)

  const rows = data?.rows ?? []
  const stats = data?.stats
  const pendingOrders = data?.pendingOrders ?? []

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
            onClick={reload}
            className="p-2 rounded-lg text-stone-400 hover:bg-ink-700 hover:text-gold-300 transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className={`size-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <ScrollReveal variant="up">
        <Link
          to="/record"
          className="block rounded-2xl border border-gold-500/25 bg-gradient-to-r from-gold-500/10 to-transparent p-5 hover:border-gold-500/40 transition-all duration-300 hover:-translate-y-0.5 group"
        >
          <p className="text-sm text-gold-400 font-medium">Quick action</p>
          <p className="text-lg font-semibold text-stone-100 mt-1 group-hover:text-gold-100 transition-colors">
            Record a memo, sale, or maker order →
          </p>
        </Link>
      </ScrollReveal>

      {loading && !stats ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }, (_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
      ) : stats ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Inventory (gold)"
            count={stats.inventoryGrams}
            unit="g"
            sub="Net grams in stock"
            icon={Package}
            accent="gold"
            delay={0}
          />
          <StatCard
            label="Orders with makers"
            count={stats.pendingMakerOrders}
            sub={`${stats.gramsWithMakers} g pending · ${stats.overdueMakerOrders} overdue`}
            icon={ClipboardList}
            accent="violet"
            delay={80}
          />
          <StatCard
            label="Pending memos"
            count={stats.pendingMemos}
            sub={`${stats.memoExposureGrams} g exposure`}
            icon={Scale}
            accent="blue"
            delay={160}
          />
          <StatCard
            label="Memo exposure"
            count={stats.memoExposureGrams}
            unit="g"
            sub="Gold out on memo"
            icon={AlertTriangle}
            accent="amber"
            delay={240}
          />
          <StatCard
            label="Transactions"
            count={stats.recentCount}
            sub="All time in system"
            icon={RefreshCw}
            accent="emerald"
            delay={320}
          />
        </div>
      ) : null}

      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wide">
            Pending maker orders
          </h3>
          <Link to="/orders" className="text-xs text-gold-400 hover:underline">
            Manage orders →
          </Link>
        </div>
        {loading ? (
          <SkeletonList count={3}>
            <SkeletonRow />
          </SkeletonList>
        ) : pendingOrders.length === 0 ? (
          <p className="text-stone-500 text-sm py-4 text-center rounded-xl border border-dashed border-ink-600">
            No orders with makers.{' '}
            <Link to="/orders" className="text-gold-400 hover:underline">
              Place an order
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {pendingOrders.slice(0, 5).map((o, i) => (
              <ScrollReveal key={o.id} variant="up" delay={i * 60}>
                <li className="rounded-xl bg-ink-800 border border-ink-600 px-4 py-3 flex justify-between hover:border-ink-500 transition-colors">
                  <div>
                    <p className="font-medium text-stone-100">
                      <Link
                        to={`/makers/${o.maker_id}`}
                        className="hover:text-gold-300 hover:underline"
                      >
                        {o.maker_name}
                      </Link>{' '}
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
              </ScrollReveal>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wide">
          Pending & recent memos
        </h3>
        {loading ? (
          <SkeletonList count={3}>
            <SkeletonRow />
          </SkeletonList>
        ) : memos.length === 0 ? (
          <p className="text-stone-500 text-sm py-6 text-center rounded-xl border border-dashed border-ink-600">
            No memos yet.{' '}
            <Link to="/record" className="text-gold-400 hover:underline">
              Record your first memo
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {memos.slice(0, 8).map((r, i) => (
              <ScrollReveal key={r.id} variant="up" delay={i * 50}>
                <li className="flex justify-between items-center rounded-xl bg-ink-800 border border-ink-600 px-4 py-3 hover:border-ink-500 transition-colors">
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
              </ScrollReveal>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wide">
          Recent transactions
        </h3>
        {loading ? (
          <SkeletonList count={4}>
            <SkeletonRow />
          </SkeletonList>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No transactions yet"
            description="Record your first memo, sale, or maker order and it will appear here."
          />
        ) : (
          <ScrollReveal variant="fade">
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
                  {rows.slice(0, 12).map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-ink-600 hover:bg-ink-800/60 transition-colors"
                    >
                      <td className="px-4 py-2 text-stone-200">{r.summary}</td>
                      <td className="px-4 py-2 text-stone-400">{r.record.type}</td>
                      <td className="px-4 py-2">
                        {r.record.weight != null
                          ? `${r.record.weight} ${r.record.unit}`
                          : '—'}
                      </td>
                      <td className="px-4 py-2">{r.record.party}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        )}
      </section>
    </div>
  )
}
