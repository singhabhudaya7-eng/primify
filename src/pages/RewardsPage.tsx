import { useState } from 'react'
import { Plus, Gift, Lock, Trash2, History, Star, Flame, RefreshCw } from 'lucide-react'
import { useRewards } from '@/hooks/useRewards'
import { useAuthStore } from '@/lib/store'
import { useGame } from '@/hooks/useGame'
import Modal from '@/components/ui/Modal'
import { cn, formatPoints } from '@/lib/utils'

const REWARD_EMOJIS = ['🍜', '😌', '🛍️', '🎮', '🍕', '🎬', '🏖️', '☕', '🎁', '🏆', '🎉', '💆']

// Map cost ranges to item-level descriptions
function getItemTier(cost: number): { label: string; color: string; glow: string } {
  if (cost >= 2000) return { label: 'Legendary', color: '#ffd933', glow: 'rgba(255,201,0,0.2)' }
  if (cost >= 1000) return { label: 'Epic', color: '#c77dff', glow: 'rgba(199,125,255,0.15)' }
  if (cost >= 500)  return { label: 'Rare', color: '#4cc9f0', glow: 'rgba(76,201,240,0.12)' }
  if (cost >= 200)  return { label: 'Uncommon', color: '#80ed99', glow: 'rgba(128,237,153,0.1)' }
  return              { label: 'Common', color: '#888', glow: 'transparent' }
}

// Dragon-slayer lore descriptions for common reward types
function getLoreDescription(name: string, desc?: string): string {
  if (desc) return desc
  const lower = name.toLowerCase()
  if (lower.includes('burrito') || lower.includes('food') || lower.includes('eat') || lower.includes('meal'))
    return 'Epic Level Combat Rations — fuel forged from discipline'
  if (lower.includes('game') || lower.includes('gaming'))
    return 'Warrior\'s Rest Protocol — recreational combat simulation'
  if (lower.includes('gear') || lower.includes('tech') || lower.includes('buy'))
    return 'Elite Field Equipment — acquired through battle-hardened grind'
  if (lower.includes('cheat') || lower.includes('treat') || lower.includes('snack'))
    return 'Sanctioned Indulgence — one time, no apologies'
  if (lower.includes('movie') || lower.includes('cinema') || lower.includes('watch'))
    return 'Debrief Session — strategic intelligence gathering'
  if (lower.includes('coffee') || lower.includes('drink'))
    return 'Pre-Battle Stimulant — warrior-grade brew'
  return 'Hard-earned spoils of war'
}

