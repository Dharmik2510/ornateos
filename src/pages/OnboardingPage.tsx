import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import type { BusinessType } from '../types/auth'

const TYPES: { value: BusinessType; label: string }[] = [
  { value: 'wholesaler', label: 'Wholesaler' },
  { value: 'retailer', label: 'Retailer' },
  { value: 'manufacturer', label: 'Manufacturer / Karigar shop' },
]

export function OnboardingPage() {
  const { completeOnboarding, session } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [type, setType] = useState<BusinessType>('wholesaler')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      await completeOnboarding({
        name: name.trim(),
        business_type: type,
        city: city || undefined,
        phone: phone || undefined,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing-bg min-h-screen flex items-center justify-center px-4 py-12">
      <div className="landing-grain" aria-hidden />
      <div className="w-full max-w-lg glass-card p-8 relative z-10">
        <div className="size-12 rounded-xl bg-gold-500/15 flex items-center justify-center mb-6">
          <Building2 className="size-6 text-gold-400" />
        </div>
        <h1 className="font-display text-3xl font-semibold text-gold-50">Set up your business</h1>
        <p className="text-sm text-stone-400 mt-2">
          Hi{session?.profile.full_name ? ` ${session.profile.full_name}` : ''} — tell us
          about your jewellery business. This creates your private workspace.
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-5">
          <Input
            id="biz"
            label="Business name"
            placeholder="e.g. Shree Gold Wholesalers"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="space-y-2">
            <span className="text-sm font-medium text-stone-300">Business type</span>
            <div className="grid gap-2">
              {TYPES.map((t) => (
                <label
                  key={t.value}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer min-h-[44px] ${
                    type === t.value
                      ? 'border-gold-500/50 bg-gold-500/10'
                      : 'border-ink-600 hover:border-ink-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={t.value}
                    checked={type === t.value}
                    onChange={() => setType(t.value)}
                    className="accent-amber-500"
                  />
                  <span className="text-sm text-stone-200">{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              id="city"
              label="City (optional)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <Input
              id="phone"
              label="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating workspace…' : 'Open my dashboard'}
          </Button>
        </form>
      </div>
    </div>
  )
}
