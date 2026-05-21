import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { TransactionRow } from '../types/ledger'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : null

const LOCAL_KEY = 'ornateos_transactions'

export function loadLocalTransactions(): TransactionRow[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? (JSON.parse(raw) as TransactionRow[]) : []
  } catch {
    return []
  }
}

export function saveLocalTransactions(rows: TransactionRow[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(rows))
}

export async function fetchTransactions(): Promise<TransactionRow[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return (data ?? []) as TransactionRow[]
  }
  return loadLocalTransactions()
}

export async function insertTransaction(
  row: Omit<TransactionRow, 'id' | 'created_at'>,
): Promise<TransactionRow> {
  const full: TransactionRow = {
    ...row,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }

  if (supabase) {
    const { data, error } = await supabase
      .from('transactions')
      .insert(full)
      .select()
      .single()
    if (error) throw error
    return data as TransactionRow
  }

  const existing = loadLocalTransactions()
  saveLocalTransactions([full, ...existing])
  return full
}
