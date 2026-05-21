export type TransactionType =
  | 'memo_out'
  | 'memo_return'
  | 'sale'
  | 'purchase'
  | 'payment'
  | 'unknown'

export interface LedgerRecord {
  type: TransactionType
  item: string
  weight: number | null
  unit: string
  party: string
  action: string
  date: string
  amount?: number | null
  currency?: string
  notes?: string
}

export interface ProcessResult {
  rawText: string
  summary: string
  record: LedgerRecord
  confidence: number
  source: 'voice' | 'image' | 'text'
  receiptUrl?: string
}

export interface TransactionRow {
  id: string
  status: 'pending' | 'confirmed'
  source: 'voice' | 'image' | 'text'
  raw_input: string
  summary: string
  record: LedgerRecord
  receipt_url: string | null
  created_at: string
}

export interface DashboardStats {
  inventoryGrams: number
  pendingMemos: number
  memoExposureGrams: number
  recentCount: number
}
