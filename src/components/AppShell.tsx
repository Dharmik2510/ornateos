import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Gem,
  LayoutDashboard,
  Mic,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const mainNav = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/record', label: 'Record', icon: Mic },
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/makers', label: 'Makers', icon: Users },
]

export function AppShell() {
  const { session, signOut, business } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex bg-ink-950">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-white/5 bg-ink-900/80 backdrop-blur-xl shrink-0">
        <div className="p-5 border-b border-ink-700">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <Gem className="size-5 text-ink-900" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gold-100 truncate">OrnateOS</p>
              <p className="text-xs text-stone-500 truncate">{business?.name}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {mainNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 min-h-[44px] ${
                  isActive
                    ? 'bg-gold-500/15 text-gold-100 shadow-inner shadow-gold-900/20'
                    : 'text-stone-400 hover:bg-ink-700/80 hover:text-stone-200 hover:translate-x-0.5'
                }`
              }
            >
              <Icon className="size-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-ink-700 space-y-1">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium min-h-[44px] ${
                isActive ? 'bg-ink-700 text-stone-100' : 'text-stone-400 hover:bg-ink-700'
              }`
            }
          >
            <Settings className="size-5" />
            Settings
          </NavLink>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-400 hover:bg-ink-700 hover:text-red-300 min-h-[44px]"
          >
            <LogOut className="size-5" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 border-b border-ink-700 bg-ink-800/95 backdrop-blur px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Gem className="size-6 text-gold-400 shrink-0" />
            <span className="font-semibold text-gold-100 truncate">{business?.name}</span>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1 text-sm text-stone-400 px-2 py-1 rounded-lg hover:bg-ink-700 min-h-[44px]"
            aria-expanded={menuOpen}
          >
            {session?.profile.full_name?.split(' ')[0] ?? 'Account'}
            <ChevronDown className={`size-4 transition ${menuOpen ? 'rotate-180' : ''}`} />
          </button>
        </header>
        {menuOpen && (
          <div className="lg:hidden border-b border-ink-700 bg-ink-800 px-4 py-2 space-y-1">
            <NavLink
              to="/settings"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm text-stone-300"
            >
              Settings
            </NavLink>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="block py-2 text-sm text-red-400"
            >
              Sign out
            </button>
          </div>
        )}

        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 lg:py-8 pb-24 lg:pb-8">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 border-t border-ink-700 bg-ink-800/95 backdrop-blur safe-pb">
          <div className="flex justify-around items-stretch h-16">
            {mainNav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-medium min-w-0 px-1 ${
                    isActive ? 'text-gold-400' : 'text-stone-500'
                  }`
                }
              >
                <Icon className="size-5" />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
