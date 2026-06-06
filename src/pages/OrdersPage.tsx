import {
  Calendar,
  Check,
  Clock,
  ClipboardList,
  AlertTriangle,
  Scale,
  Inbox,
  Plus,
  User,
  Package,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { ScrollReveal } from '../components/motion/ScrollReveal'
import { StatCard } from '../components/ui/StatCard'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { SkeletonList, SkeletonRow } from '../components/ui/Skeleton'
import { useAsyncData } from '../hooks/useAsyncData'
import {
  ITEM_CATEGORIES,
  type ItemCategory,
  type Maker,
  type MakerOrder,
  type WeightUnit,
} from '../types/orders'
import { receiveOrderWithLedger } from '../lib/orderActions'
import {
  fetchMakerOrders,
  fetchMakers,
  orderStats,
  placeMakerOrder,
  upsertMakerByName,
} from '../lib/orders'

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

async function loadOrders(): Promise<{ orders: MakerOrder[]; makers: Maker[] }> {
  const [orders, makers] = await Promise.all([fetchMakerOrders(), fetchMakers()])
  return { orders, makers }
}

export function OrdersPage() {
  const { data, loading, reload } = useAsyncData(loadOrders)
  const orders = data?.orders ?? []
  const makers = data?.makers ?? []

  const [tab, setTab] = useState<'pending' | 'received' | 'all'>('pending')

  const [makerName, setMakerName] = useState('')
  const [itemCategory, setItemCategory] = useState<ItemCategory>('ring')
  const [weight, setWeight] = useState('')
  const [unit, setUnit] = useState<WeightUnit>('gram')
  const [promisedAt, setPromisedAt] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const [receiveId, setReceiveId] = useState('')
  const [receiveWeight, setReceiveWeight] = useState('')
  const [receiveUnit, setReceiveUnit] = useState<WeightUnit>('gram')

  const stats = orderStats(orders)
  const filtered =
    tab === 'all'
      ? orders
      : orders.filter((o) => o.status === (tab === 'pending' ? 'pending' : 'received'))

  const today = new Date().toISOString().slice(0, 10)

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault()
    if (!makerName.trim() || !weight) return
    setSaving(true)
    try {
      await placeMakerOrder({
        maker_name: makerName.trim(),
        item_category: itemCategory,
        weight_ordered: parseFloat(weight),
        unit,
        promised_at: promisedAt || null,
        notes: notes || null,
      })
      setMakerName('')
      setWeight('')
      setPromisedAt('')
      setNotes('')
      reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to place order')
    } finally {
      setSaving(false)
    }
  }

  async function handleReceive(e: React.FormEvent) {
    e.preventDefault()
    if (!receiveId || !receiveWeight) return
    setSaving(true)
    try {
      const order = orders.find((o) => o.id === receiveId)
      if (!order) throw new Error('Order not found')
      await receiveOrderWithLedger({
        order_id: receiveId,
        weight_received: parseFloat(receiveWeight),
        unit: receiveUnit,
        maker_name: order.maker_name,
        item_category: order.item_category,
      })
      setReceiveId('')
      setReceiveWeight('')
      reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to receive')
    } finally {
      setSaving(false)
    }
  }

  async function quickReceive(order: MakerOrder) {
    setReceiveId(order.id)
    setReceiveWeight(String(order.weight_ordered))
    setReceiveUnit(order.unit)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Maker orders"
        description="Track who is making what, when you ordered, and when they committed to deliver."
        action={
          <Link to="/record" className="text-sm text-gold-400 hover:underline min-h-[44px] flex items-center">
            Voice / text input →
          </Link>
        }
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard
          label="Pending with makers"
          count={stats.pendingCount}
          sub="Orders out being made"
          icon={ClipboardList}
          accent="violet"
          delay={0}
        />
        <StatCard
          label="Overdue (past promise)"
          count={stats.overdueCount}
          sub="Past committed delivery"
          icon={AlertTriangle}
          accent="amber"
          delay={80}
        />
        <StatCard
          label="Gold with makers"
          count={stats.gramsWithMakers}
          unit="g"
          sub="Total pending weight"
          icon={Scale}
          accent="gold"
          delay={160}
        />
      </div>

      <ScrollReveal variant="up" delay={0}>
        <form
          onSubmit={(e) => void handlePlaceOrder(e)}
          className="rounded-2xl border border-gold-500/20 bg-ink-800 p-6 space-y-4 transition-colors hover:border-gold-500/30"
        >
          <h3 className="font-semibold text-gold-100 flex items-center gap-2">
            <Plus className="size-4" /> Place new order
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-stone-500">Maker name</label>
              <input
                list="makers-list"
                value={makerName}
                onChange={(e) => setMakerName(e.target.value)}
                placeholder="Ramesh, Jayesh…"
                className="mt-1 w-full rounded-lg bg-ink-700 border border-ink-600 px-3 py-2 text-sm"
                required
              />
              <datalist id="makers-list">
                {makers.map((m) => (
                  <option key={m.id} value={m.name} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="text-xs text-stone-500">Item type</label>
              <select
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value as ItemCategory)}
                className="mt-1 w-full rounded-lg bg-ink-700 border border-ink-600 px-3 py-2 text-sm"
              >
                {ITEM_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-stone-500">Weight ordered</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="flex-1 rounded-lg bg-ink-700 border border-ink-600 px-3 py-2 text-sm"
                  required
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as WeightUnit)}
                  className="rounded-lg bg-ink-700 border border-ink-600 px-2 text-sm"
                >
                  <option value="gram">gram</option>
                  <option value="kilo">kilo</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-stone-500">Committed delivery date</label>
              <input
                type="date"
                value={promisedAt}
                onChange={(e) => setPromisedAt(e.target.value)}
                className="mt-1 w-full rounded-lg bg-ink-700 border border-ink-600 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full rounded-lg bg-ink-700 border border-ink-600 px-3 py-2 text-sm"
          />
          <Button type="submit" variant="primary" loading={saving}>
            Place order
          </Button>
        </form>
      </ScrollReveal>

      <ScrollReveal variant="up" delay={80}>
        <form
          onSubmit={(e) => void handleReceive(e)}
          className="rounded-2xl border border-emerald-500/20 bg-ink-800 p-6 space-y-4 transition-colors hover:border-emerald-500/30"
        >
          <h3 className="font-semibold text-emerald-200 flex items-center gap-2">
            <Check className="size-4" /> Receive completed order
          </h3>
          <p className="text-xs text-stone-500">
            When a maker delivers, record actual weight received (gram or kilo).
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="text-xs text-stone-500">Pending order</label>
              <select
                value={receiveId}
                onChange={(e) => {
                  setReceiveId(e.target.value)
                  const o = orders.find((x) => x.id === e.target.value)
                  if (o) {
                    setReceiveWeight(String(o.weight_ordered))
                    setReceiveUnit(o.unit)
                  }
                }}
                className="mt-1 w-full rounded-lg bg-ink-700 border border-ink-600 px-3 py-2 text-sm"
                required
              >
                <option value="">Select order…</option>
                {orders
                  .filter((o) => o.status === 'pending')
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.maker_name} — {o.weight_ordered}
                      {o.unit} {o.item_category}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-stone-500">Weight received</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={receiveWeight}
                  onChange={(e) => setReceiveWeight(e.target.value)}
                  className="flex-1 rounded-lg bg-ink-700 border border-ink-600 px-3 py-2 text-sm"
                  required
                />
                <select
                  value={receiveUnit}
                  onChange={(e) => setReceiveUnit(e.target.value as WeightUnit)}
                  className="rounded-lg bg-ink-700 border border-ink-600 px-2 text-sm"
                >
                  <option value="gram">gram</option>
                  <option value="kilo">kilo</option>
                </select>
              </div>
            </div>
          </div>
          <Button type="submit" variant="success" loading={saving} disabled={!receiveId}>
            Mark received & add to inventory
          </Button>
        </form>
      </ScrollReveal>

      <div className="flex gap-2">
        {(['pending', 'received', 'all'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize min-h-[44px] transition-colors duration-200 ${
              tab === t
                ? 'bg-gold-500/20 text-gold-100'
                : 'text-stone-400 hover:bg-ink-700'
            }`}
            aria-pressed={tab === t}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonList count={4}>
          <SkeletonRow />
        </SkeletonList>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={`No ${tab} orders`}
          description={'Place one above or say: "Jayesh ne 20 gram ring order, 25 tarikh sudhi aapse"'}
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, i) => {
            const overdue =
              o.status === 'pending' && o.promised_at && o.promised_at < today
            return (
              <ScrollReveal key={o.id} variant="up" delay={i * 60}>
                <li
                  className={`rounded-xl border px-4 py-4 flex flex-wrap gap-4 justify-between items-start transition-colors ${
                    overdue
                      ? 'border-amber-500/40 bg-amber-950/20 animate-glow-amber hover:border-amber-500/60'
                      : 'border-ink-600 bg-ink-800 hover:border-ink-500'
                  }`}
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-stone-100 flex items-center gap-2">
                      <User className="size-4 text-gold-400" />
                      <Link
                        to={`/makers/${o.maker_id}`}
                        className="hover:text-gold-300 hover:underline"
                      >
                        {o.maker_name}
                      </Link>
                      <span className="text-stone-500 font-normal">·</span>
                      <Package className="size-4 inline text-stone-400" />
                      {o.weight_ordered} {o.unit} {o.item_category}
                    </p>
                    <p className="text-xs text-stone-500 flex flex-wrap gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" /> Ordered {formatDate(o.ordered_at)}
                      </span>
                      {o.promised_at && (
                        <span
                          className={`flex items-center gap-1 ${overdue ? 'text-amber-400' : ''}`}
                        >
                          <Clock className="size-3" /> Promised {formatDate(o.promised_at)}
                          {overdue && ' (overdue)'}
                        </span>
                      )}
                      {o.received_at && (
                        <span className="text-emerald-400">
                          Received {formatDate(o.received_at.slice(0, 10))} —{' '}
                          {o.weight_received} {o.unit}
                        </span>
                      )}
                    </p>
                    {o.notes && (
                      <p className="text-xs text-stone-600 truncate max-w-md">{o.notes}</p>
                    )}
                  </div>
                  {o.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => quickReceive(o)}
                      className="text-sm px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 min-h-[44px] transition-colors"
                    >
                      Receive
                    </button>
                  )}
                </li>
              </ScrollReveal>
            )
          })}
        </ul>
      )}

      <ScrollReveal variant="fade">
        <section className="rounded-xl border border-ink-600 bg-ink-800/50 p-4 transition-colors hover:border-ink-500">
          <h4 className="text-sm font-medium text-stone-400 mb-2">Your makers ({makers.length})</h4>
          <div className="flex flex-wrap gap-2">
            {makers.length === 0 ? (
              <span className="text-xs text-stone-500">Added automatically when you place orders</span>
            ) : (
              makers.map((m) => (
                <Link
                  key={m.id}
                  to={`/makers/${m.id}`}
                  className="text-xs px-2 py-1 rounded-full bg-ink-700 text-stone-300 hover:bg-gold-500/20 hover:text-gold-200 transition-colors"
                >
                  {m.name}
                </Link>
              ))
            )}
          </div>
          <button
            type="button"
            className="mt-3 text-xs text-gold-400 hover:underline"
            onClick={() => {
              const n = prompt('Add maker name')
              if (n) void upsertMakerByName(n).then(() => reload())
            }}
          >
            + Add maker
          </button>
        </section>
      </ScrollReveal>
    </div>
  )
}
