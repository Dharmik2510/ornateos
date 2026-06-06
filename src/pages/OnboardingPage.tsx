import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Check, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ScrollReveal } from '../components/motion/ScrollReveal'
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
    <div className="landing-bg min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="landing-grain" aria-hidden />

      <ScrollReveal variant="scale" className="w-full max-w-lg relative z-10">
        <div className="glass-card glass-card-hover p-8">
          <div className="size-12 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mb-6 shadow-lg shadow-gold-900/30 animate-scale-in">
            <Building2 className="size-6 text-ink-900" />
          </div>
          <h1 className="font-display text-3xl font-semibold text-gold-50">Set up your business</h1>
          <p className="text-sm text-stone-400 mt-2">
            Hi{session?.profile.full_name ? ` ${session.profile.full_name}` : ''} — tell us
            about your jewellery business. This creates your private workspace.
          </p>

          <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-5">
            <ScrollReveal variant="up" delay={80}>
              <Input
                id="biz"
                label="Business name"
                placeholder="e.g. Shree Gold Wholesalers"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </ScrollReveal>

            <ScrollReveal variant="up" delay={160}>
              <div className="space-y-2">
                <span className="text-sm font-medium text-stone-300">Business type</span>
                <div className="grid gap-2">
                  {TYPES.map((t) => {
                    const selected = type === t.value
                    return (
                      <label
                        key={t.value}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer min-h-[44px] transition-all duration-200 ease-out ${
                          selected
                            ? 'border-gold-500/60 bg-gold-500/10 scale-[1.02] ring-2 ring-gold-500/30 shadow-lg shadow-gold-900/20'
                            : 'border-ink-600 hover:border-ink-500 hover:bg-ink-700/40'
                        }`}
                      >
                        <input
                          type="radio"
                          name="type"
                          value={t.value}
                          checked={selected}
                          onChange={() => setType(t.value)}
                          className="sr-only"
                        />
                        <span
                          className={`size-5 shrink-0 rounded-full border flex items-center justify-center transition-all duration-200 ${
                            selected
                              ? 'border-gold-400 bg-gradient-to-br from-gold-400 to-gold-600'
                              : 'border-ink-500'
                          }`}
                          aria-hidden
                        >
                          {selected && <Check className="size-3 text-ink-900" strokeWidth={3} />}
                        </span>
                        <span
                          className={`text-sm transition-colors ${
                            selected ? 'text-gold-50 font-medium' : 'text-stone-200'
                          }`}
                        >
                          {t.label}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="up" delay={240}>
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

            <ScrollReveal variant="up" delay={320}>
              <Button type="submit" className="w-full" loading={loading}>
                {loading ? 'Creating workspace…' : 'Open my dashboard'}
              </Button>
            </ScrollReveal>
          </form>
        </div>
      </ScrollReveal>
    </div>
  )
}
