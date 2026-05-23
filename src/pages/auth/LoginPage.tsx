import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Gem } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export function LoginPage() {
  const { signIn, session, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!authLoading && session) {
    navigate('/dashboard', { replace: true })
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing-bg min-h-screen flex flex-col items-center justify-center px-4">
      <div className="landing-grain" aria-hidden />
      <Link to="/" className="flex items-center gap-2 mb-8">
        <div className="size-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
          <Gem className="size-5 text-ink-900" />
        </div>
        <span className="text-xl font-semibold text-gold-100">OrnateOS</span>
      </Link>

      <div className="w-full max-w-md glass-card p-8 relative z-10">
        <h1 className="font-display text-3xl font-semibold text-stone-50">Welcome back</h1>
        <p className="text-sm text-stone-400 mt-1">Sign in to your jewellery workspace</p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
          <Input
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 rounded-lg px-3 py-2">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-sm text-stone-500 mt-6">
          New here?{' '}
          <Link to="/signup" className="text-gold-400 hover:underline">
            Create account
          </Link>
        </p>
        <p className="text-center text-xs text-stone-600 mt-4">
          Demo: any email + password works without Supabase configured
        </p>
      </div>
    </div>
  )
}