export default function RewardsPage() {
  const { rewards, isLoading, createReward, redeemReward, deleteReward } = useRewards()
  const { profile } = useAuthStore()
  const { gameState, convertEnergyToPoints } = useGame()
  const points = profile?.total_points ?? 0
  const energyCurrent = profile?.energy_current ?? 0
  const rewardSlots = gameState?.reward_slots ?? 0

  const [showModal, setShowModal] = useState(false)
  const [confirmRedeem, setConfirmRedeem] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', cost_points: 100, emoji: '🍜' })
  const [createError, setCreateError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    setIsSubmitting(true)
    try {
      await createReward.mutateAsync(form)
      setShowModal(false)
      setForm({ name: '', description: '', cost_points: 100, emoji: '🍜' })
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create reward. Check your connection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRedeem(rewardId: string) {
    try {
      await redeemReward.mutateAsync(rewardId)
      setConfirmRedeem(null)
    } catch {
      // onError handles toast
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#dddaff]">Reward Shop</h1>
          <p className="text-[#666] text-sm mt-0.5">Spend points on hard-earned spoils</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-[#666]">Treasury</p>
            <p className="text-xl font-mono font-bold text-[#ffd933]">{formatPoints(points)} pts</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      {/* Warrior's Creed */}
      <div className="stat-card border border-[rgba(255,201,0,0.15)] bg-[rgba(255,201,0,0.04)]">
        <p className="text-sm text-[#888]">
          <span className="text-[#ffd933] font-medium">Warrior's Creed:</span> Points are earned through blood, sweat,
          and daily discipline. Dragon slays unlock Reward Slots. Spend wisely — no discipline, no spoils.
        </p>
      </div>

      {/* Reward Slots from Dragon Loot */}
      {rewardSlots > 0 && (
        <div className="stat-card border border-[rgba(199,125,255,0.3)] bg-[rgba(199,125,255,0.06)]">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="text-sm font-bold" style={{ color: '#c77dff' }}>
                {rewardSlots} Dragon Loot Slot{rewardSlots > 1 ? 's' : ''} Available!
              </p>
              <p className="text-xs text-[#888]">Earned by defeating dragons in the Arena</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: rewardSlots }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-dashed"
                style={{ borderColor: 'rgba(199,125,255,0.3)', background: 'rgba(199,125,255,0.06)' }}>
                <Star size={14} style={{ color: '#c77dff' }} />
                <div>
                  <p className="text-xs font-medium" style={{ color: '#c77dff' }}>Epic Loot Slot</p>
                  <p className="text-[10px] text-[#666]">Add a reward to fill it</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Energy → Points conversion */}
      {energyCurrent >= 4 && (
        <div className="stat-card border border-[rgba(139,133,255,0.2)] bg-[rgba(139,133,255,0.04)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame size={14} className="text-[#8b85ff]" />
              <div>
                <p className="text-sm font-medium text-[#dddaff]">Convert Energy</p>
                <p className="text-xs text-[#666]">{energyCurrent}E → {Math.floor(energyCurrent / 4)}P  (4:1 exchange)</p>
              </div>
            </div>
            <button
              onClick={() => convertEnergyToPoints.mutate(Math.floor(energyCurrent / 4) * 4)}
              disabled={convertEnergyToPoints.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: 'rgba(139,133,255,0.15)',
                color: '#b9b5ff',
                border: '1px solid rgba(139,133,255,0.25)',
              }}
            >
              <RefreshCw size={12} />
              {convertEnergyToPoints.isPending ? '...' : 'Convert All'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-36 rounded-2xl bg-[rgba(255,255,255,0.03)] animate-pulse" />)}
        </div>
      ) : rewards.length === 0 ? (
        <div className="text-center py-16 stat-card">
          <div className="text-5xl mb-3">🎁</div>
          <p className="text-[#dddaff] font-medium">No rewards yet</p>
          <p className="text-[#555] text-sm mt-1 mb-4">Define your spoils of war</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Add First Reward</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {rewards.map(reward => {
            const canAfford = points >= reward.cost_points
            const tier = getItemTier(reward.cost_points)
            const lore = getLoreDescription(reward.name, reward.description)
            return (
              <div key={reward.id}
                className={cn('stat-card relative group transition-all', !canAfford && 'opacity-60')}
                style={{ boxShadow: canAfford ? `0 0 12px ${tier.glow}` : undefined }}>

                {/* Delete */}
                <button
                  onClick={() => deleteReward.mutate(reward.id)}
                  className="absolute top-2 right-2 md:opacity-0 md:group-hover:opacity-100 p-1 rounded text-[#444] hover:text-red-400 transition-all"
                >
                  <Trash2 size={12} />
                </button>

                {/* Tier badge */}
                <div className="flex items-center gap-1 mb-1.5">
                  <Star size={9} style={{ color: tier.color }} />
                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: tier.color }}>
                    {tier.label}
                  </span>
                </div>

                <div className="text-3xl mb-1.5">{reward.emoji}</div>
                <h3 className="font-medium text-[#dddaff] text-sm">{reward.name}</h3>
                <p className="text-xs text-[#555] mt-0.5 line-clamp-2 italic">{lore}</p>

                {reward.times_redeemed > 0 && (
                  <div className="flex items-center gap-1 text-xs text-[#444] mt-1">
                    <History size={10} />
                    <span>×{reward.times_redeemed} claimed</span>
                  </div>
                )}

                <button
                  onClick={() => canAfford ? setConfirmRedeem(reward.id) : null}
                  className={cn(
                    'w-full mt-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5',
                    canAfford
                      ? 'border hover:opacity-90'
                      : 'bg-[rgba(255,255,255,0.04)] text-[#555] cursor-not-allowed'
                  )}
                  style={canAfford ? {
                    background: `${tier.glow}`,
                    color: tier.color,
                    borderColor: `${tier.color}40`,
                  } : undefined}
                >
                  {!canAfford && <Lock size={12} />}
                  <span className="font-mono">{formatPoints(reward.cost_points)} pts</span>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add reward modal */}
      <Modal isOpen={showModal} onClose={() => { if (!isSubmitting) { setShowModal(false); setCreateError('') } }} title="New Reward">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs text-[#666] mb-1.5 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {REWARD_EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  className={cn('w-9 h-9 rounded-lg text-lg transition-all',
                    form.emoji === e ? 'bg-[rgba(108,99,255,0.3)] ring-1 ring-[#5548f5]'
                    : 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)]')}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-[#666] mb-1.5 block">Reward name</label>
            <input className="input-field" placeholder="Eat out, Gaming session, Buy shoes..."
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs text-[#666] mb-1.5 block">Battle lore (optional)</label>
            <input className="input-field" placeholder="e.g. Epic Combat Rations, Elite Field Gear..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-[#666] mb-1.5 block">Cost in points</label>
            <input type="number" min={1} className="input-field"
              value={form.cost_points} onChange={e => setForm(f => ({ ...f, cost_points: parseInt(e.target.value) || 100 }))} />
            <p className="text-xs text-[#555] mt-1">
              Tier: <span style={{ color: getItemTier(form.cost_points).color }}>{getItemTier(form.cost_points).label}</span>
              {' '}— Common &lt;200 · Uncommon 200+ · Rare 500+ · Epic 1000+ · Legendary 2000+
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => { if (!isSubmitting) { setShowModal(false); setCreateError('') } }} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? 'Adding...' : 'Add Reward'}
            </button>
          </div>
          {createError && (
            <p className="text-xs text-red-400 text-center mt-1">{createError}</p>
          )}
        </form>
      </Modal>

      {/* Confirm redeem modal */}
      <Modal isOpen={!!confirmRedeem} onClose={() => setConfirmRedeem(null)} title="Claim Reward?">
        {confirmRedeem && (() => {
          const r = rewards.find(r => r.id === confirmRedeem)
          if (!r) return null
          const tier = getItemTier(r.cost_points)
          const lore = getLoreDescription(r.name, r.description)
          return (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  <Star size={12} style={{ color: tier.color }} />
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: tier.color }}>
                    {tier.label} Reward
                  </span>
                </div>
                <div className="text-6xl mb-3">{r.emoji}</div>
                <h3 className="font-display text-xl text-[#dddaff]">{r.name}</h3>
                <p className="text-xs text-[#666] italic mt-1">{lore}</p>
                <p className="font-mono text-lg mt-3" style={{ color: tier.color }}>–{formatPoints(r.cost_points)} pts</p>
                <p className="text-[#666] text-sm mt-2">You've earned this. Go enjoy your spoils, warrior.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setConfirmRedeem(null)} className="btn-ghost flex-1">Cancel</button>
                <button
                  onClick={() => handleRedeem(confirmRedeem)}
                  disabled={redeemReward.isPending}
                  className="btn-primary flex-1 flex items-center justify-center gap-1.5"
                >
                  <Gift size={16} />
                  {redeemReward.isPending ? 'Claiming...' : 'Claim Reward!'}
                </button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
