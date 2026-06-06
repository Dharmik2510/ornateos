import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Gem, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { ScrollReveal } from '../../components/motion/ScrollReveal'

export function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { needsOnboarding } = await signUp(email, password, fullName)
      navigate(needsOnboarding ? '/onboarding' : '/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing-bg min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="landing-grain" aria-hidden />

      <ScrollReveal variant="scale" className="w-full max-w-md relative z-10">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8 group">
          <div className="size-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-900/30 group-hover:scale-105 transition-transform">
            <Gem className="size-5 text-ink-900" />
          </div>
          <span className="text-xl font-semibold text-gold-100">OrnateOS</span>
        </Link>

        <div className="glass-card glass-card-hover p-8">
          <h1 className="font-display text-3xl font-semibold text-stone-50">Create your account</h1>
          <p className="text-sm text-stone-400 mt-1">
            One workspace per jewellery business — yours stays private
          </p>

          <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
            <ScrollReveal variant="up" delay={80}>
              <Input
                id="name"
                label="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </ScrollReveal>
            <ScrollReveal variant="up" delay={140}>
              <Input
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </ScrollReveal>
            <ScrollReveal variant="up" delay={200}>
              <Input
                id="password"
                label="Password"
                type="password"
                minLength={6}
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
            <ScrollReveal variant="up" delay={260}>
              <Button type="submit" className="w-full" loading={loading}>
                {loading ? 'Creating…' : 'Continue'}
              </Button>
            </ScrollReveal>
          </form>

          <p className="text-center text-sm text-stone-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-gold-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </ScrollReveal>
    </div>
  )
}
