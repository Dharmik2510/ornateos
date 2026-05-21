import { NavLink, Outlet } from 'react-router-dom'
import { Gem, LayoutDashboard, Mic } from 'lucide-react'

const links = [
  { to: '/', label: 'Input', icon: Mic },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gold-500/20 bg-ink-800/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
              <Gem className="size-5 text-ink-900" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-gold-100">
                OrnateOS
              </h1>
              <p className="text-xs text-stone-400">
                Voice → Ledger for wholesale gold
              </p>
            </div>
          </div>
          <nav className="flex gap-1 rounded-xl bg-ink-700 p-1">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-gold-500/20 text-gold-100'
                      : 'text-stone-400 hover:text-stone-200'
                  }`
                }
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
