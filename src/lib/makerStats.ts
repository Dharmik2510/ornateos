import type { Maker, MakerOrder } from '../types/orders'
import { toGrams } from './orders'

export interface MakerDashboardStats {
  maker: Maker
  pendingCount: number
  overdueCount: number
  pendingGrams: number
  receivedCount: number
  receivedGrams: number
  totalOrders: number
  avgDeliveryDays: number | null
  byCategory: Record<string, { pending: number; received: number }>
  orders: MakerOrder[]
}

export function computeMakerStats(
  maker: Maker,
  allOrders: MakerOrder[],
): MakerDashboardStats {
  const orders = allOrders.filter((o) => o.maker_id === maker.id)
  const today = new Date().toISOString().slice(0, 10)
  const pending = orders.filter((o) => o.status === 'pending')
  const received = orders.filter((o) => o.status === 'received')

  const overdueCount = pending.filter(
    (o) => o.promised_at && o.promised_at < today,
  ).length

  const pendingGrams = pending.reduce(
    (s, o) => s + toGrams(o.weight_ordered, o.unit),
    0,
  )
  const receivedGrams = received.reduce(
    (s, o) =>
      s + toGrams(o.weight_received ?? o.weight_ordered, o.unit),
    0,
  )

  const byCategory: Record<string, { pending: number; received: number }> = {}
  for (const o of orders) {
    if (!byCategory[o.item_category]) {
      byCategory[o.item_category] = { pending: 0, received: 0 }
    }
    if (o.status === 'pending') byCategory[o.item_category].pending += 1
    if (o.status === 'received') byCategory[o.item_category].received += 1
  }

  let deliveryDaysSum = 0
  let deliveryDaysCount = 0
  for (const o of received) {
    if (!o.received_at || !o.ordered_at) continue
    const start = new Date(o.ordered_at).getTime()
    const end = new Date(o.received_at).getTime()
    const days = Math.round((end - start) / (1000 * 60 * 60 * 24))
    if (days >= 0) {
      deliveryDaysSum += days
      deliveryDaysCount += 1
    }
  }

  return {
    maker,
    pendingCount: pending.length,
    overdueCount,
    pendingGrams: Math.round(pendingGrams * 100) / 100,
    receivedCount: received.length,
    receivedGrams: Math.round(receivedGrams * 100) / 100,
    totalOrders: orders.length,
    avgDeliveryDays:
      deliveryDaysCount > 0
        ? Math.round((deliveryDaysSum / deliveryDaysCount) * 10) / 10
        : null,
    byCategory,
    orders: orders.sort(
      (a, b) =>
        new Date(b.ordered_at).getTime() - new Date(a.ordered_at).getTime(),
    ),
  }
}

export function computeAllMakerStats(
  makers: Maker[],
  orders: MakerOrder[],
): MakerDashboardStats[] {
  return makers
    .map((m) => computeMakerStats(m, orders))
    .sort((a, b) => b.pendingCount - a.pendingCount || a.maker.name.localeCompare(b.maker.name))
}
