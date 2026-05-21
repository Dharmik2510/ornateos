import { supabase } from './supabase'
import type {
  Maker,
  MakerOrder,
  PlaceOrderInput,
  ReceiveOrderInput,
  WeightUnit,
} from '../types/orders'

const MAKERS_KEY = 'ornateos_makers'
const ORDERS_KEY = 'ornateos_maker_orders'

function loadLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function saveLocal<T>(key: string, rows: T[]) {
  localStorage.setItem(key, JSON.stringify(rows))
}

export function toGrams(weight: number, unit: WeightUnit): number {
  return unit === 'kilo' ? weight * 1000 : weight
}

export async function fetchMakers(): Promise<Maker[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('makers')
      .select('*')
      .order('name')
    if (error) throw error
    return (data ?? []) as Maker[]
  }
  return loadLocal<Maker>(MAKERS_KEY).sort((a, b) =>
    a.name.localeCompare(b.name),
  )
}

export async function upsertMakerByName(
  name: string,
  phone?: string | null,
): Promise<Maker> {
  const trimmed = name.trim()
  const existing = (await fetchMakers()).find(
    (m) => m.name.toLowerCase() === trimmed.toLowerCase(),
  )
  if (existing) return existing

  const maker: Maker = {
    id: crypto.randomUUID(),
    name: trimmed,
    phone: phone ?? null,
    notes: null,
    created_at: new Date().toISOString(),
  }

  if (supabase) {
    const { data, error } = await supabase
      .from('makers')
      .insert(maker)
      .select()
      .single()
    if (error) throw error
    return data as Maker
  }

  const all = loadLocal<Maker>(MAKERS_KEY)
  saveLocal(MAKERS_KEY, [...all, maker])
  return maker
}

export async function fetchMakerOrders(
  status?: MakerOrder['status'],
): Promise<MakerOrder[]> {
  if (supabase) {
    let q = supabase
      .from('maker_orders')
      .select('*, makers(name)')
      .order('ordered_at', { ascending: false })
    if (status) q = q.eq('status', status)
    const { data, error } = await q
    if (error) throw error
    return (data ?? []).map((row: Record<string, unknown>) => {
      const makers = row.makers as { name: string } | null
      return {
        id: row.id as string,
        maker_id: row.maker_id as string,
        maker_name: makers?.name ?? 'Unknown',
        item_category: row.item_category as MakerOrder['item_category'],
        weight_ordered: Number(row.weight_ordered),
        unit: row.unit as MakerOrder['unit'],
        status: row.status as MakerOrder['status'],
        ordered_at: row.ordered_at as string,
        promised_at: (row.promised_at as string) ?? null,
        received_at: (row.received_at as string) ?? null,
        weight_received:
          row.weight_received != null ? Number(row.weight_received) : null,
        notes: (row.notes as string) ?? null,
        created_at: row.created_at as string,
      }
    })
  }

  let rows = loadLocal<MakerOrder>(ORDERS_KEY)
  if (status) rows = rows.filter((o) => o.status === status)
  return rows.sort(
    (a, b) => new Date(b.ordered_at).getTime() - new Date(a.ordered_at).getTime(),
  )
}

export async function placeMakerOrder(input: PlaceOrderInput): Promise<MakerOrder> {
  const maker = input.maker_id
    ? (await fetchMakers()).find((m) => m.id === input.maker_id)
    : await upsertMakerByName(input.maker_name)

  if (!maker) throw new Error('Maker not found')

  const order: MakerOrder = {
    id: crypto.randomUUID(),
    maker_id: maker.id,
    maker_name: maker.name,
    item_category: input.item_category,
    weight_ordered: input.weight_ordered,
    unit: input.unit,
    status: 'pending',
    ordered_at: input.ordered_at ?? new Date().toISOString().slice(0, 10),
    promised_at: input.promised_at ?? null,
    received_at: null,
    weight_received: null,
    notes: input.notes ?? null,
    created_at: new Date().toISOString(),
  }

  if (supabase) {
    const { data, error } = await supabase
      .from('maker_orders')
      .insert({
        id: order.id,
        maker_id: order.maker_id,
        item_category: order.item_category,
        weight_ordered: order.weight_ordered,
        unit: order.unit,
        status: order.status,
        ordered_at: order.ordered_at,
        promised_at: order.promised_at,
        notes: order.notes,
      })
      .select('*, makers(name)')
      .single()
    if (error) throw error
    const row = data as Record<string, unknown>
    const makers = row.makers as { name: string }
    return { ...order, maker_name: makers.name }
  }

  const all = loadLocal<MakerOrder>(ORDERS_KEY)
  saveLocal(ORDERS_KEY, [order, ...all])
  return order
}

export async function receiveMakerOrder(
  input: ReceiveOrderInput,
): Promise<MakerOrder> {
  const orders = await fetchMakerOrders()
  const order = orders.find((o) => o.id === input.order_id)
  if (!order) throw new Error('Order not found')
  if (order.status === 'received') throw new Error('Order already received')

  const updated: MakerOrder = {
    ...order,
    status: 'received',
    received_at: input.received_at ?? new Date().toISOString(),
    weight_received: input.weight_received,
    notes: input.notes ? `${order.notes ?? ''} ${input.notes}`.trim() : order.notes,
  }

  if (supabase) {
    const { data, error } = await supabase
      .from('maker_orders')
      .update({
        status: 'received',
        received_at: updated.received_at,
        weight_received: updated.weight_received,
        notes: updated.notes,
      })
      .eq('id', order.id)
      .select('*, makers(name)')
      .single()
    if (error) throw error
    const row = data as Record<string, unknown>
    const makers = row.makers as { name: string }
    return {
      ...updated,
      maker_name: makers.name,
      weight_ordered: Number(row.weight_ordered),
      weight_received: Number(row.weight_received),
    }
  }

  const all = loadLocal<MakerOrder>(ORDERS_KEY)
  saveLocal(
    ORDERS_KEY,
    all.map((o) => (o.id === order.id ? updated : o)),
  )
  return updated
}

export function findPendingOrderMatch(
  orders: MakerOrder[],
  makerName: string,
  item?: string,
): MakerOrder | undefined {
  const pending = orders.filter((o) => o.status === 'pending')
  const nameLower = makerName.toLowerCase()
  const matches = pending.filter((o) => o.maker_name.toLowerCase() === nameLower)
  if (item) {
    const byItem = matches.filter(
      (o) => o.item_category === item || o.item_category.includes(item),
    )
    if (byItem.length === 1) return byItem[0]
  }
  if (matches.length === 1) return matches[0]
  return matches.sort(
    (a, b) => new Date(b.ordered_at).getTime() - new Date(a.ordered_at).getTime(),
  )[0]
}

export function orderStats(orders: MakerOrder[]) {
  const pending = orders.filter((o) => o.status === 'pending')
  const today = new Date().toISOString().slice(0, 10)
  const overdue = pending.filter(
    (o) => o.promised_at && o.promised_at < today,
  )
  const gramsOut = pending.reduce(
    (sum, o) => sum + toGrams(o.weight_ordered, o.unit),
    0,
  )
  return {
    pendingCount: pending.length,
    overdueCount: overdue.length,
    gramsWithMakers: Math.round(gramsOut * 100) / 100,
  }
}
