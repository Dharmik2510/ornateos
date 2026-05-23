import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, needsOnboarding } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-900">
        <div className="text-center space-y-3">
          <div className="size-10 border-2 border-gold-500/30 border-t-gold-400 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-stone-500">Loading your workspace…</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}
