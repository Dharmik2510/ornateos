import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Gem } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

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
    <div className="landing-bg min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="landing-grain" aria-hidden />
      <Link to="/" className="flex items-center gap-2 mb-8">
        <div className="size-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
          <Gem className="size-5 text-ink-900" />
        </div>
        <span className="text-xl font-semibold text-gold-100">OrnateOS</span>
      </Link>

      <div className="w-full max-w-md glass-card p-8 relative z-10">
        <h1 className="font-display text-3xl font-semibold text-stone-50">Create your account</h1>
        <p className="text-sm text-stone-400 mt-1">
          One workspace per jewellery business — yours stays private
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
          <Input
            id="name"
            label="Your name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="password"
            label="Password"
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 rounded-lg px-3 py-2">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating…' : 'Continue'}
          </Button>
        </form>

        <p className="text-center text-sm text-stone-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-gold-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
