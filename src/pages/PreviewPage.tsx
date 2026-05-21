import { Check, ChevronLeft, Pencil } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { insertTransaction } from '../lib/supabase'
import type { LedgerRecord, ProcessResult } from '../types/ledger'

export function PreviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const initial = location.state?.result as ProcessResult | undefined
  const [saving, setSaving] = useState(false)
  const [editJson, setEditJson] = useState(false)
  const [jsonText, setJsonText] = useState(
    JSON.stringify(initial?.record ?? {}, null, 2),
  )

  if (!initial) {
    return (
      <div className="text-center space-y-4 py-12">
        <p className="text-stone-400">No preview data. Record something first.</p>
        <Link to="/" className="text-gold-400 hover:underline">
          Go to input
        </Link>
      </div>
    )
  }

  const result = initial
  const { record, summary } = result

  async function confirm() {
    setSaving(true)
    try {
      const finalRecord = editJson
        ? (JSON.parse(jsonText) as LedgerRecord)
        : record
      await insertTransaction({
        status: 'confirmed',
        source: result.source,
        raw_input: result.rawText,
        summary,
        record: finalRecord,
        receipt_url: result.receiptUrl ?? null,
      })
      navigate('/dashboard', { replace: true })
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-stone-400 hover:text-gold-300"
      >
        <ChevronLeft className="size-4" /> Back
      </Link>

      <div className="rounded-2xl border border-gold-500/25 bg-gradient-to-b from-gold-500/10 to-transparent p-6 space-y-3">
        <p className="text-xs uppercase tracking-wider text-gold-400/80">
          AI detected
        </p>
        <h2 className="text-xl font-semibold text-gold-50">{summary}</h2>
        <p className="text-sm text-stone-400">
          Confidence {(result.confidence * 100).toFixed(0)}% · via {result.source}
        </p>
        {result.receiptUrl && (
          <a
            href={result.receiptUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-gold-400 underline"
          >
            View receipt on R2
          </a>
        )}
      </div>

      <div className="rounded-2xl border border-ink-600 bg-ink-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-stone-300">Structured record</span>
          <button
            type="button"
            onClick={() => {
              setEditJson(!editJson)
              setJsonText(JSON.stringify(record, null, 2))
            }}
            className="text-xs flex items-center gap-1 text-gold-400 hover:text-gold-300"
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
                <dt className="text-stone-500 capitalize">{k}</dt>
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
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold shadow-lg shadow-emerald-900/30 hover:opacity-95 disabled:opacity-50"
      >
        <Check className="size-5" />
        {saving ? 'Saving…' : 'Confirm & update ledger'}
      </button>
    </div>
  )
}
