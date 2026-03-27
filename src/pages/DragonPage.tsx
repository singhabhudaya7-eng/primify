import { useState } from 'react'
import { Sword, Shield, Zap, Trophy, ChevronRight } from 'lucide-react'
import { useGame } from '@/hooks/useGame'
import { useAuthStore } from '@/lib/store'
import { WEAPONS } from '@/types/weapons'
import { cn, formatPoints } from '@/lib/utils'
import ProgressBar from '@/components/ui/ProgressBar'
import type { Weapon } from '@/types/weapons'

export default function DragonPage() {
  const { gameState, inventory, ownedWeaponIds, attackDragon, isLoading } = useGame()
  const { profile } = useAuthStore()
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon>(WEAPONS[0])

  const availableWeapons = WEAPONS.filter(
    w => w.cost_points === 0 || ownedWeaponIds.has(w.id)
  )

  function handleAttack(e: React.MouseEvent) {
    attackDragon.mutate({ weapon: selectedWeapon, event: e.nativeEvent as MouseEvent })
  }

  if (isLoading || !gameState) {
    return (
      <div className="space-y-4 animate-slide-up">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 rounded-2xl bg-[rgba(255,255,255,0.03)] animate-pulse" />
        ))}
      </div>
    )
  }

  const dragonHpPct = Math.round((gameState.dragon_hp / gameState.dragon_max_hp) * 100)

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#dddaff]">Dragon Arena</h1>
          <p className="text-[#666] text-sm mt-0.5">Spend discipline to deal damage</p>
        </div>
        <div className="flex items-center gap-2 text-right">
          <Trophy size={14} className="text-[#ffd933]" />
          <div>
            <p className="text-sm font-mono font-bold text-[#ffd933]">{gameState.battles_won}</p>
            <p className="text-xs text-[#555]">wins</p>
          </div>
        </div>
      </div>

      {/* Dragon card */}
      <div className="stat-card border border-[rgba(255,32,32,0.2)] bg-[rgba(255,32,32,0.04)] relative overflow-hidden">
        {/* Subtle bg glow */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 50% 0%, #ff2020 0%, transparent 70%)' }}
        />

        <div className="relative z-10">
          {/* Dragon identity */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-5xl animate-float">{gameState.dragon_emoji}</span>
              <div>
                <h2 className="font-display text-xl font-bold text-[#dddaff]">{gameState.dragon_name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="badge-void text-xs">Level {gameState.dragon_level}</span>
                  <span className="text-xs text-red-400 font-mono">⚔ {gameState.dragon_strength} str</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-mono font-bold text-red-400">{gameState.dragon_hp}</p>
              <p className="text-xs text-[#555] font-mono">/ {gameState.dragon_max_hp} HP</p>
            </div>
          </div>

          {/* HP bar */}
          <ProgressBar
            value={gameState.dragon_hp}
            max={gameState.dragon_max_hp}
            variant="dragon"
            size="lg"
            showLabel
          />

          <p className="text-xs text-[#555] mt-1.5 text-right font-mono">{dragonHpPct}% remaining</p>
        </div>
      </div>

      {/* Weapon selection */}
      <div>
        <h2 className="section-title mb-3">Select Weapon</h2>
        {availableWeapons.length === 0 ? (
          <div className="stat-card text-center py-8">
            <p className="text-[#666] text-sm">No weapons yet — Stone Fist should always be available.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {availableWeapons.map(weapon => {
              const isSelected = selectedWeapon.id === weapon.id
              const canAfford = weapon.cost_points === 0 || (profile?.total_points ?? 0) >= weapon.cost_points
              return (
                <button
                  key={weapon.id}
                  onClick={() => setSelectedWeapon(weapon)}
                  className={cn(
                    'w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all duration-150',
                    isSelected
                      ? 'bg-[rgba(108,99,255,0.12)] border-[rgba(108,99,255,0.4)]'
                      : 'bg-[var(--surface-2)] border-[var(--border)] hover:border-[rgba(108,99,255,0.2)]',
                    !canAfford && 'opacity-50'
                  )}
                >
                  <span className="text-2xl">{weapon.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#dddaff]">{weapon.name}</p>
                    <p className="text-xs text-[#555]">{weapon.damage_min}–{weapon.damage_max} dmg</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {weapon.cost_points === 0 ? (
                      <span className="badge-void text-xs">Free</span>
                    ) : (
                      <span className="text-xs font-mono text-red-400">-{weapon.cost_points} pts</span>
                    )}
                  </div>
                  {isSelected && (
                    <ChevronRight size={14} className="text-[#8b85ff] flex-shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Attack button */}
      <div className="sticky bottom-4">
        <button
          onClick={handleAttack}
          disabled={attackDragon.isPending}
          className={cn(
            'w-full py-4 rounded-2xl font-display font-bold text-lg transition-all duration-150 flex items-center justify-center gap-3',
            'bg-gradient-to-r from-red-600 to-red-500 text-white border border-red-500/40',
            'hover:from-red-500 hover:to-red-400 hover:shadow-[0_0_24px_rgba(255,32,32,0.3)]',
            'active:scale-[0.98]',
            attackDragon.isPending && 'opacity-60 cursor-not-allowed'
          )}
        >
          <Sword size={22} />
          {attackDragon.isPending ? 'Attacking...' : `Attack with ${selectedWeapon.name}`}
          <Sword size={22} className="scale-x-[-1]" />
        </button>

        {selectedWeapon.cost_points > 0 && (
          <p className="text-center text-xs text-[#555] mt-2">
            Costs <span className="text-red-400 font-mono">{formatPoints(selectedWeapon.cost_points)} pts</span> per attack — spend wisely
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center">
          <Shield size={16} className="mx-auto mb-1 text-blue-400" />
          <p className="text-lg font-mono font-bold text-[#dddaff]">{gameState.player_hp}</p>
          <p className="text-xs text-[#555]">your HP</p>
        </div>
        <div className="stat-card text-center">
          <Zap size={16} className="mx-auto mb-1 text-[#8b85ff]" />
          <p className="text-lg font-mono font-bold text-[#dddaff]">{formatPoints(profile?.total_points ?? 0)}</p>
          <p className="text-xs text-[#555]">pts available</p>
        </div>
        <div className="stat-card text-center">
          <Trophy size={16} className="mx-auto mb-1 text-[#ffd933]" />
          <p className="text-lg font-mono font-bold text-[#dddaff]">{gameState.battles_won}</p>
          <p className="text-xs text-[#555]">dragons slain</p>
        </div>
      </div>

      {/* How it works */}
      <div className="stat-card border border-[rgba(108,99,255,0.15)] bg-[rgba(108,99,255,0.04)]">
        <p className="text-xs text-[#666] leading-relaxed">
          <span className="text-[#b9b5ff] font-medium">How the Arena works: </span>
          Complete habits to earn points. Spend points here to deal damage to the dragon.
          Miss a day and the dragon heals. Defeat it to face a stronger one.
          Buy better weapons in the <span className="text-[#b9b5ff]">Weapon Shop</span>.
        </p>
      </div>
    </div>
  )
}
