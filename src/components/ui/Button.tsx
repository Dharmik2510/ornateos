import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-gold-500 to-gold-600 text-ink-900 hover:from-gold-400 hover:to-gold-500 shadow-lg shadow-gold-900/25 hover:shadow-gold-800/30 hover:-translate-y-0.5',
  secondary:
    'bg-ink-700/80 text-stone-100 border border-ink-600 hover:bg-ink-600 hover:border-stone-500',
  ghost: 'text-stone-300 hover:bg-ink-700/80 hover:text-stone-100',
  danger: 'bg-red-600/90 text-white hover:bg-red-600',
  success: 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20',
}

export function Button({
  variant = 'primary',
  className = '',
  loading = false,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  loading?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ease-out disabled:opacity-50 disabled:pointer-events-none disabled:transform-none min-h-[44px] cursor-pointer ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}
