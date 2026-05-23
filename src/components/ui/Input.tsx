import type { InputHTMLAttributes } from 'react'

export function Input({
  label,
  error,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-stone-300" htmlFor={props.id}>
          {label}
        </label>
      )}
      <input
        className={`w-full rounded-xl bg-ink-800 border border-ink-600 px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-gold-500/40 min-h-[44px] ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
