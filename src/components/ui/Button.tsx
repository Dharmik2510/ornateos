import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-gold-500 to-gold-600 text-ink-900 hover:opacity-95 shadow-lg shadow-gold-900/20',
  secondary:
    'bg-ink-700 text-stone-100 border border-ink-600 hover:bg-ink-600',
  ghost: 'text-stone-300 hover:bg-ink-700 hover:text-stone-100',
  danger: 'bg-red-600/90 text-white hover:bg-red-600',
  success: 'bg-emerald-600 text-white hover:bg-emerald-500',
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:pointer-events-none min-h-[44px] ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
