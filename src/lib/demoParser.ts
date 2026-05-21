import type { LedgerRecord, ProcessResult } from '../types/ledger'
import { fetchMakerOrders, findPendingOrderMatch } from './orders'
import { ITEM_CATEGORIES } from '../types/orders'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function detectItemCategory(text: string): string {
  const lower = text.toLowerCase()
  for (const cat of ITEM_CATEGORIES) {
    if (lower.includes(cat)) return cat
  }
  if (/ring|રિંગ|अंगूठी/i.test(text)) return 'ring'
  if (/necklace|હાર|हार|neckless/i.test(text)) return 'necklace'
  if (/bracelet|બ્રેસલેટ/i.test(text)) return 'bracelet'
  if (/bangle|બંગળ/i.test(text)) return 'bangle'
  if (/chain|સાંકળ/i.test(text)) return 'chain'
  return 'other'
}

function parsePromisedDate(text: string): string | null {
  const iso = text.match(/(\d{4}-\d{2}-\d{2})/)
  if (iso) return iso[1]
  const dmy = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
  if (dmy) {
    const y = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]
    return `${y}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  }
  const dayWord = text.match(/(\d{1,2})\s*(?:tarikh|તારીખ|date|th|થી)/i)
  if (dayWord) {
    const d = parseInt(dayWord[1], 10)
    const now = new Date()
    const dt = new Date(now.getFullYear(), now.getMonth(), d)
    if (dt < now) dt.setMonth(dt.getMonth() + 1)
    return dt.toISOString().slice(0, 10)
  }
  return null
}

export async function parseInformalText(
  text: string,
  source: ProcessResult['source'],
  receiptUrl?: string,
): Promise<ProcessResult> {
  const normalized = text.trim()
  const lower = normalized.toLowerCase()

  let type: LedgerRecord['type'] = 'unknown'
  let action = 'recorded'
  let party = ''
  let weight: number | null = null
  let item = 'gold'
  let unit = 'gram'
  const itemCategory = detectItemCategory(normalized)

  const weightMatch =
    normalized.match(
      /(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilogram|કિલો|किलो)/i,
    ) ||
    normalized.match(/(\d+(?:\.\d+)?)\s*(?:g|gram|grams|gm|ગ્રામ|ग्राम)/i) ||
    normalized.match(/(\d+(?:\.\d+)?)\s*(?:g|gram)/i)
  if (weightMatch) {
    weight = parseFloat(weightMatch[1])
    unit = /kilo|kg|કિલો/i.test(weightMatch[0]) ? 'kilo' : 'gram'
  }

  const partyMatch =
    normalized.match(
      /(?:ne|to|from|thi|થી|પાસેથી|से|ને|for)\s+([A-Za-z0-9\u0A80-\u0AFF\u0900-\u097F]+)/i,
    ) || normalized.match(/([A-Za-z\u0A80-\u0AFF\u0900-\u097F]{2,})\s*(?:ne|ને|thi|થી)/i)
  if (partyMatch) party = partyMatch[1].trim()

  const isReceive =
    /received|got|mali|મળી|મળ્ય|આવી|આવ્ય|delivered|પાછા મળ|ले लिया|मिला|मिली/i.test(
      lower,
    )
  const isOrder =
    /order|ઓર્ડર|ઓડર|banav|બનાવ|તૈયાર|commit|આપશે|aapse|આપે|due|promise/i.test(
      lower,
    )

  if (isReceive && (party || weight)) {
    type = 'order_received'
    action = 'received_from_maker'
    item = itemCategory
    const fromMatch = normalized.match(
      /(?:from|thi|થી|પાસેથી|से)\s+([A-Za-z0-9\u0A80-\u0AFF\u0900-\u097F]+)/i,
    )
    if (fromMatch) party = fromMatch[1].trim()
  } else if (isOrder || (/ring|necklace|bracelet|bangle|chain/i.test(lower) && party)) {
    type = 'order_placed'
    action = 'ordered'
    item = itemCategory
  } else if (/memo|મેમો|યાદ/i.test(lower)) {
    type = /return|પાછ|wapas|વાપસ/i.test(lower) ? 'memo_return' : 'memo_out'
    action = type === 'memo_return' ? 'returned' : 'issued'
  } else if (/sale|વેચ|વેચાણ|sold/i.test(lower)) {
    type = 'sale'
    action = 'sold'
  } else if (/purchase|ખરીદ|buy|લીધ/i.test(lower)) {
    type = 'purchase'
    action = 'purchased'
  } else if (/payment|ચુકવ|paid|રોકડ/i.test(lower)) {
    type = 'payment'
    action = 'paid'
  }

  if (!party) {
    const caps = normalized.match(/\b([A-Z][a-z]+|[A-Z]{2,})\b/)
    if (caps) party = caps[1]
  }

  const promised_at = type === 'order_placed' ? parsePromisedDate(normalized) : null

  const record: LedgerRecord = {
    type,
    item,
    weight,
    unit,
    party: party || 'Unknown',
    action,
    date: todayIso(),
    notes: normalized,
    item_category: itemCategory,
    promised_at,
  }

  let matchedOrderId: string | undefined
  if (type === 'order_received' && party) {
    const pending = await fetchMakerOrders('pending')
    const match = findPendingOrderMatch(pending, party, itemCategory)
    if (match) {
      matchedOrderId = match.id
      record.order_id = match.id
    }
  }

  const weightLabel =
    weight != null
      ? `${weight}${unit === 'kilo' ? ' kg' : 'g'}`
      : ''
  const summary =
    type === 'order_placed'
      ? `Order: ${weightLabel} ${itemCategory} with ${record.party}${promised_at ? ` (due ${promised_at})` : ''}`
      : type === 'order_received'
        ? `Received ${weightLabel} ${itemCategory} from ${record.party}`
        : type === 'memo_out'
          ? `Memo to ${record.party}${weightLabel ? ` (${weightLabel} ${item})` : ''}`
          : type === 'memo_return'
            ? `Memo return from ${record.party}${weightLabel ? ` (${weightLabel})` : ''}`
            : type === 'sale'
              ? `Sale${weightLabel ? ` — ${weightLabel} ${item}` : ''}`
              : `Recorded: ${normalized.slice(0, 60)}${normalized.length > 60 ? '…' : ''}`

  return {
    rawText: normalized,
    summary,
    record,
    confidence: 0.72,
    source,
    receiptUrl,
    matchedOrderId,
  }
}
