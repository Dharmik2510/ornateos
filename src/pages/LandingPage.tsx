import { Link } from 'react-router-dom'
import { Gem, Mic, Users, Shield, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/Button'

const features = [
  {
    icon: Mic,
    title: 'Speak in any language',
    desc: 'Gujarati, Hindi, English mix — voice notes become structured ledger entries.',
  },
  {
    icon: Users,
    title: 'Track every maker',
    desc: 'Know who has your gold, what they are making, and when they promised delivery.',
  },
  {
    icon: Shield,
    title: 'Your business, isolated',
    desc: 'Each jewellery owner gets a private workspace. Your data stays yours.',
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-ink-900 text-stone-100">
      <header className="border-b border-ink-700/80">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <Gem className="size-4 text-ink-900" />
            </div>
            <span className="font-semibold text-gold-100">OrnateOS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-stone-300 hover:text-white px-3 py-2 min-h-[44px] flex items-center"
            >
              Log in
            </Link>
            <Link to="/signup">
              <Button className="!py-2 !px-4">Start free</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-16 lg:py-24 text-center">
        <p className="text-sm font-medium text-gold-400/90 uppercase tracking-wider mb-4">
          Built for Indian jewellery wholesale
        </p>
        <h1 className="text-4xl lg:text-5xl font-bold text-gold-50 tracking-tight max-w-3xl mx-auto leading-tight">
          Voice notes → real business records
        </h1>
        <p className="text-lg text-stone-400 mt-6 max-w-2xl mx-auto">
          Stop losing memos, maker orders, and inventory in WhatsApp. OrnateOS turns how you
          already work into a live ledger — per business, per owner.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/signup">
            <Button className="!px-8">
              Create your workspace
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary">I have an account</Button>
          </Link>
        </div>
        <p className="text-xs text-stone-600 mt-6">
          Works in demo mode without setup · Supabase + Cloudflare for production
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-24 grid md:grid-cols-3 gap-6">
        {features.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-2xl border border-ink-700 bg-ink-800/60 p-6 text-left"
          >
            <Icon className="size-8 text-gold-400 mb-4" strokeWidth={1.5} />
            <h3 className="font-semibold text-stone-100">{title}</h3>
            <p className="text-sm text-stone-400 mt-2">{desc}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
