import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { TransactionRow } from '../types/ledger'
import { getActiveBusinessId, requireBusinessId, scopedKey } from './tenant'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : null

function txKey(bid: string) {
  return scopedKey('ornateos_transactions', bid)
}

export function loadLocalTransactions(businessId?: string): TransactionRow[] {
  const bid = businessId ?? getActiveBusinessId()
  if (!bid) return []
  try {
    const raw = localStorage.getItem(txKey(bid))
    return raw ? (JSON.parse(raw) as TransactionRow[]) : []
  } catch {
    return []
  }
}

export function saveLocalTransactions(rows: TransactionRow[], businessId?: string) {
  const bid = businessId ?? requireBusinessId()
  localStorage.setItem(txKey(bid), JSON.stringify(rows))
}

export async function fetchTransactions(): Promise<TransactionRow[]> {
  const businessId = requireBusinessId()

  if (supabase) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    return (data ?? []) as TransactionRow[]
  }
  return loadLocalTransactions(businessId)
}

export async function insertTransaction(
  row: Omit<TransactionRow, 'id' | 'created_at'>,
): Promise<TransactionRow> {
  const businessId = requireBusinessId()
  const full: TransactionRow = {
    ...row,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }

  if (supabase) {
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...full, business_id: businessId })
      .select()
      .single()
    if (error) throw error
    return data as TransactionRow
  }

  const existing = loadLocalTransactions(businessId)
  saveLocalTransactions([full, ...existing], businessId)
  return full
}
