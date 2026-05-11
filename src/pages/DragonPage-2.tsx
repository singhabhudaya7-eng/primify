import { useState } from 'react'
import { Sword, Shield, Zap, Trophy, ChevronRight, Flame, RefreshCw, Lock } from 'lucide-react'
import { useGame } from '@/hooks/useGame'
import { useAuthStore } from '@/lib/store'
import { WEAPONS } from '@/types/weapons'
import { cn, formatPoints } from '@/lib/utils'
import ProgressBar from '@/components/ui/ProgressBar'
import type { Weapon } from '@/types/weapons'

export default function DragonPage() {
  const {
    gameState, inventory, ownedWeaponIds,
    attackDragon, energyAttack, convertEnergyToPoints,
    isLoading, weaponEnergyCost, energyDmgRatio,
  } = useGame()
  const { profile } = useAuthStore()
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon>(WEAPONS[0])
  const [strikeCount, setStrikeCount] = useState(1)

  const availableWeapons = WEAPONS.filter(
    w => w.cost_points === 0 || ownedWeaponIds.has(w.id)
  )

  const energyCurrent = profile?.energy_current ?? 0
  const hasEnergy = energyCurrent > 0
  const maxStrikes = Math.min(energyCurrent, 50)

  function handleWeaponAttack(e: React.MouseEvent) {
    if (!hasEnergy) return
    attackDragon.mutate({ weapon: selectedWeapon, event: e.nativeEvent as MouseEvent })
  }

  function handleEnergyAttack(e: React.MouseEvent) {
    if (!hasEnergy) return
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

      {/* No-energy warning */}
      {!hasEnergy && (
        <div className="stat-card border border-[rgba(255,201,0,0.2)] bg-[rgba(255,201,0,0.04)] flex items-center gap-3">
          <Lock size={18} className="text-[#ffd933] flex-shrink-0" />
          <p className="text-sm text-[#999]">
            <span className="text-[#ffd933] font-medium">Arena locked.</span>{' '}
            You have no energy. Complete your habits today to restore Energy and attack.
          </p>
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

      {/* ── ENERGY STRIKE PANEL ── */}
      <div className={cn(
        'stat-card border transition-all',
        hasEnergy
          ? 'border-[rgba(139,133,255,0.25)] bg-[rgba(139,133,255,0.05)]'
          : 'border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] opacity-60'
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame size={16} className={hasEnergy ? 'text-[#8b85ff]' : 'text-[#444]'} />
            <h2 className={cn('font-display font-bold', hasEnergy ? 'text-[#b9b5ff]' : 'text-[#555]')}>
              Energy Strike
            </h2>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-mono"
            style={{
              background: hasEnergy ? 'rgba(139,133,255,0.18)' : 'rgba(255,255,255,0.05)',
              color: hasEnergy ? '#b9b5ff' : '#555',
            }}>
            <Flame size={12} />
            <span>{energyCurrent}E available</span>
          </div>
        </div>

        <p className="text-xs text-[#666] mb-3">
          1E = {energyDmgRatio} DMG — burn your daily energy to assault the dragon.
        </p>

        {!hasEnergy ? (
          <div className="text-center py-3 text-[#444] text-sm">
            No energy. Complete habits to refill.
          </div>
        ) : (
          <>
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-[#666] mb-1">
                <span>Strikes to use</span>
                <span className="font-mono text-[#b9b5ff]">
                  {strikeCount}E → {strikeCount * energyDmgRatio} DMG
                </span>
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
              disabled={energyAttack.isPending}
              className={cn(
                'w-full py-3 rounded-xl font-display font-bold text-base transition-all duration-150 flex items-center justify-center gap-2',
                'text-white border active:scale-[0.98]',
                'bg-gradient-to-r from-[#5548f5] to-[#8b85ff] border-[rgba(139,133,255,0.5)]',
                'hover:shadow-[0_0_20px_rgba(139,133,255,0.4)]',
                energyAttack.isPending && 'opacity-60 cursor-not-allowed'
              )}
            >
              <Flame size={18} />
              {energyAttack.isPending
                ? 'Channeling...'
                : `Energy Strike — ${strikeCount * energyDmgRatio} DMG`}
            </button>
          </>
        )}
      </div>

      {/* ── WEAPON ATTACK PANEL ── */}
      <div className={cn(!hasEnergy && 'opacity-50 pointer-events-none')}>
        <h2 className="section-title mb-3">Weapon Attack</h2>
        <p className="text-xs text-[#555] mb-3">
          All weapons cost <span className="text-[#8b85ff] font-mono">{weaponEnergyCost}E</span> per swing.
          {' '}Paid weapons also deduct points.
        </p>
        {availableWeapons.length === 0 ? (
          <div className="stat-card text-center py-8">
            <p className="text-[#666] text-sm">No weapons available.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {availableWeapons.map(weapon => {
              const isSelected = selectedWeapon.id === weapon.id
              const canAffordPoints = weapon.cost_points === 0 || (profile?.total_points ?? 0) >= weapon.cost_points
              return (
                <button
                  key={weapon.id}
                  onClick={() => setSelectedWeapon(weapon)}
                  className={cn(
                    'w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all duration-150',
                    isSelected
                      ? 'bg-[rgba(108,99,255,0.12)] border-[rgba(108,99,255,0.4)]'
                      : 'bg-[var(--surface-2)] border-[var(--border)] hover:border-[rgba(108,99,255,0.2)]',
                    !canAffordPoints && 'opacity-50'
                  )}
                >
                  <span className="text-2xl">{weapon.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#dddaff]">{weapon.name}</p>
                    <p className="text-xs text-[#555]">{weapon.damage_min}–{weapon.damage_max} dmg</p>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-0.5">
                    <div className="flex items-center gap-1 justify-end text-xs font-mono text-[#8b85ff]">
                      <Flame size={9} />
                      <span>{weaponEnergyCost}E</span>
                    </div>
                    {weapon.cost_points > 0 && (
                      <p className="text-xs font-mono text-red-400">-{weapon.cost_points} pts</p>
                    )}
                    {weapon.cost_points === 0 && (
                      <span className="badge-void text-xs">Free</span>
                    )}
                  </div>
                  {isSelected && <ChevronRight size={14} className="text-[#8b85ff] flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Attack button */}
      <div className="sticky bottom-4">
        <button
          onClick={handleWeaponAttack}
          disabled={attackDragon.isPending || !hasEnergy}
          className={cn(
            'w-full py-4 rounded-2xl font-display font-bold text-lg transition-all duration-150 flex items-center justify-center gap-3',
            hasEnergy
              ? 'bg-gradient-to-r from-red-600 to-red-500 text-white border border-red-500/40 hover:from-red-500 hover:to-red-400 hover:shadow-[0_0_24px_rgba(255,32,32,0.3)] active:scale-[0.98]'
              : 'bg-[rgba(255,255,255,0.05)] text-[#444] border border-[rgba(255,255,255,0.05)] cursor-not-allowed',
            attackDragon.isPending && 'opacity-60 cursor-not-allowed'
          )}
        >
          {hasEnergy ? <Sword size={22} /> : <Lock size={22} />}
          {attackDragon.isPending
            ? 'Attacking...'
            : hasEnergy
              ? `Attack with ${selectedWeapon.name}`
              : 'No Energy — Complete Habits First'}
          {hasEnergy && <Sword size={22} className="scale-x-[-1]" />}
        </button>

        {hasEnergy && (
          <p className="text-center text-xs text-[#555] mt-2">
            Costs <span className="text-[#8b85ff] font-mono">{weaponEnergyCost}E</span> per swing
            {selectedWeapon.cost_points > 0 && (
              <> + <span className="text-red-400 font-mono">{formatPoints(selectedWeapon.cost_points)} pts</span></>
            )}
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
          <p className="text-xs text-[#555]">energy left</p>
        </div>
        <div className="stat-card text-center">
          <Trophy size={16} className="mx-auto mb-1 text-[#ffd933]" />
          <p className="text-lg font-mono font-bold text-[#dddaff]">{gameState.battles_won}</p>
          <p className="text-xs text-[#555]">dragons slain</p>
        </div>
      </div>

      {/* Energy → Points conversion */}
      {energyCurrent >= 4 && (
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
              disabled={convertEnergyToPoints.isPending}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-[rgba(255,201,0,0.15)] text-[#ffd933] border border-[rgba(255,201,0,0.25)] hover:bg-[rgba(255,201,0,0.25)]"
            >
              {convertEnergyToPoints.isPending ? '...' : 'Convert All'}
            </button>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="stat-card border border-[rgba(108,99,255,0.15)] bg-[rgba(108,99,255,0.04)]">
        <p className="text-xs text-[#666] leading-relaxed">
          <span className="text-[#b9b5ff] font-medium">Rules: </span>
          Every attack costs Energy — no energy, no damage.
          Energy Strike = {energyDmgRatio} DMG per E.
          Weapon attacks cost {weaponEnergyCost}E + any point cost per swing.
          Defeat the dragon → <span className="text-[#ffd933]">+{500}P LootDrop</span> + Reward Slot.
          Convert unused Energy to Points at 4:1.
        </p>
      </div>
    </div>
  )
}
