import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Target, CheckSquare, Sword, ShoppingBag, Gift, LogOut, Zap, Flame, Dumbbell, Trophy } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/lib/store'
import { useStreak } from '@/hooks/useStreak'
import { cn, formatPoints } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/habits',      icon: CheckSquare,     label: 'Habits'      },
  { to: '/goals',       icon: Target,          label: 'Goals'       },
  { to: '/dragon',      icon: Sword,           label: 'Arena'       },
  { to: '/shop',        icon: ShoppingBag,     label: 'Shop'        },
  { to: '/rewards',     icon: Gift,            label: 'Rewards'     },
  { to: '/gym',         icon: Dumbbell,        label: 'Gym'         },
  { to: '/leaderboard', icon: Trophy,          label: 'Leaderboard' },
]

export default function Layout() {
  const { signOut } = useAuth()
  const { profile } = useAuthStore()
  const { currentStreak } = useStreak()
  const navigate = useNavigate()
  const location = useLocation()

  // Pages that should fill all available space with no padding/max-width wrapper
  const isFullBleed = ['/gym'].some(p => location.pathname.startsWith(p))

  const energyCurrent = profile?.energy_current ?? 0
  // Visual cap for the energy bar: 100E = full bar
  const energyBarPct = Math.min(100, Math.round((energyCurrent / 100) * 100))

  return (
    <div className="flex min-h-screen bg-[var(--surface-0)]">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-60 flex-shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface-1)]">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #5548f5, #8b85ff)' }}>
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-display font-semibold text-lg tracking-wide text-[#dddaff]">PrimeOS</span>
          </div>
        </div>

        {/* Profile snippet */}
        <div className="px-4 py-3 border-b border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#dddaff] truncate max-w-[120px]">
                {profile?.username ?? profile?.email?.split('@')[0] ?? 'Warrior'}
              </p>
              <p className="text-xs text-[#6c63ff] font-mono">Lv.{profile?.level ?? 1}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <Zap size={11} className="text-[#ffd933]" />
                <p className="text-sm font-mono font-medium text-[#ffd933]">{formatPoints(profile?.total_points ?? 0)}</p>
              </div>
              <p className="text-xs text-orange-400">{currentStreak > 0 ? `🔥 ${currentStreak}d` : '—'}</p>
            </div>
          </div>

          {/* Energy bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-1 text-[#8b85ff]">
                <Flame size={10} />
                <span className="font-medium">Energy</span>
              </div>
              <span className="font-mono text-[#8b85ff]">{energyCurrent}E</span>
            </div>
            <div className="h-1.5 rounded-full bg-[rgba(139,133,255,0.12)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${energyBarPct}%`,
                  background: 'linear-gradient(90deg, #5548f5, #8b85ff)',
                }}
              />
            </div>
            {energyCurrent > 0 && (
              <p className="text-[10px] text-[#555] mt-0.5 font-mono">
                {Math.floor(energyCurrent / 4)}P convertible  •  {energyCurrent * 10} arena DMG
              </p>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
                isActive
                  ? 'bg-[rgba(108,99,255,0.15)] text-[#b9b5ff] border border-[rgba(108,99,255,0.25)]'
                  : 'text-[#888] hover:bg-[rgba(108,99,255,0.08)] hover:text-[#b9b5ff]'
              )}
            >
              <Icon size={16} />
              <span className="font-body">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-3 border-t border-[var(--border)]">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#555] hover:text-red-400 hover:bg-[rgba(255,32,32,0.08)] transition-all duration-150"
          >
            <LogOut size={16} />
            <span className="font-body">Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className={`flex-1 ${isFullBleed ? 'overflow-hidden flex flex-col' : 'overflow-auto pb-24 md:pb-0'}`}>
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[var(--surface-1)] border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #5548f5, #8b85ff)' }}>
              <Zap size={13} className="text-white" />
            </div>
            <span className="font-display font-semibold text-base tracking-wide text-[#dddaff]">PrimeOS</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Points */}
            <div className="flex items-center gap-1">
              <Zap size={11} className="text-[#ffd933]" />
              <span className="text-sm font-mono font-medium text-[#ffd933]">{formatPoints(profile?.total_points ?? 0)}</span>
            </div>
            {/* Energy */}
            {energyCurrent > 0 && (
              <div className="flex items-center gap-1">
                <Flame size={11} className="text-[#8b85ff]" />
                <span className="text-sm font-mono font-medium text-[#8b85ff]">{energyCurrent}E</span>
              </div>
            )}
            {currentStreak > 0 && (
              <span className="text-xs text-orange-400">🔥 {currentStreak}d</span>
            )}
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg text-[#555] hover:text-red-400 hover:bg-[rgba(255,32,32,0.08)] transition-all"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {isFullBleed ? (
          <div className="flex-1 overflow-hidden min-h-0">
            <Outlet />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-6">
            <Outlet />
          </div>
        )}
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--surface-1)] border-t border-[var(--border)] flex items-stretch"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-all duration-150',
              isActive ? 'text-[#b9b5ff]' : 'text-[#555]'
            )}
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  'p-1.5 rounded-xl transition-all',
                  isActive ? 'bg-[rgba(108,99,255,0.2)]' : ''
                )}>
                  <Icon size={18} />
                </div>
                <span className="font-body leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
