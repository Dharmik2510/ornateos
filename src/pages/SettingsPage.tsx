import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { ScrollReveal } from '../components/motion/ScrollReveal'
import * as authApi from '../lib/auth'
import type { BusinessType } from '../types/auth'
import { isSupabaseConfigured as supabaseConfigured } from '../lib/supabase'

export function SettingsPage() {
  const { session, refresh, isConfigured } = useAuth()
  const business = session?.business
  const [name, setName] = useState(business?.name ?? '')
  const [type, setType] = useState<BusinessType>(business?.business_type ?? 'wholesaler')
  const [city, setCity] = useState(business?.city ?? '')
  const [phone, setPhone] = useState(business?.phone ?? '')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!business) return
    setLoading(true)
    try {
      await authApi.updateBusiness(business.id, {
        name: name.trim(),
        business_type: type,
        city: city || null,
        phone: phone || null,
      })
      await refresh()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your business profile and workspace."
      />

      <ScrollReveal variant="up" delay={0}>
        <form
          onSubmit={(e) => void handleSave(e)}
          className="max-w-lg space-y-5 rounded-2xl border border-ink-700 bg-ink-800 p-6"
        >
          <h2 className="font-medium text-stone-200">Business profile</h2>
          <Input label="Business name" value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-300" htmlFor="business-type">
              Type
            </label>
            <select
              id="business-type"
              value={type}
              onChange={(e) => setType(e.target.value as BusinessType)}
              className="w-full rounded-xl bg-ink-800 border border-ink-600 px-4 py-3 text-stone-100 min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/40 hover:border-stone-500"
            >
              <option value="wholesaler">Wholesaler</option>
              <option value="retailer">Retailer</option>
              <option value="manufacturer">Manufacturer</option>
            </select>
          </div>
          <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button type="submit" loading={loading} disabled={loading}>
            {loading ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
          </Button>
          {saved && (
            <p className="text-sm text-emerald-400 animate-slide-up" role="status">
              Changes saved
            </p>
          )}
        </form>
      </ScrollReveal>

      <ScrollReveal variant="up" delay={120}>
        <div className="mt-8 max-w-lg rounded-2xl border border-ink-700 bg-ink-800/50 p-6 space-y-2 text-sm">
          <h2 className="font-medium text-stone-300">Account</h2>
          <p className="text-stone-500">Signed in as {session?.user.email}</p>
          <p className="text-stone-500">Role: {session?.profile.role}</p>
          <p className="text-stone-600 text-xs pt-2">
            Backend: {isConfigured && supabaseConfigured ? 'Supabase (multi-tenant RLS)' : 'Local demo storage'}
          </p>
        </div>
      </ScrollReveal>
    </div>
  )
}
