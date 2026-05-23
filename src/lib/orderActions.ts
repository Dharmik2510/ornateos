import type { LedgerRecord, ProcessResult } from '../types/ledger'
import type { ItemCategory, ReceiveOrderInput, WeightUnit } from '../types/orders'
import { ITEM_CATEGORIES } from '../types/orders'
import { insertTransaction } from './supabase'
import {
  fetchMakerOrders,
  findPendingOrderMatches,
  placeMakerOrder,
  receiveMakerOrder,
  toGrams,
} from './orders'

function parseItemCategory(item: string): ItemCategory {
  const lower = item.toLowerCase()
  const found = ITEM_CATEGORIES.find(
    (c) => lower.includes(c) || (c === 'earrings' && /earring|બુધ|.બુધ/i.test(lower)),
  )
  return found ?? 'other'
}

function parseUnit(unit: string): WeightUnit {
  return /kilo|kg|કિલો/i.test(unit) ? 'kilo' : 'gram'
}

export async function applyProcessResult(result: ProcessResult): Promise<void> {
  const { record } = result

  if (record.type === 'order_placed') {
    await placeMakerOrder({
      maker_name: record.party,
      item_category: parseItemCategory(record.item_category ?? record.item),
      weight_ordered: record.weight ?? 0,
      unit: parseUnit(record.unit),
      ordered_at: record.date,
      promised_at: record.promised_at ?? null,
      notes: record.notes ?? result.rawText,
    })
    await insertTransaction({
      status: 'confirmed',
      source: result.source,
      raw_input: result.rawText,
      summary: result.summary,
      record,
      receipt_url: result.receiptUrl ?? null,
    })
    return
  }

  if (record.type === 'order_received') {
    const pending = await fetchMakerOrders('pending')
    let match =
      record.order_id
        ? pending.find((o) => o.id === record.order_id)
        : undefined

    if (!match) {
      const matches = findPendingOrderMatches(
        pending,
        record.party,
        record.item_category ?? record.item,
      )
      if (matches.length === 1) match = matches[0]
      else if (matches.length > 1) {
        throw new Error(
          `MULTIPLE_ORDERS:${matches.map((m) => m.id).join(',')}`,
        )
      }
    }

    if (!match) {
      throw new Error(
        `No pending order found for ${record.party}. Place the order first or use Orders screen.`,
      )
    }

    const weight = record.weight ?? match.weight_ordered
    const unit = parseUnit(record.unit)

    await receiveMakerOrder({
      order_id: match.id,
      weight_received: weight,
      unit,
      notes: record.notes ?? result.rawText,
    })

    const grams = toGrams(weight, unit)
    await insertTransaction({
      status: 'confirmed',
      source: result.source,
      raw_input: result.rawText,
      summary: result.summary,
      record: {
        ...record,
        type: 'purchase',
        item: 'gold',
        weight: grams,
        unit: 'gram',
        action: 'received_from_maker',
        order_id: match.id,
      },
      receipt_url: result.receiptUrl ?? null,
    })
  }
}

export function isMakerOrderType(type: LedgerRecord['type']) {
  return type === 'order_placed' || type === 'order_received'
}

/** Manual receive from Orders page — updates order + inventory ledger */
export async function receiveOrderWithLedger(
  input: ReceiveOrderInput & { maker_name: string; item_category: string },
) {
  const updated = await receiveMakerOrder(input)
  const grams = toGrams(input.weight_received, input.unit ?? updated.unit)
  await insertTransaction({
    status: 'confirmed',
    source: 'text',
    raw_input: `Received ${input.weight_received} ${input.unit ?? updated.unit} from ${input.maker_name}`,
    summary: `Received ${grams}g ${input.item_category} from ${input.maker_name}`,
    record: {
      type: 'purchase',
      item: 'gold',
      weight: grams,
      unit: 'gram',
      party: input.maker_name,
      action: 'received_from_maker',
      date: new Date().toISOString().slice(0, 10),
      item_category: input.item_category,
      order_id: updated.id,
    },
    receipt_url: null,
  })
  return updated
}
