import type { Business, BusinessType, Profile, SessionState } from '../types/auth'
import { setActiveBusinessId } from './tenant'
import { isSupabaseConfigured, supabase } from './supabase'

const LOCAL_SESSION_KEY = 'ornateos_session'
const LOCAL_USERS_KEY = 'ornateos_users'

interface LocalUserRecord {
  id: string
  email: string
  password: string
  profile: Profile
  business: Business
}

function loadLocalUsers(): LocalUserRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY)
    return raw ? (JSON.parse(raw) as LocalUserRecord[]) : []
  } catch {
    return []
  }
}

function saveLocalUsers(users: LocalUserRecord[]) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))
}

function persistLocalSession(session: SessionState) {
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session))
  setActiveBusinessId(session.business.id)
}

export function clearLocalSession() {
  localStorage.removeItem(LOCAL_SESSION_KEY)
  setActiveBusinessId(null)
}

export async function getSession(): Promise<SessionState | null> {
  if (supabase && isSupabaseConfigured) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null

    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()

    if (pErr || !profile) return null

    const { data: business, error: bErr } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', profile.business_id)
      .single()

    if (bErr || !business) return null

    const state: SessionState = {
      user: { id: session.user.id, email: session.user.email ?? '' },
      profile: profile as Profile,
      business: business as Business,
    }
    setActiveBusinessId(state.business.id)
    return state
  }

  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY)
    if (!raw) return null
    const state = JSON.parse(raw) as SessionState
    setActiveBusinessId(state.business.id)
    return state
  } catch {
    return null
  }
}

export async function signIn(email: string, password: string): Promise<SessionState> {
  const normalized = email.trim().toLowerCase()

  if (supabase && isSupabaseConfigured) {
    const { error } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    })
    if (error) throw error
    const session = await getSession()
    if (!session) throw new Error('Profile not found. Complete onboarding.')
    return session
  }

  const user = loadLocalUsers().find(
    (u) => u.email === normalized && u.password === password,
  )
  if (!user) throw new Error('Invalid email or password')

  const state: SessionState = {
    user: { id: user.id, email: user.email },
    profile: user.profile,
    business: user.business,
  }
  persistLocalSession(state)
  return state
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
): Promise<{ needsOnboarding: boolean; session: SessionState | null }> {
  const normalized = email.trim().toLowerCase()

  if (supabase && isSupabaseConfigured) {
    const { error } = await supabase.auth.signUp({
      email: normalized,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
    const session = await getSession()
    if (session?.business?.name) {
      return { needsOnboarding: false, session }
    }
    return { needsOnboarding: true, session }
  }

  if (loadLocalUsers().some((u) => u.email === normalized)) {
    throw new Error('Account already exists')
  }

  const userId = crypto.randomUUID()
  const state: SessionState = {
    user: { id: userId, email: normalized },
    profile: {
      id: userId,
      business_id: '',
      full_name: fullName,
      role: 'owner',
      created_at: new Date().toISOString(),
    },
    business: {
      id: '',
      name: '',
      business_type: 'wholesaler',
      city: null,
      phone: null,
      created_at: new Date().toISOString(),
    },
  }
  saveLocalUsers([
    ...loadLocalUsers(),
    {
      id: userId,
      email: normalized,
      password,
      profile: state.profile,
      business: state.business,
    },
  ])
  persistLocalSession(state)
  return { needsOnboarding: true, session: state }
}

export async function createBusiness(input: {
  name: string
  business_type: BusinessType
  city?: string
  phone?: string
  full_name?: string
}): Promise<SessionState> {
  if (supabase && isSupabaseConfigured) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not signed in')

    const { data: business, error: bErr } = await supabase
      .from('businesses')
      .insert({
        name: input.name.trim(),
        business_type: input.business_type,
        city: input.city ?? null,
        phone: input.phone ?? null,
      })
      .select()
      .single()
    if (bErr) throw bErr

    const { error: pErr } = await supabase.from('profiles').upsert({
      id: user.id,
      business_id: business.id,
      full_name: input.full_name ?? user.user_metadata?.full_name ?? null,
      role: 'owner',
    })
    if (pErr) throw pErr

    const session = await getSession()
    if (!session) throw new Error('Failed to load session')
    return session
  }

  const raw = localStorage.getItem(LOCAL_SESSION_KEY)
  if (!raw) throw new Error('Not signed in')
  const partial = JSON.parse(raw) as SessionState
  const businessId = crypto.randomUUID()
  const business: Business = {
    id: businessId,
    name: input.name.trim(),
    business_type: input.business_type,
    city: input.city ?? null,
    phone: input.phone ?? null,
    created_at: new Date().toISOString(),
  }
  const profile: Profile = {
    ...partial.profile,
    business_id: businessId,
    full_name: input.full_name ?? partial.profile.full_name,
  }
  const state: SessionState = {
    user: partial.user,
    profile,
    business,
  }

  const users = loadLocalUsers().map((u) =>
    u.id === partial.user.id
      ? { ...u, profile, business, password: u.password }
      : u,
  )
  saveLocalUsers(users)
  persistLocalSession(state)
  return state
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut()
  clearLocalSession()
}

export async function updateBusiness(
  businessId: string,
  updates: Partial<Pick<Business, 'name' | 'business_type' | 'city' | 'phone'>>,
): Promise<Business> {
  if (supabase) {
    const { data, error } = await supabase
      .from('businesses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', businessId)
      .select()
      .single()
    if (error) throw error
    return data as Business
  }

  const session = await getSession()
  if (!session) throw new Error('Not signed in')
  const business = { ...session.business, ...updates }
  const users = loadLocalUsers().map((u) =>
    u.id === session.user.id ? { ...u, business } : u,
  )
  saveLocalUsers(users)
  const next = { ...session, business }
  persistLocalSession(next)
  return business
}
