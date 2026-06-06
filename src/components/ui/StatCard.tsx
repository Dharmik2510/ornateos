import type { LucideIcon } from 'lucide-react'
import { ScrollReveal } from '../motion/ScrollReveal'
import { AnimatedCounter } from '../motion/AnimatedCounter'

export type StatAccent = 'gold' | 'violet' | 'blue' | 'amber' | 'emerald' | 'red'

const accentClass: Record<StatAccent, string> = {
  gold: 'bg-gold-500/20 text-gold-300',
  violet: 'bg-violet-500/20 text-violet-300',
  blue: 'bg-blue-500/20 text-blue-300',
  amber: 'bg-amber-500/20 text-amber-300',
  emerald: 'bg-emerald-500/20 text-emerald-300',
  red: 'bg-red-500/20 text-red-300',
}

/**
 * Unified stat tile used across the dashboard, orders, and maker pages.
 *
 * Pass a plain `value` string, or `count` + optional `unit`/`suffix` to get an
 * animated number that tweens up when it scrolls into view. Wrap-in-reveal and
 * staggering are built in via the `delay` prop.
 */
export function StatCard({
  label,
  value,
  count,
  unit,
  suffix,
  sub,
  icon: Icon,
  accent = 'gold',
  delay = 0,
}: {
  label: string
  value?: string
  count?: number
  unit?: string
  suffix?: string
  sub?: string
  icon: LucideIcon
  accent?: StatAccent
  delay?: number
}) {
  return (
    <ScrollReveal variant="up" delay={delay}>
      <div className="glass-card glass-card-hover p-5 space-y-2 group h-full">
        <div
          className={`inline-flex p-2 rounded-lg ${accentClass[accent]} group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className="size-5" />
        </div>
        <p className="text-xs text-stone-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-stone-50">
          {count != null ? (
            <>
              <AnimatedCounter end={count} suffix={suffix ?? ''} />
              {unit ? <span className="text-base font-semibold text-stone-300"> {unit}</span> : null}
            </>
          ) : (
            value
          )}
        </p>
        {sub && <p className="text-xs text-stone-400">{sub}</p>}
      </div>
    </ScrollReveal>
  )
}
