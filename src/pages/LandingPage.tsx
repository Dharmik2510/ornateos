import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Gem,
  Languages,
  Mic,
  Shield,
  Sparkles,
  Users,
  X,
  Check,
  Clock,
  Scale,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { HeroMockup } from '../components/landing/HeroMockup'
import { ScrollReveal } from '../components/motion/ScrollReveal'
import { AnimatedCounter } from '../components/motion/AnimatedCounter'
import { useScrolledPast } from '../hooks/useScrollReveal'

const differentiators = [
  {
    icon: Languages,
    title: 'Multilingual by design',
    desc: 'Not “English-only accounting.” Speak Gujarati, Hindi, or mix — the ledger understands how you actually talk.',
    highlight: 'Only voice-to-ledger built for Indian wholesale',
  },
  {
    icon: Scale,
    title: 'Gold, memos & grams',
    desc: 'Generic apps don’t know memo_out, karigars, or 10 gram gold. OrnateOS speaks jewellery natively.',
    highlight: 'Industry schema, not spreadsheets',
  },
  {
    icon: Users,
    title: 'Maker order intelligence',
    desc: 'Track who has your order, promised delivery dates, overdue work, and receive flow — per karigar.',
    highlight: 'Beyond basic inventory',
  },
  {
    icon: Shield,
    title: 'Private business workspace',
    desc: 'Each owner gets isolated data. Your memos, makers, and receipts never mix with another shop.',
    highlight: 'True multi-tenant SaaS',
  },
]

const compare = {
  bad: [
    'Voice notes lost in WhatsApp',
    'No structure for memos or gold weight',
    'Forgot which maker owes what',
    'Excel updated “when someone remembers”',
  ],
  good: [
    'Speak once → structured JSON ledger',
    'Memo exposure & inventory live',
    'Per-maker dashboard + due dates',
    'Confirm before anything is saved',
  ],
}

const steps = [
  { n: '01', title: 'Record', desc: 'Voice, receipt photo, or quick text' },
  { n: '02', title: 'Review', desc: 'AI shows what it understood — you confirm' },
  { n: '03', title: 'Run business', desc: 'Dashboard, orders, makers update instantly' },
]

