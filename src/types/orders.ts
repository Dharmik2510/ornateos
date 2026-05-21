export const ITEM_CATEGORIES = [
  'ring',
  'necklace',
  'bracelet',
  'earrings',
  'bangle',
  'chain',
  'pendant',
  'set',
  'other',
] as const

export type ItemCategory = (typeof ITEM_CATEGORIES)[number]

export type WeightUnit = 'gram' | 'kilo'

export type OrderStatus = 'pending' | 'received' | 'cancelled'

export interface Maker {
  id: string
  name: string
  phone: string | null
  notes: string | null
  created_at: string
}

export interface MakerOrder {
  id: string
  maker_id: string
  maker_name: string
  item_category: ItemCategory
  weight_ordered: number
  unit: WeightUnit
  status: OrderStatus
  ordered_at: string
  promised_at: string | null
  received_at: string | null
  weight_received: number | null
  notes: string | null
  created_at: string
}

export interface PlaceOrderInput {
  maker_id?: string
  maker_name: string
  item_category: ItemCategory
  weight_ordered: number
  unit: WeightUnit
  ordered_at?: string
  promised_at?: string | null
  notes?: string | null
}

export interface ReceiveOrderInput {
  order_id: string
  weight_received: number
  unit?: WeightUnit
  received_at?: string
  notes?: string | null
}
