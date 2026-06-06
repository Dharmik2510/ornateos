import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  ClipboardList,
  Clock,
  Inbox,
  Package,
  Phone,
  TrendingUp,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { ScrollReveal } from '../components/motion/ScrollReveal'
import { StatCard } from '../components/ui/StatCard'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton, SkeletonStatCard } from '../components/ui/Skeleton'
import { useAsyncData } from '../hooks/useAsyncData'
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

function OrderRow({ order, today }: { order: MakerOrder; today: string }) {
  const overdue =
    order.status === 'pending' && order.promised_at && order.promised_at < today
  return (
    <li
      className={`rounded-xl border px-4 py-3 transition-colors ${
        overdue
          ? 'border-amber-500/40 bg-amber-950/15 animate-glow-amber'
          : 'border-ink-600 bg-ink-800 hover:border-ink-500'
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

function DetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export function MakerDetailPage() {
  const { makerId } = useParams<{ makerId: string }>()
  const [tab, setTab] = useState<'pending' | 'received' | 'all'>('pending')

  const { data, loading } = useAsyncData<MakerDashboardStats | null>(async () => {
    if (!makerId) return null
    const [makers, orders] = await Promise.all([fetchMakers(), fetchMakerOrders()])
    const maker = makers.find((m) => m.id === makerId)
    if (!maker) return null
    return computeMakerStats(maker, orders)
  }, [makerId])

  const today = new Date().toISOString().slice(0, 10)

  const backLink = (
    <Link
      to="/makers"
      className="inline-flex items-center gap-1 min-h-[44px] text-sm text-stone-400 hover:text-gold-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 rounded-lg"
    >
      <ArrowLeft className="size-4" /> All makers
    </Link>
  )

  if (loading && !data) {
    return (
      <div className="space-y-8">
        {backLink}
        <DetailSkeleton />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-8">
        {backLink}
        <EmptyState
          icon={Inbox}
          title="Maker not found"
          description="This maker no longer exists or could not be loaded."
          action={
            <Link
              to="/makers"
              className="inline-flex items-center min-h-[44px] px-4 rounded-xl bg-gold-500/20 text-gold-200 hover:bg-gold-500/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 text-sm font-semibold"
            >
              ← All makers
            </Link>
          }
        />
      </div>
    )
  }

  const { maker } = data
  const filtered =
    tab === 'all'
      ? data.orders
      : data.orders.filter(
          (o) => o.status === (tab === 'pending' ? 'pending' : 'received'),
        )

  const categories = Object.entries(data.byCategory).sort(
    (a, b) => b[1].pending + b[1].received - (a[1].pending + a[1].received),
  )

  return (
    <div className="space-y-8">
      {backLink}

      <PageHeader
        title={maker.name}
        description={maker.notes ?? undefined}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {maker.phone && (
              <a
                href={`tel:${maker.phone}`}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-ink-700/80 border border-ink-600 text-stone-100 hover:bg-ink-600 hover:border-stone-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 text-sm font-medium"
                aria-label={`Call ${maker.name} at ${maker.phone}`}
              >
                <Phone className="size-4" /> {maker.phone}
              </a>
            )}
            <Link
              to="/orders"
              className="inline-flex items-center min-h-[44px] px-4 rounded-xl bg-gold-500/20 text-gold-200 hover:bg-gold-500/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 text-sm font-semibold"
            >
              + Place order with {maker.name.split(' ')[0]}
            </Link>
          </div>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pending orders"
          count={data.pendingCount}
          sub={`${data.pendingGrams} g with ${maker.name}`}
          icon={ClipboardList}
          accent="violet"
          delay={0}
        />
        <StatCard
          label="Overdue"
          count={data.overdueCount}
          sub="Past promised date"
          icon={AlertTriangle}
          accent={data.overdueCount > 0 ? 'amber' : 'emerald'}
          delay={80}
        />
        <StatCard
          label="Received"
          count={data.receivedCount}
          sub={`${data.receivedGrams} g total received`}
          icon={Check}
          accent="emerald"
          delay={160}
        />
        <StatCard
          label="Avg turnaround"
          value={data.avgDeliveryDays != null ? `${data.avgDeliveryDays}d` : '—'}
          sub={
            data.totalOrders > 0
              ? `${data.totalOrders} orders all time`
              : 'No history'
          }
          icon={TrendingUp}
          accent="blue"
          delay={240}
        />
      </div>

      {categories.length > 0 && (
        <ScrollReveal variant="up">
          <section className="rounded-2xl border border-ink-600 bg-ink-800 p-5">
            <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wide flex items-center gap-2 mb-4">
              <Package className="size-4" /> By item type
            </h3>
            <div className="flex flex-wrap gap-3">
              {categories.map(([cat, counts], i) => (
                <ScrollReveal key={cat} variant="scale" delay={i * 50}>
                  <div className="rounded-xl bg-ink-900 px-4 py-3 min-w-[120px] hover:bg-ink-900/70 transition-colors">
                    <p className="capitalize font-medium text-stone-200">{cat}</p>
                    <p className="text-xs text-stone-500 mt-1">
                      {counts.pending} pending · {counts.received} done
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>
        </ScrollReveal>
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
                aria-pressed={tab === t}
                className={`px-3 min-h-[44px] rounded-lg text-xs capitalize transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
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

        {filtered.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={`No ${tab} orders`}
            description={`This maker has no ${tab} orders to show right now.`}
          />
        ) : (
          <ul className="space-y-2">
            {filtered.map((o, i) => (
              <ScrollReveal key={o.id} variant="up" delay={i * 50}>
                <OrderRow order={o} today={today} />
              </ScrollReveal>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center">
        <Link to="/orders" className="text-sm text-gold-400 hover:underline">
          Receive or place orders →
        </Link>
      </p>
    </div>
  )
}