export function LandingPage() {
  const headerScrolled = useScrolledPast(16)

  return (
    <div className="landing-bg min-h-screen text-stone-100 relative overflow-x-hidden">
      <div className="landing-grain" aria-hidden />

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          headerScrolled
            ? 'border-b border-white/10 bg-ink-950/80 backdrop-blur-xl shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="size-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-900/30 group-hover:scale-105 transition-transform">
              <Gem className="size-5 text-ink-900" />
            </div>
            <span className="font-semibold text-gold-100 text-lg">OrnateOS</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="text-sm text-stone-300 hover:text-white px-3 py-2 min-h-[44px] flex items-center transition-colors"
            >
              Log in
            </Link>
            <Link to="/signup">
              <Button className="!py-2.5 !px-5 shadow-lg shadow-gold-900/25">
                Start free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-4 pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <ScrollReveal variant="fade" delay={0}>
              <p className="inline-flex items-center gap-2 text-sm font-medium text-gold-400/90 uppercase tracking-wider mb-6 px-3 py-1.5 rounded-full border border-gold-500/25 bg-gold-500/10">
                <Sparkles className="size-4" />
                Built for jewellery wholesale
              </p>
            </ScrollReveal>
            <ScrollReveal variant="up" delay={80}>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight">
                <span className="text-stone-100">Your voice.</span>
                <br />
                <span className="text-gradient-gold">Their ledger.</span>
              </h1>
            </ScrollReveal>
            <ScrollReveal variant="up" delay={160}>
              <p className="text-lg text-stone-400 mt-6 max-w-lg leading-relaxed">
                The first multilingual{' '}
                <strong className="text-stone-200 font-medium">voice → ledger</strong> system
                for Indian gold businesses — memos, makers, inventory, one confirm away.
              </p>
            </ScrollReveal>
            <ScrollReveal variant="up" delay={240}>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link to="/signup">
                  <Button className="!px-8 !py-3 text-base">
                    Create your workspace
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" className="!py-3">
                    See demo inside
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          </div>
          <ScrollReveal variant="right" delay={200}>
            <HeroMockup />
          </ScrollReveal>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/5 bg-ink-900/50">
        <div className="max-w-6xl mx-auto px-4 py-14 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { end: 3, suffix: '+', label: 'Input modes', sub: 'Voice · Photo · Text' },
            { end: 8, suffix: '+', label: 'Item types', sub: 'Ring · Necklace · …' },
            { end: 100, suffix: '%', label: 'Human confirm', sub: 'Before ledger writes' },
            { end: 1, suffix: '', label: 'Workspace', sub: 'Per business owner' },
          ].map((s, i) => (
            <ScrollReveal key={s.label} variant="up" delay={i * 80}>
              <p className="text-3xl sm:text-4xl font-bold text-gold-300">
                <AnimatedCounter end={s.end} suffix={s.suffix} />
              </p>
              <p className="text-sm font-medium text-stone-200 mt-1">{s.label}</p>
              <p className="text-xs text-stone-500 mt-0.5">{s.sub}</p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* What stands out */}
      <section className="max-w-6xl mx-auto px-4 py-20 lg:py-28">
        <ScrollReveal variant="up">
          <p className="text-sm font-medium text-gold-500 uppercase tracking-widest text-center">
            Why OrnateOS
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold text-center mt-3 text-stone-50">
            Not another generic accounting app
          </h2>
          <p className="text-stone-400 text-center max-w-2xl mx-auto mt-4">
            Built for how jewellery wholesalers actually work — WhatsApp voice, handwritten
            chits, and karigar promises.
          </p>
        </ScrollReveal>

        <div className="mt-14 grid sm:grid-cols-2 gap-5 stagger-children">
          {differentiators.map((item, i) => (
            <ScrollReveal key={item.title} variant="up" delay={i * 100}>
              <article className="glass-card glass-card-hover p-6 h-full group">
                <div className="flex items-start justify-between gap-4">
                  <div className="size-12 rounded-xl bg-gold-500/15 flex items-center justify-center group-hover:bg-gold-500/25 transition-colors">
                    <item.icon className="size-6 text-gold-400" strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-gold-500/80 font-semibold text-right max-w-[120px]">
                    {item.highlight}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-stone-100 mt-5">{item.title}</h3>
                <p className="text-sm text-stone-400 mt-2 leading-relaxed">{item.desc}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="max-w-6xl mx-auto px-4 pb-20 lg:pb-28">
        <ScrollReveal variant="up">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-center text-stone-50">
            WhatsApp chaos vs. one live ledger
          </h2>
        </ScrollReveal>
        <ScrollReveal variant="scale" delay={120}>
          <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6 md:p-8">
              <p className="text-sm font-semibold text-red-300 flex items-center gap-2 mb-5">
                <X className="size-4" /> Without OrnateOS
              </p>
              <ul className="space-y-3">
                {compare.bad.map((t) => (
                  <li key={t} className="text-sm text-stone-400 flex gap-2">
                    <X className="size-4 text-red-400/60 shrink-0 mt-0.5" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl" aria-hidden />
              <p className="text-sm font-semibold text-emerald-300 flex items-center gap-2 mb-5">
                <Check className="size-4" /> With OrnateOS
              </p>
              <ul className="space-y-3 relative">
                {compare.good.map((t) => (
                  <li key={t} className="text-sm text-stone-300 flex gap-2">
                    <Check className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* How it works */}
      <section className="border-t border-white/5 bg-ink-900/40 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <ScrollReveal variant="up">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-center">
              Three steps. Zero new habits.
            </h2>
          </ScrollReveal>
          <div className="mt-14 grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <ScrollReveal key={step.n} variant="up" delay={i * 120}>
                <div className="text-center md:text-left">
                  <span className="text-5xl font-display font-bold text-gold-500/30">{step.n}</span>
                  <h3 className="text-xl font-semibold text-stone-100 mt-2">{step.title}</h3>
                  <p className="text-sm text-stone-400 mt-1">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <ScrollReveal variant="up">
          <div className="rounded-3xl border border-gold-500/20 bg-gradient-to-br from-gold-500/10 via-ink-800 to-ink-900 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 text-gold-400 mb-3">
                <Mic className="size-5" />
                <Clock className="size-5" />
              </div>
              <h2 className="font-display text-3xl font-semibold text-stone-50">
                Ready in under 2 minutes
              </h2>
              <p className="text-stone-400 mt-2 max-w-md">
                Sign up, name your business, record your first memo. Demo mode works instantly —
                no API keys required.
              </p>
            </div>
            <Link to="/signup" className="shrink-0">
              <Button className="!px-10 !py-4 text-base animate-shimmer bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600">
                Start your workspace
                <ArrowRight className="size-5" />
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <footer className="border-t border-white/5 py-10 text-center text-sm text-stone-600">
        <p>OrnateOS · Voice-to-ledger for jewellery businesses</p>
      </footer>
    </div>
  )
}
