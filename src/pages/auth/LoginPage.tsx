import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Gem, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { ScrollReveal } from '../../components/motion/ScrollReveal'

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
    <div className="landing-bg min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="landing-grain" aria-hidden />

      <ScrollReveal variant="scale" className="w-full max-w-md relative z-10">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8 group">
          <div className="size-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-900/30 group-hover:scale-105 transition-transform">
            <Gem className="size-5 text-ink-900" />
          </div>
          <span className="text-xl font-semibold text-gold-100">OrnateOS</span>
        </Link>

        <div className="glass-card glass-card-hover p-8">
          <h1 className="font-display text-3xl font-semibold text-stone-50">Welcome back</h1>
          <p className="text-sm text-stone-400 mt-1">Sign in to your jewellery workspace</p>

          <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
            <ScrollReveal variant="up" delay={80}>
              <Input
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </ScrollReveal>
            <ScrollReveal variant="up" delay={160}>
              <Input
                id="password"
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </ScrollReveal>
            {error && (
              <div
                role="alert"
                className="animate-slide-up flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-950/30 px-3.5 py-3 text-sm text-red-300"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-400" aria-hidden />
                <span>{error}</span>
              </div>
            )}
            <ScrollReveal variant="up" delay={240}>
              <Button type="submit" className="w-full" loading={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </ScrollReveal>
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
      </ScrollReveal>
    </div>
  )
}
