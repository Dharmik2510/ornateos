import { AlertTriangle, Package, RefreshCw, Scale } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { computeDashboard } from '../lib/api'
import { fetchTransactions } from '../lib/supabase'
import type { DashboardStats, TransactionRow } from '../types/ledger'

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  sub?: string
  icon: typeof Package
  accent: string
}) {
  return (
    <div className="rounded-2xl border border-ink-600 bg-ink-800 p-5 space-y-2">
      <div className={`inline-flex p-2 rounded-lg ${accent}`}>
        <Icon className="size-5" />
      </div>
      <p className="text-xs text-stone-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-stone-50">{value}</p>
      {sub && <p className="text-xs text-stone-400">{sub}</p>}
    </div>
  )
}

export function DashboardPage() {
  const [rows, setRows] = useState<TransactionRow[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchTransactions()
      setRows(data)
      setStats(computeDashboard(data))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const memos = rows.filter(
    (r) =>
      r.status === 'confirmed' &&
      (r.record.type === 'memo_out' || r.record.type === 'memo_return'),
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gold-100">Business dashboard</h2>
        <button
          type="button"
          onClick={() => void load()}
          className="p-2 rounded-lg text-stone-400 hover:bg-ink-700 hover:text-gold-300"
          aria-label="Refresh"
        >
          <RefreshCw className={`size-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Inventory (gold)"
            value={`${stats.inventoryGrams} g`}
            sub="Net grams in stock"
            icon={Package}
            accent="bg-gold-500/20 text-gold-300"
          />
          <StatCard
            label="Pending memos"
            value={String(stats.pendingMemos)}
            sub="Issued, not returned"
            icon={Scale}
            accent="bg-blue-500/20 text-blue-300"
          />
          <StatCard
            label="Memo exposure"
            value={`${stats.memoExposureGrams} g`}
            sub="Gold out on memo"
            icon={AlertTriangle}
            accent="bg-amber-500/20 text-amber-300"
          />
          <StatCard
            label="Transactions"
            value={String(stats.recentCount)}
            sub="All time in system"
            icon={RefreshCw}
            accent="bg-emerald-500/20 text-emerald-300"
          />
        </div>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wide">
          Pending & recent memos
        </h3>
        {memos.length === 0 ? (
          <p className="text-stone-500 text-sm py-6 text-center rounded-xl border border-dashed border-ink-600">
            No memos yet.{' '}
            <Link to="/" className="text-gold-400 hover:underline">
              Record your first memo
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {memos.slice(0, 8).map((r) => (
              <li
                key={r.id}
                className="flex justify-between items-center rounded-xl bg-ink-800 border border-ink-600 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-stone-100">{r.summary}</p>
                  <p className="text-xs text-stone-500">
                    {r.record.party} · {r.record.date}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    r.record.type === 'memo_out'
                      ? 'bg-amber-950 text-amber-300'
                      : 'bg-emerald-950 text-emerald-300'
                  }`}
                >
                  {r.record.type === 'memo_out' ? 'issued' : 'returned'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wide">
          Recent transactions
        </h3>
        <div className="overflow-x-auto rounded-xl border border-ink-600">
          <table className="w-full text-sm">
            <thead className="bg-ink-700 text-stone-400 text-left">
              <tr>
                <th className="px-4 py-2">Summary</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Weight</th>
                <th className="px-4 py-2">Party</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-stone-500">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                rows.slice(0, 12).map((r) => (
                  <tr key={r.id} className="border-t border-ink-600">
                    <td className="px-4 py-2 text-stone-200">{r.summary}</td>
                    <td className="px-4 py-2 text-stone-400">{r.record.type}</td>
                    <td className="px-4 py-2">
                      {r.record.weight != null
                        ? `${r.record.weight} ${r.record.unit}`
                        : '—'}
                    </td>
                    <td className="px-4 py-2">{r.record.party}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
