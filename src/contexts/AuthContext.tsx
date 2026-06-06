import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Business, SessionState } from '../types/auth'
import * as authApi from '../lib/auth'
import { seedDemoDataIfEmpty } from '../lib/orders'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

interface AuthContextValue {
  session: SessionState | null
  loading: boolean
  isConfigured: boolean
  needsOnboarding: boolean
  business: Business | null
  refresh: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ needsOnboarding: boolean }>
  signOut: () => Promise<void>
  completeOnboarding: (input: {
    name: string
    business_type: Business['business_type']
    city?: string
    phone?: string
  }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const s = await authApi.getSession()
    setSession(s)
  }, [])

  useEffect(() => {
    let active = true
    void (async () => {
      await refresh()
      if (active) setLoading(false)
    })()

    if (!isSupabaseConfigured || !supabase) return () => {
      active = false
    }

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void refresh()
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [refresh])

  const needsOnboarding = Boolean(
    session &&
      (!session.business?.id ||
        !session.business?.name?.trim()),
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      isConfigured: isSupabaseConfigured,
      needsOnboarding,
      business: session?.business ?? null,
      refresh,
      async signIn(email, password) {
        const s = await authApi.signIn(email, password)
        setSession(s)
      },
      async signUp(email, password, fullName) {
        const r = await authApi.signUp(email, password, fullName)
        if (r.session) setSession(r.session)
        return { needsOnboarding: r.needsOnboarding }
      },
      async signOut() {
        await authApi.signOut()
        setSession(null)
      },
      async completeOnboarding(input) {
        const s = await authApi.createBusiness({
          ...input,
          full_name: session?.profile.full_name ?? undefined,
        })
        setSession(s)
        seedDemoDataIfEmpty(s.business.id)
      },
    }),
    [session, loading, needsOnboarding, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Co-located with the provider by design; the hook is the only sanctioned way
// to read auth state. Fast-refresh's component-only rule doesn't apply here.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
