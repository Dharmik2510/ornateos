import { isSupabaseConfigured, supabase } from './supabase'
import { parseInformalText as parseInformalTextAsync } from './demoParser'
import type { LedgerRecord, ProcessResult } from '../types/ledger'
import { orderStats, fetchMakerOrders } from './orders'

export async function processInput(payload: {
  text?: string
  audioBase64?: string
  mimeType?: string
  imageUrl?: string
  receiptKey?: string
  source: ProcessResult['source']
}): Promise<ProcessResult> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.functions.invoke('process-input', {
      body: payload,
    })
    if (!error && data && typeof data === 'object' && 'record' in data) {
      return data as ProcessResult
    }
  }

  const text =
    payload.text?.trim() ||
    (payload.source === 'image'
      ? 'Receipt uploaded — demo OCR: 10 gram gold memo to XYZ'
      : payload.source === 'voice'
        ? 'Aaje 10 gram gold XYZ ne memo aapyo'
        : '')

  return parseInformalTextAsync(text, payload.source, payload.imageUrl)
}

export async function getR2UploadUrl(
  filename: string,
  contentType: string,
): Promise<{ uploadUrl: string; publicUrl: string; key: string } | null> {
  if (!isSupabaseConfigured || !supabase) return null

  const { data, error } = await supabase.functions.invoke('r2-presign', {
    body: { filename, contentType },
  })
  if (error || !data) return null
  return data as { uploadUrl: string; publicUrl: string; key: string }
}

export async function uploadReceipt(file: File): Promise<string | undefined> {
  const presign = await getR2UploadUrl(file.name, file.type || 'image/jpeg')
  if (!presign) return undefined

  const res = await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'image/jpeg' },
    body: file,
  })
  if (!res.ok) throw new Error('Failed to upload receipt to Cloudflare R2')
  return presign.publicUrl
}

export async function computeDashboard(
  transactions: { record: LedgerRecord; status: string }[],
) {
  const orders = await fetchMakerOrders()
  const oStats = orderStats(orders)
  let inventoryGrams = 0
  let pendingMemos = 0
  let memoExposureGrams = 0

  for (const t of transactions.filter((x) => x.status === 'confirmed')) {
    const w = t.record.weight ?? 0
    if (t.record.type === 'purchase') inventoryGrams += w
    if (t.record.type === 'sale') inventoryGrams -= w
    if (t.record.type === 'memo_out') {
      pendingMemos += 1
      memoExposureGrams += w
      inventoryGrams -= w
    }
    if (t.record.type === 'memo_return') {
      pendingMemos = Math.max(0, pendingMemos - 1)
      memoExposureGrams = Math.max(0, memoExposureGrams - w)
      inventoryGrams += w
    }
  }

  return {
    inventoryGrams: Math.round(inventoryGrams * 100) / 100,
    pendingMemos,
    memoExposureGrams: Math.round(memoExposureGrams * 100) / 100,
    recentCount: transactions.length,
    pendingMakerOrders: oStats.pendingCount,
    overdueMakerOrders: oStats.overdueCount,
    gramsWithMakers: oStats.gramsWithMakers,
  }
}
