import { ShoppingBag, CheckCircle2, Lock } from 'lucide-react'
import { useGame } from '@/hooks/useGame'
import { useAuthStore } from '@/lib/store'
import { WEAPONS, RARITY_COLORS, RARITY_GLOW } from '@/types/weapons'
import { cn, formatPoints } from '@/lib/utils'

export default function ShopPage() {
  const { ownedWeaponIds, buyWeapon, isLoading } = useGame()
  const { profile } = useAuthStore()
  const points = profile?.total_points ?? 0

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#dddaff]">Weapon Shop</h1>
          <p className="text-[#666] text-sm mt-0.5">Spend your discipline points on power</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#666]">Available</p>
          <p className="text-xl font-mono font-bold text-[#ffd933]">{formatPoints(points)} pts</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="stat-card border border-[rgba(108,99,255,0.2)] bg-[rgba(108,99,255,0.05)]">
        <p className="text-sm text-[#888]">
          <span className="text-[#b9b5ff] font-medium">How it works:</span> Buy weapons here, then use them in the Dragon Arena.
          Stone Fist is always free. Higher-tier weapons deal more damage but cost more points per attack.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {WEAPONS.map(weapon => {
          const owned = ownedWeaponIds.has(weapon.id) || weapon.id === 'stone_fist'
          const canAfford = points >= weapon.cost_points
          const isFree = weapon.cost_points === 0

          return (
            <div
              key={weapon.id}
              className={cn(
                'stat-card transition-all duration-150',
                RARITY_GLOW[weapon.rarity],
                owned && 'border-[rgba(108,99,255,0.25)]'
              )}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl flex-shrink-0">{weapon.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-medium text-[#dddaff]">{weapon.name}</h3>
                    <span className={cn('text-xs font-medium', RARITY_COLORS[weapon.rarity])}>
                      {weapon.rarity}
                    </span>
                    {owned && (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <CheckCircle2 size={11} />
                        Owned
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#666]">{weapon.description}</p>
                  {weapon.special && (
                    <p className="text-xs text-[#8b85ff] mt-0.5">✦ {weapon.special}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-mono text-[#888]">
                      {weapon.damage_min}–{weapon.damage_max} dmg
                    </span>
                    <span className="text-xs font-mono text-red-400">
                      {weapon.cost_points > 0 ? `-${weapon.cost_points} pts/attack` : 'Free to use'}
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {isFree ? (
                    <div className="badge-void px-3 py-1.5">Free</div>
                  ) : owned ? (
                    <button
                      onClick={() => buyWeapon.mutate(weapon.id)}
                      disabled={!canAfford || buyWeapon.isPending}
                      className="btn-ghost text-sm py-2 px-3 disabled:opacity-40"
                    >
                      +1 more
                    </button>
                  ) : (
                    <button
                      onClick={() => buyWeapon.mutate(weapon.id)}
                      disabled={!canAfford || buyWeapon.isPending}
                      className={cn(
                        'flex items-center gap-1.5 text-sm py-2 px-3 rounded-xl font-medium transition-all',
                        canAfford
                          ? 'btn-ember'
                          : 'opacity-40 cursor-not-allowed bg-[rgba(255,255,255,0.05)] text-[#555] border border-[var(--border)]'
                      )}
                    >
                      {!canAfford && <Lock size={12} />}
                      <span>{formatPoints(weapon.cost_points)} pts</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-[#444]">
        Earn more points by completing daily habits. Consistency is the real weapon.
      </p>
    </div>
  )
}
