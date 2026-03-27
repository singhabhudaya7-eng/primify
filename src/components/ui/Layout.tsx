import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Target, CheckSquare, Sword, ShoppingBag, Gift, LogOut, Zap } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/lib/store'
import { useStreak } from '@/hooks/useStreak'
import { cn, formatPoints } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/habits', icon: CheckSquare, label: 'Habits' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/dragon', icon: Sword, label: 'Dragon Arena' },
  { to: '/shop', icon: ShoppingBag, label: 'Weapon Shop' },
  { to: '/rewards', icon: Gift, label: 'Rewards' },
]

export default function Layout() {
  const { signOut } = useAuth()
  const { profile } = useAuthStore()
  const { currentStreak } = useStreak()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen bg-[var(--surface-0)]">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-[var(--border)] bg-[var(--surface-1)]">
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
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#dddaff] truncate max-w-[120px]">
                {profile?.username ?? profile?.email?.split('@')[0] ?? 'Warrior'}
              </p>
              <p className="text-xs text-[#6c63ff] font-mono">Lv.{profile?.level ?? 1}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono font-medium text-[#ffd933]">{formatPoints(profile?.total_points ?? 0)}</p>
              <p className="text-xs text-orange-400">{currentStreak > 0 ? `🔥 ${currentStreak}d` : '—'}</p>
            </div>
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

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
