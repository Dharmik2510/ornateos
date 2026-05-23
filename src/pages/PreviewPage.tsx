import { Check, ChevronLeft, Pencil } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { applyProcessResult, isMakerOrderType } from '../lib/orderActions'
import { insertTransaction } from '../lib/supabase'
import type { LedgerRecord, ProcessResult } from '../types/ledger'
import { fetchMakerOrders, findPendingOrderMatches } from '../lib/orders'
import type { MakerOrder } from '../types/orders'
import { useEffect, useState } from 'react'
import { PageHeader } from '../components/ui/PageHeader'

export function PreviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const initial = location.state?.result as ProcessResult | undefined
  const [saving, setSaving] = useState(false)
  const [editJson, setEditJson] = useState(false)
  const [jsonText, setJsonText] = useState(
    JSON.stringify(initial?.record ?? {}, null, 2),
  )
  const [orderChoices, setOrderChoices] = useState<MakerOrder[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    initial?.matchedOrderId ?? initial?.record.order_id ?? null,
  )

  const result = initial!
  const record = result.record
  const summary = result.summary

  useEffect(() => {
    if (!record || record.type !== 'order_received') return
    void fetchMakerOrders('pending').then((orders) => {
      const matches = findPendingOrderMatches(
        orders,
        record.party,
        record.item_category ?? record.item,
      )
      setOrderChoices(matches)
      if (matches.length === 1) setSelectedOrderId(matches[0].id)
      else if (result?.matchedOrderId) setSelectedOrderId(result.matchedOrderId)
    })
  }, [record, result?.matchedOrderId])

  if (!initial || !record) {
    return (
      <div className="text-center space-y-4 py-12">
        <p className="text-stone-400">No preview data. Record something first.</p>
        <Link to="/record" className="text-gold-400 hover:underline">
          Go to record
        </Link>
      </div>
    )
  }

  async function confirm() {
    if (!result) return
    setSaving(true)
    try {
      const finalRecord: LedgerRecord = editJson
        ? (JSON.parse(jsonText) as LedgerRecord)
        : record

      if (
        finalRecord.type === 'order_received' &&
        orderChoices.length > 1 &&
        !selectedOrderId
      ) {
        alert('Please select which pending order you received.')
        return
      }

      const payload: ProcessResult = {
        ...result,
        record: {
          ...finalRecord,
          order_id: selectedOrderId ?? finalRecord.order_id,
        },
        matchedOrderId: selectedOrderId ?? result.matchedOrderId,
      }

      if (isMakerOrderType(finalRecord.type)) {
        await applyProcessResult(payload)
      } else {
        await insertTransaction({
          status: 'confirmed',
          source: result.source,
          raw_input: result.rawText,
          summary,
          record: finalRecord,
          receipt_url: result.receiptUrl ?? null,
        })
      }
      navigate(
        finalRecord.type === 'order_placed' || finalRecord.type === 'order_received'
          ? '/orders'
          : '/dashboard',
        { replace: true },
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not save'
      if (msg.startsWith('MULTIPLE_ORDERS:')) {
        alert('Multiple orders match — select one below.')
      } else {
        alert(msg)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <Link
        to="/record"
        className="inline-flex items-center gap-1 text-sm text-stone-400 hover:text-gold-300"
      >
        <ChevronLeft className="size-4" /> Back
      </Link>

      <PageHeader title="Review & confirm" description="Check AI output before updating your ledger." />

      <div className="rounded-2xl border border-gold-500/25 bg-gradient-to-b from-gold-500/10 to-transparent p-6 space-y-3">
        <p className="text-xs uppercase tracking-wider text-gold-400/80">AI detected</p>
        <h2 className="text-xl font-semibold text-gold-50">{summary}</h2>
        <p className="text-sm text-stone-400">
          Confidence {(result.confidence * 100).toFixed(0)}% · via {result.source}
        </p>
        {record.promised_at && record.type === 'order_placed' && (
          <p className="text-xs text-stone-400">Committed delivery: {record.promised_at}</p>
        )}
        {result.receiptUrl && (
          <a
            href={result.receiptUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-gold-400 underline"
          >
            View receipt
          </a>
        )}
      </div>

      {record.type === 'order_received' && orderChoices.length > 1 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-3">
          <p className="text-sm font-medium text-amber-200">Which order did you receive?</p>
          {orderChoices.map((o) => (
            <label
              key={o.id}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer min-h-[44px] ${
                selectedOrderId === o.id
                  ? 'border-gold-500/50 bg-gold-500/10'
                  : 'border-ink-600 bg-ink-800'
              }`}
            >
              <input
                type="radio"
                name="order"
                checked={selectedOrderId === o.id}
                onChange={() => setSelectedOrderId(o.id)}
              />
              <span className="text-sm text-stone-200">
                {o.weight_ordered}
                {o.unit} {o.item_category} · ordered {o.ordered_at}
              </span>
            </label>
          ))}
        </div>
      )}

      {record.type === 'order_received' && orderChoices.length === 1 && (
        <p className="text-xs text-emerald-400 px-1">
          Matched: {orderChoices[0].weight_ordered}
          {orderChoices[0].unit} {orderChoices[0].item_category} with {orderChoices[0].maker_name}
        </p>
      )}

      {record.type === 'order_received' && orderChoices.length === 0 && (
        <p className="text-xs text-amber-400 px-1">
          No pending order found for {record.party}. Place the order first or pick manually on
          Orders.
        </p>
      )}

      <div className="rounded-2xl border border-ink-600 bg-ink-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-stone-300">Structured record</span>
          <button
            type="button"
            onClick={() => {
              setEditJson(!editJson)
              setJsonText(JSON.stringify(record, null, 2))
            }}
            className="text-xs flex items-center gap-1 text-gold-400 hover:text-gold-300 min-h-[44px] px-2"
          >
            <Pencil className="size-3" /> {editJson ? 'Form view' : 'Edit JSON'}
          </button>
        </div>
        {editJson ? (
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={12}
            className="w-full font-mono text-xs rounded-lg bg-ink-900 border border-ink-600 p-3 text-stone-200"
          />
        ) : (
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(record).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-stone-500 capitalize">{k.replace(/_/g, ' ')}</dt>
                <dd className="text-stone-100 font-medium">{String(v ?? '—')}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <p className="text-xs text-stone-500 text-center">Raw: {result.rawText}</p>

      <button
        type="button"
        disabled={saving}
        onClick={() => void confirm()}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold shadow-lg shadow-emerald-900/30 hover:opacity-95 disabled:opacity-50 min-h-[48px]"
      >
        <Check className="size-5" />
        {saving ? 'Saving…' : 'Confirm & update ledger'}
      </button>
    </div>
  )
}
