import { Check, Mic, Sparkles } from 'lucide-react'

export function HeroMockup() {
  return (
    <div className="relative mx-auto max-w-sm lg:max-w-md animate-float-slow">
      <div className="absolute -inset-4 bg-gold-500/20 blur-3xl rounded-full" aria-hidden />
      <div className="relative rounded-[2rem] border border-gold-500/25 bg-ink-800/90 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-600 flex items-center justify-between">
          <span className="text-xs font-medium text-gold-400">OrnateOS · Live</span>
          <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse-soft" />
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-3 items-start">
            <div className="size-10 rounded-full bg-gold-500/20 flex items-center justify-center shrink-0">
              <Mic className="size-5 text-gold-400" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-ink-700 px-4 py-3 text-sm text-stone-300 max-w-[85%]">
              Aaje 10 gram gold XYZ ne memo aapyo
            </div>
          </div>
          <div className="flex gap-2 items-center text-xs text-gold-400/80 px-1">
            <Sparkles className="size-3.5" />
            AI parsing…
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 space-y-2 animate-slide-up">
            <p className="text-xs uppercase tracking-wider text-emerald-400/90">Detected</p>
            <p className="font-semibold text-stone-100">Memo to XYZ (10g gold)</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-stone-400">
              <span>Type: memo_out</span>
              <span>Party: XYZ</span>
            </div>
            <button
              type="button"
              className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium"
            >
              <Check className="size-4" />
              Confirm → Ledger updated
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
