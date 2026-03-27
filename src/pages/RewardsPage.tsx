import { useState } from 'react'
import { Plus, Gift, Lock, Trash2, History } from 'lucide-react'
import { useRewards } from '@/hooks/useRewards'
import { useAuthStore } from '@/lib/store'
import Modal from '@/components/ui/Modal'
import { cn, formatPoints } from '@/lib/utils'

const REWARD_EMOJIS = ['🍜', '😌', '🛍️', '🎮', '🍕', '🎬', '🏖️', '☕', '🎁', '🏆', '🎉', '💆']

export default function RewardsPage() {
  const { rewards, isLoading, createReward, redeemReward, deleteReward } = useRewards()
  const { profile } = useAuthStore()
  const points = profile?.total_points ?? 0
  const [showModal, setShowModal] = useState(false)
  const [confirmRedeem, setConfirmRedeem] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', cost_points: 100, emoji: '🍜' })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createReward.mutateAsync(form)
      setShowModal(false)
      setForm({ name: '', description: '', cost_points: 100, emoji: '🍜' })
    } catch {
      // onError handles toast
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
          <h1 className="font-display text-2xl font-bold text-[#dddaff]">Rewards</h1>
          <p className="text-[#666] text-sm mt-0.5">Spend points on real-life treats</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-[#666]">Balance</p>
            <p className="text-xl font-mono font-bold text-[#ffd933]">{formatPoints(points)} pts</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="stat-card border border-[rgba(255,201,0,0.15)] bg-[rgba(255,201,0,0.04)]">
        <p className="text-sm text-[#888]">
          <span className="text-[#ffd933] font-medium">The deal:</span> You earn points by completing habits every day.
          You can only unlock rewards when you've genuinely earned the points. No discipline = no treats.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-[rgba(255,255,255,0.03)] animate-pulse" />)}
        </div>
      ) : rewards.length === 0 ? (
        <div className="text-center py-16 stat-card">
          <div className="text-5xl mb-3">🎁</div>
          <p className="text-[#dddaff] font-medium">No rewards yet</p>
          <p className="text-[#555] text-sm mt-1 mb-4">Define what you're working towards</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Add First Reward</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {rewards.map(reward => {
            const canAfford = points >= reward.cost_points
            return (
              <div key={reward.id}
                className={cn(
                  'stat-card relative group transition-all',
                  !canAfford && 'opacity-60'
                )}>
                {/* Delete button */}
                <button
                  onClick={() => deleteReward.mutate(reward.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded text-[#444] hover:text-red-400 transition-all"
                >
                  <Trash2 size={12} />
                </button>

                <div className="text-3xl mb-2">{reward.emoji}</div>
                <h3 className="font-medium text-[#dddaff] text-sm">{reward.name}</h3>
                {reward.description && (
                  <p className="text-xs text-[#555] mt-0.5 line-clamp-2">{reward.description}</p>
                )}
                {reward.times_redeemed > 0 && (
                  <div className="flex items-center gap-1 text-xs text-[#444] mt-1">
                    <History size={10} />
                    <span>×{reward.times_redeemed}</span>
                  </div>
                )}

                <button
                  onClick={() => canAfford ? setConfirmRedeem(reward.id) : null}
                  className={cn(
                    'w-full mt-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5',
                    canAfford
                      ? 'bg-[rgba(255,201,0,0.15)] text-[#ffd933] border border-[rgba(255,201,0,0.25)] hover:bg-[rgba(255,201,0,0.25)]'
                      : 'bg-[rgba(255,255,255,0.04)] text-[#555] cursor-not-allowed'
                  )}
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Reward">
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
            <label className="text-xs text-[#666] mb-1.5 block">Description (optional)</label>
            <input className="input-field" placeholder="What exactly is this reward?"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-[#666] mb-1.5 block">Cost in points</label>
            <input type="number" min={1} className="input-field"
              value={form.cost_points} onChange={e => setForm(f => ({ ...f, cost_points: parseInt(e.target.value) || 100 }))} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={createReward.isPending} className="btn-primary flex-1">
              {createReward.isPending ? 'Adding...' : 'Add Reward'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm redeem modal */}
      <Modal
        isOpen={!!confirmRedeem}
        onClose={() => setConfirmRedeem(null)}
        title="Redeem Reward?"
      >
        {confirmRedeem && (() => {
          const r = rewards.find(r => r.id === confirmRedeem)
          if (!r) return null
          return (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="text-6xl mb-3">{r.emoji}</div>
                <h3 className="font-display text-xl text-[#dddaff]">{r.name}</h3>
                <p className="text-[#ffd933] font-mono text-lg mt-1">–{formatPoints(r.cost_points)} pts</p>
                <p className="text-[#666] text-sm mt-2">
                  You've earned this. Go enjoy it.
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setConfirmRedeem(null)} className="btn-ghost flex-1">Cancel</button>
                <button
                  onClick={() => handleRedeem(confirmRedeem)}
                  disabled={redeemReward.isPending}
                  className="btn-primary flex-1 flex items-center justify-center gap-1.5"
                >
                  <Gift size={16} />
                  {redeemReward.isPending ? 'Redeeming...' : 'Redeem!'}
                </button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
