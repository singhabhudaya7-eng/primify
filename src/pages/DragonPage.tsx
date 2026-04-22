import { useState } from 'react'
import { Sword, Shield, Zap, Trophy, ChevronRight, Flame, RefreshCw } from 'lucide-react'
import { useGame } from '@/hooks/useGame'
import { useAuthStore } from '@/lib/store'
import { WEAPONS } from '@/types/weapons'
import { cn, formatPoints } from '@/lib/utils'
import ProgressBar from '@/components/ui/ProgressBar'
import type { Weapon } from '@/types/weapons'

export default function DragonPage() {
  const { gameState, inventory, ownedWeaponIds, attackDragon, energyAttack, convertEnergyToPoints, isLoading } = useGame()
  const { profile } = useAuthStore()
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon>(WEAPONS[0])
  const [strikeCount, setStrikeCount] = useState(1)

  const availableWeapons = WEAPONS.filter(
    w => w.cost_points === 0 || ownedWeaponIds.has(w.id)
  )

  const energyCurrent = profile?.energy_current ?? 0
  const maxStrikes = Math.min(energyCurrent, 50)

  function handleWeaponAttack(e: React.MouseEvent) {
    attackDragon.mutate({ weapon: selectedWeapon, event: e.nativeEvent as MouseEvent })
  }

  function handleEnergyAttack(e: React.MouseEvent) {
    energyAttack.mutate({ strikes: strikeCount, event: e.nativeEvent as MouseEvent })
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
          <p className="text-[#666] text-sm mt-0.5">Channel your energy to slay the dragon</p>
        </div>
        <div className="flex items-center gap-2 text-right">
          <Trophy size={14} className="text-[#ffd933]" />
          <div>
            <p className="text-sm font-mono font-bold text-[#ffd933]">{gameState.battles_won}</p>
            <p className="text-xs text-[#555]">wins</p>
          </div>
        </div>
      </div>

      {/* Loot drop banner */}
      {(gameState.reward_slots ?? 0) > 0 && (
        <div className="stat-card border border-[rgba(255,201,0,0.35)] bg-[rgba(255,201,0,0.06)] flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#ffd933]">
              {gameState.reward_slots} Reward Slot{gameState.reward_slots > 1 ? 's' : ''} Unlocked!
            </p>
            <p className="text-xs text-[#888]">Go to Rewards to claim your epic loot</p>
          </div>
        </div>
      )}

      {/* Dragon card */}
      <div className="stat-card border border-[rgba(255,32,32,0.2)] bg-[rgba(255,32,32,0.04)] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 50% 0%, #ff2020 0%, transparent 70%)' }}
        />
        <div className="relative z-10">
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

      {/* ── ENERGY ATTACK PANEL ── */}
      <div className="stat-card border border-[rgba(139,133,255,0.25)] bg-[rgba(139,133,255,0.05)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-[#8b85ff]" />
            <h2 className="font-display font-bold text-[#b9b5ff]">Energy Strike</h2>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-mono"
            style={{ background: 'rgba(139,133,255,0.18)', color: '#b9b5ff' }}>
            <Flame size={12} />
            <span>{energyCurrent}E available</span>
          </div>
        </div>

        <p className="text-xs text-[#666] mb-3">1 Energy = 10 Damage. Spend your daily energy to assault the dragon.</p>

        {energyCurrent === 0 ? (
          <div className="text-center py-4 text-[#555] text-sm">
            No energy. Complete habits to refill your Energy.
          </div>
        ) : (
          <>
            {/* Strike count slider */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-[#666] mb-1">
                <span>Strikes to use</span>
                <span className="font-mono text-[#b9b5ff]">{strikeCount}E → {strikeCount * 10} DMG</span>
              </div>
              <input
                type="range"
                min={1}
                max={maxStrikes}
                value={strikeCount}
                onChange={e => setStrikeCount(parseInt(e.target.value))}
                className="w-full accent-[#8b85ff]"
              />
              <div className="flex justify-between text-xs text-[#444] mt-1 font-mono">
                <span>1E</span>
                <span>{maxStrikes}E</span>
              </div>
            </div>

            <button
              onClick={handleEnergyAttack}
              disabled={energyAttack.isPending || energyCurrent === 0}
              className={cn(
                'w-full py-3 rounded-xl font-display font-bold text-base transition-all duration-150 flex items-center justify-center gap-2',
                'text-white border',
                'hover:shadow-[0_0_20px_rgba(139,133,255,0.4)] active:scale-[0.98]',
                energyAttack.isPending || energyCurrent === 0
                  ? 'opacity-50 cursor-not-allowed bg-[rgba(139,133,255,0.2)] border-[rgba(139,133,255,0.2)]'
                  : 'bg-gradient-to-r from-[#5548f5] to-[#8b85ff] border-[rgba(139,133,255,0.5)]'
              )}
            >
              <Flame size={18} />
              {energyAttack.isPending
                ? 'Channeling...'
                : `Energy Strike — ${strikeCount * 10} DMG`}
            </button>
          </>
        )}
      </div>

      {/* ── WEAPON ATTACK PANEL ── */}
      <div>
        <h2 className="section-title mb-3">Weapon Attack</h2>
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
                  {isSelected && <ChevronRight size={14} className="text-[#8b85ff] flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Weapon attack button */}
      <div className="sticky bottom-4">
        <button
          onClick={handleWeaponAttack}
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
            Costs <span className="text-red-400 font-mono">{formatPoints(selectedWeapon.cost_points)} pts</span> per attack
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
          <Flame size={16} className="mx-auto mb-1 text-[#8b85ff]" />
          <p className="text-lg font-mono font-bold text-[#dddaff]">{energyCurrent}</p>
          <p className="text-xs text-[#555]">energy</p>
        </div>
        <div className="stat-card text-center">
          <Trophy size={16} className="mx-auto mb-1 text-[#ffd933]" />
          <p className="text-lg font-mono font-bold text-[#dddaff]">{gameState.battles_won}</p>
          <p className="text-xs text-[#555]">dragons slain</p>
        </div>
      </div>

      {/* Energy → Points conversion */}
      <div className="stat-card border border-[rgba(255,201,0,0.12)] bg-[rgba(255,201,0,0.03)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#dddaff] flex items-center gap-2">
              <RefreshCw size={14} className="text-[#ffd933]" />
              Convert Energy to Points
            </p>
            <p className="text-xs text-[#666] mt-0.5">4E = 1P  •  {Math.floor(energyCurrent / 4)} pts available to convert</p>
          </div>
          <button
            onClick={() => convertEnergyToPoints.mutate(Math.floor(energyCurrent / 4) * 4)}
            disabled={convertEnergyToPoints.isPending || energyCurrent < 4}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              energyCurrent >= 4
                ? 'bg-[rgba(255,201,0,0.15)] text-[#ffd933] border border-[rgba(255,201,0,0.25)] hover:bg-[rgba(255,201,0,0.25)]'
                : 'bg-[rgba(255,255,255,0.04)] text-[#444] cursor-not-allowed'
            )}
          >
            {convertEnergyToPoints.isPending ? '...' : 'Convert All'}
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="stat-card border border-[rgba(108,99,255,0.15)] bg-[rgba(108,99,255,0.04)]">
        <p className="text-xs text-[#666] leading-relaxed">
          <span className="text-[#b9b5ff] font-medium">How the Arena works: </span>
          Complete habits to earn Energy ⚡. Use Energy to deal massive damage (1E = 10 DMG) or buy weapons with Points.
          Defeat the dragon to earn <span className="text-[#ffd933]">500 bonus Points</span> and unlock a Reward Slot.
          Miss a day and the dragon heals. Convert unused Energy to Points at 4:1.
        </p>
      </div>
    </div>
  )
}
