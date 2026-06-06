import { supabase } from './supabase'
import { getActiveBusinessId, requireBusinessId, scopedKey } from './tenant'
import type {
  Maker,
  MakerOrder,
  PlaceOrderInput,
  ReceiveOrderInput,
  WeightUnit,
} from '../types/orders'

function makersKey(bid: string) {
  return scopedKey('ornateos_makers', bid)
}
function ordersKey(bid: string) {
  return scopedKey('ornateos_maker_orders', bid)
}

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
  const businessId = requireBusinessId()

  if (supabase) {
    const { data, error } = await supabase
      .from('makers')
      .select('*')
      .eq('business_id', businessId)
      .order('name')
    if (error) throw error
    return (data ?? []) as Maker[]
  }
  return loadLocal<Maker>(makersKey(businessId)).sort((a, b) =>
    a.name.localeCompare(b.name),
  )
}

export async function upsertMakerByName(
  name: string,
  phone?: string | null,
): Promise<Maker> {
  const businessId = requireBusinessId()
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
      .insert({ ...maker, business_id: businessId })
      .select()
      .single()
    if (error) throw error
    return data as Maker
  }

  const all = loadLocal<Maker>(makersKey(businessId))
  saveLocal(makersKey(businessId), [...all, maker])
  return maker
}

export async function fetchMakerOrders(
  status?: MakerOrder['status'],
): Promise<MakerOrder[]> {
  const businessId = requireBusinessId()

  if (supabase) {
    let q = supabase
      .from('maker_orders')
      .select('*, makers(name)')
      .eq('business_id', businessId)
      .order('ordered_at', { ascending: false })
    if (status) q = q.eq('status', status)
    const { data, error } = await q
    if (error) throw error
    return (data ?? []).map(mapOrderRow)
  }

  let rows = loadLocal<MakerOrder>(ordersKey(businessId))
  if (status) rows = rows.filter((o) => o.status === status)
  return rows.sort(
    (a, b) => new Date(b.ordered_at).getTime() - new Date(a.ordered_at).getTime(),
  )
}

function mapOrderRow(row: Record<string, unknown>): MakerOrder {
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
}

export async function placeMakerOrder(input: PlaceOrderInput): Promise<MakerOrder> {
  const businessId = requireBusinessId()
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
        business_id: businessId,
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
    return mapOrderRow(data as Record<string, unknown>)
  }

  const all = loadLocal<MakerOrder>(ordersKey(businessId))
  saveLocal(ordersKey(businessId), [order, ...all])
  return order
}

export async function receiveMakerOrder(
  input: ReceiveOrderInput,
): Promise<MakerOrder> {
  const businessId = requireBusinessId()
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
      .eq('business_id', businessId)
      .select('*, makers(name)')
      .single()
    if (error) throw error
    return mapOrderRow(data as Record<string, unknown>)
  }

  const all = loadLocal<MakerOrder>(ordersKey(businessId))
  saveLocal(
    ordersKey(businessId),
    all.map((o) => (o.id === order.id ? updated : o)),
  )
  return updated
}

export function findPendingOrderMatches(
  orders: MakerOrder[],
  makerName: string,
  item?: string,
): MakerOrder[] {
  const pending = orders.filter((o) => o.status === 'pending')
  const nameLower = makerName.toLowerCase()
  let matches = pending.filter((o) => o.maker_name.toLowerCase() === nameLower)
  if (item) {
    const byItem = matches.filter(
      (o) => o.item_category === item || o.item_category.includes(item),
    )
    if (byItem.length > 0) matches = byItem
  }
  return matches.sort(
    (a, b) => new Date(b.ordered_at).getTime() - new Date(a.ordered_at).getTime(),
  )
}

/**
 * Returns the single unambiguous pending match, or `undefined` when there are
 * zero or multiple candidates. Ambiguous cases are surfaced to the user for an
 * explicit choice rather than silently picking one.
 */
export function findPendingOrderMatch(
  orders: MakerOrder[],
  makerName: string,
  item?: string,
): MakerOrder | undefined {
  const matches = findPendingOrderMatches(orders, makerName, item)
  return matches.length === 1 ? matches[0] : undefined
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

/** Seed demo data for new local businesses */
export function seedDemoDataIfEmpty(businessId: string) {
  if (getActiveBusinessId() !== businessId) return
  if (loadLocal(makersKey(businessId)).length > 0) return

  const makers: Maker[] = [
    {
      id: crypto.randomUUID(),
      name: 'Ramesh',
      phone: null,
      notes: null,
      created_at: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Jayesh',
      phone: null,
      notes: null,
      created_at: new Date().toISOString(),
    },
  ]
  saveLocal(makersKey(businessId), makers)
}
