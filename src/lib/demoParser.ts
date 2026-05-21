import type { LedgerRecord, ProcessResult } from '../types/ledger'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function parseInformalText(
  text: string,
  source: ProcessResult['source'],
  receiptUrl?: string,
): ProcessResult {
  const normalized = text.trim()
  const lower = normalized.toLowerCase()

  let type: LedgerRecord['type'] = 'unknown'
  let action = 'recorded'
  let party = ''
  let weight: number | null = null
  let item = 'gold'
  const unit = 'gram'

  const weightMatch =
    normalized.match(/(\d+(?:\.\d+)?)\s*(?:g|gram|grams|gm|ગ્રામ)/i) ||
    normalized.match(/(\d+(?:\.\d+)?)\s*(?:g|gram)/i)
  if (weightMatch) weight = parseFloat(weightMatch[1])

  const partyMatch =
    normalized.match(
      /(?:ne|to|for|party|જને|ને)\s+([A-Za-z0-9\u0A80-\u0AFF\u0900-\u097F]+)/i,
    ) || normalized.match(/([A-Z]{2,})\s*(?:ne|ને)/i)
  if (partyMatch) party = partyMatch[1].trim()

  if (/memo|મેમો|યાદ/i.test(lower)) {
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
    const caps = normalized.match(/\b([A-Z]{2,})\b/)
    if (caps) party = caps[1]
  }

  const record: LedgerRecord = {
    type,
    item,
    weight,
    unit,
    party: party || 'Unknown',
    action,
    date: todayIso(),
    notes: normalized,
  }

  const weightLabel = weight != null ? `${weight}${unit === 'gram' ? 'g' : ` ${unit}`}` : ''
  const summary =
    type === 'memo_out'
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
  }
}
