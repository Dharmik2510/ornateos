import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Package,
  TrendingUp,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { computeMakerStats, type MakerDashboardStats } from '../lib/makerStats'
import { fetchMakerOrders, fetchMakers } from '../lib/orders'
import type { MakerOrder } from '../types/orders'

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function StatBox({
  label,
  value,
  sub,
  warn,
}: {
  label: string
  value: string
  sub?: string
  warn?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        warn ? 'border-amber-500/30 bg-amber-950/20' : 'border-ink-600 bg-ink-800'
      }`}
    >
      <p className="text-xs text-stone-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-stone-50 mt-1">{value}</p>
      {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
    </div>
  )
}

function OrderRow({ order, today }: { order: MakerOrder; today: string }) {
  const overdue =
    order.status === 'pending' && order.promised_at && order.promised_at < today
  return (
    <li
      className={`rounded-xl border px-4 py-3 ${
        overdue ? 'border-amber-500/40 bg-amber-950/15' : 'border-ink-600 bg-ink-800'
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="font-medium text-stone-100 capitalize">
            {order.weight_ordered} {order.unit} {order.item_category}
          </p>
          <p className="text-xs text-stone-500 mt-1 flex flex-wrap gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="size-3" /> Ordered {formatDate(order.ordered_at)}
            </span>
            {order.promised_at && (
              <span
                className={`flex items-center gap-1 ${overdue ? 'text-amber-400' : ''}`}
              >
                <Clock className="size-3" /> Due {formatDate(order.promised_at)}
              </span>
            )}
          </p>
          {order.status === 'received' && order.received_at && (
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <Check className="size-3" />
              Received {formatDate(order.received_at.slice(0, 10))} —{' '}
              {order.weight_received} {order.unit}
            </p>
          )}
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full shrink-0 ${
            order.status === 'pending'
              ? 'bg-violet-950 text-violet-300'
              : 'bg-emerald-950 text-emerald-300'
          }`}
        >
          {order.status}
        </span>
      </div>
    </li>
  )
}

export function MakerDetailPage() {
  const { makerId } = useParams<{ makerId: string }>()
  const [data, setData] = useState<MakerDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'received' | 'all'>('pending')

  const load = useCallback(async () => {
    if (!makerId) return
    setLoading(true)
    try {
      const [makers, orders] = await Promise.all([
        fetchMakers(),
        fetchMakerOrders(),
      ])
      const maker = makers.find((m) => m.id === makerId)
      if (!maker) {
        setData(null)
        return
      }
      setData(computeMakerStats(maker, orders))
    } finally {
      setLoading(false)
    }
  }, [makerId])

  useEffect(() => {
    void load()
  }, [load])

  const today = new Date().toISOString().slice(0, 10)

  if (loading) {
    return <p className="text-center text-stone-500 py-16">Loading…</p>
  }

  if (!data) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-stone-400">Maker not found.</p>
        <Link to="/makers" className="text-gold-400 hover:underline text-sm">
          ← All makers
        </Link>
      </div>
    )
  }

  const { maker } = data
  const filtered =
    tab === 'all'
      ? data.orders
      : data.orders.filter((o) => o.status === (tab === 'pending' ? 'pending' : 'received'))

  const categories = Object.entries(data.byCategory).sort(
    (a, b) => b[1].pending + b[1].received - (a[1].pending + a[1].received),
  )

  return (
    <div className="space-y-8">
      <Link
        to="/makers"
        className="inline-flex items-center gap-1 text-sm text-stone-400 hover:text-gold-300"
      >
        <ArrowLeft className="size-4" /> All makers
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gold-100">{maker.name}</h2>
          {maker.phone && (
            <p className="text-sm text-stone-400 mt-1">{maker.phone}</p>
          )}
          {maker.notes && (
            <p className="text-sm text-stone-500 mt-1">{maker.notes}</p>
          )}
        </div>
        <Link
          to="/orders"
          className="text-sm px-4 py-2 rounded-lg bg-gold-500/20 text-gold-200 hover:bg-gold-500/30"
        >
          + Place order with {maker.name.split(' ')[0]}
        </Link>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox
          label="Pending orders"
          value={String(data.pendingCount)}
          sub={`${data.pendingGrams} g with ${maker.name}`}
        />
        <StatBox
          label="Overdue"
          value={String(data.overdueCount)}
          sub="Past promised date"
          warn={data.overdueCount > 0}
        />
        <StatBox
          label="Received"
          value={String(data.receivedCount)}
          sub={`${data.receivedGrams} g total received`}
        />
        <StatBox
          label="Avg turnaround"
          value={data.avgDeliveryDays != null ? `${data.avgDeliveryDays}d` : '—'}
          sub={data.totalOrders > 0 ? `${data.totalOrders} orders all time` : 'No history'}
          warn={false}
        />
      </div>

      {categories.length > 0 && (
        <section className="rounded-2xl border border-ink-600 bg-ink-800 p-5">
          <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wide flex items-center gap-2 mb-4">
            <Package className="size-4" /> By item type
          </h3>
          <div className="flex flex-wrap gap-3">
            {categories.map(([cat, counts]) => (
              <div
                key={cat}
                className="rounded-xl bg-ink-900 px-4 py-3 min-w-[120px]"
              >
                <p className="capitalize font-medium text-stone-200">{cat}</p>
                <p className="text-xs text-stone-500 mt-1">
                  {counts.pending} pending · {counts.received} done
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wide flex items-center gap-2">
            <TrendingUp className="size-4" /> Order history
          </h3>
          <div className="flex gap-2">
            {(['pending', 'received', 'all'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-lg text-xs capitalize ${
                  tab === t
                    ? 'bg-gold-500/20 text-gold-100'
                    : 'text-stone-400 hover:bg-ink-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {data.overdueCount > 0 && tab !== 'received' && (
          <p className="text-xs text-amber-400 flex items-center gap-1 px-1">
            <AlertTriangle className="size-3" />
            {data.overdueCount} order(s) past the committed delivery date
          </p>
        )}

        <ul className="space-y-2">
          {filtered.length === 0 ? (
            <li className="text-center text-stone-500 py-8 rounded-xl border border-dashed border-ink-600">
              No {tab} orders for this maker.
            </li>
          ) : (
            filtered.map((o) => <OrderRow key={o.id} order={o} today={today} />)
          )}
        </ul>
      </section>

      <p className="text-center">
        <Link to="/orders" className="text-sm text-gold-400 hover:underline">
          Receive or place orders →
        </Link>
      </p>
    </div>
  )
}
