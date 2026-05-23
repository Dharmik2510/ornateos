export type BusinessType = 'wholesaler' | 'retailer' | 'manufacturer'

export interface Business {
  id: string
  name: string
  business_type: BusinessType
  city: string | null
  phone: string | null
  created_at: string
  updated_at?: string
}

export interface Profile {
  id: string
  business_id: string
  full_name: string | null
  role: 'owner' | 'staff'
  created_at: string
}

export interface AuthUser {
  id: string
  email: string
}

export interface SessionState {
  user: AuthUser
  profile: Profile
  business: Business
}
