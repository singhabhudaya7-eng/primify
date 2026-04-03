import { useState } from 'react'
import { Plus, Trash2, CheckCircle2, TrendingUp } from 'lucide-react'
import { useGoals } from '@/hooks/useGoals'
import Modal from '@/components/ui/Modal'
import ProgressBar from '@/components/ui/ProgressBar'
import { getProgressPercent, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const GOAL_EMOJIS = ['🎯', '💰', '💪', '📚', '🏃', '🧠', '🌱', '✈️', '🏠', '💻', '🎵', '❤️']

export default function GoalsPage() {
  const { goals, isLoading, createGoal, updateGoalProgress, deleteGoal } = useGoals()
  const [showModal, setShowModal] = useState(false)
  const [editingProgress, setEditingProgress] = useState<string | null>(null)
  const [progressVal, setProgressVal] = useState('')
  const [form, setForm] = useState({
    name: '', description: '', target_value: 100,
    unit: '', emoji: '🎯', deadline: '',
  })
  const [createError, setCreateError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    try {
      await createGoal.mutateAsync({
        ...form,
        description: form.description || undefined,
        unit: form.unit || undefined,
        deadline: form.deadline || undefined,
      })
      setShowModal(false)
      setForm({ name: '', description: '', target_value: 100, unit: '', emoji: '🎯', deadline: '' })
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create goal. Check your connection.')
    }
  }

  async function handleUpdateProgress(goalId: string) {
    const val = parseFloat(progressVal)
    if (isNaN(val)) return
    try {
      await updateGoalProgress.mutateAsync({ goalId, value: val })
      setEditingProgress(null)
      setProgressVal('')
    } catch {
      // onError handles toast
    }
  }

  const activeGoals = goals.filter(g => !g.is_completed)
  const completedGoals = goals.filter(g => g.is_completed)

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#dddaff]">Goals</h1>
          <p className="text-[#666] text-sm mt-0.5">Your mission targets</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          New Goal
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-[rgba(255,255,255,0.03)] animate-pulse" />)}
        </div>
      ) : activeGoals.length === 0 && completedGoals.length === 0 ? (
        <div className="text-center py-16 stat-card">
          <div className="text-5xl mb-3">🎯</div>
          <p className="text-[#dddaff] font-medium">No goals yet</p>
          <p className="text-[#555] text-sm mt-1 mb-4">Set a mission, track your conquest</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Set First Goal</button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeGoals.map(goal => {
            const pct = getProgressPercent(goal.current_value, goal.target_value)
            return (
              <div key={goal.id} className="stat-card group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{goal.emoji}</span>
                    <div>
                      <p className="font-medium text-[#dddaff]">{goal.name}</p>
                      {goal.description && (
                        <p className="text-xs text-[#555] mt-0.5">{goal.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingProgress(goal.id); setProgressVal(String(goal.current_value)) }}
                      className="p-1.5 rounded-lg text-[#555] hover:text-[#8b85ff] hover:bg-[rgba(108,99,255,0.1)] transition-all"
                    >
                      <TrendingUp size={14} />
                    </button>
                    <button
                      onClick={() => deleteGoal.mutate(goal.id)}
                      className="p-1.5 rounded-lg text-[#444] hover:text-red-400 hover:bg-[rgba(255,32,32,0.1)] transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <ProgressBar value={goal.current_value} max={goal.target_value} variant="gold" size="md" />

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-[#555] font-mono">
                    {goal.current_value} / {goal.target_value} {goal.unit}
                  </span>
                  <div className="flex items-center gap-2">
                    {goal.deadline && (
                      <span className="text-xs text-[#555]">Due {formatDate(goal.deadline)}</span>
                    )}
                    <span className={cn(
                      'text-xs font-mono font-bold',
                      pct >= 75 ? 'text-green-400' : pct >= 40 ? 'text-yellow-400' : 'text-[#666]'
                    )}>
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Inline progress editor */}
                {editingProgress === goal.id && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                    <input
                      type="number"
                      className="input-field text-sm py-1.5"
                      placeholder="Update progress..."
                      value={progressVal}
                      onChange={e => setProgressVal(e.target.value)}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleUpdateProgress(goal.id)
                        if (e.key === 'Escape') setEditingProgress(null)
                      }}
                    />
                    <button onClick={() => handleUpdateProgress(goal.id)} className="btn-primary py-1.5 px-4 text-sm">
                      Update
                    </button>
                    <button onClick={() => setEditingProgress(null)} className="btn-ghost py-1.5 px-3 text-sm">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {completedGoals.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-[#555] flex items-center gap-1.5 mb-2">
                <CheckCircle2 size={14} className="text-green-500" />
                Conquered ({completedGoals.length})
              </h2>
              {completedGoals.map(goal => (
                <div key={goal.id} className="stat-card opacity-50 flex items-center gap-3 mb-2">
                  <span className="text-xl">{goal.emoji}</span>
                  <p className="text-sm line-through text-[#555] flex-1">{goal.name}</p>
                  <CheckCircle2 size={16} className="text-green-500" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setCreateError('') }} title="New Goal">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs text-[#666] mb-1.5 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {GOAL_EMOJIS.map(e => (
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
            <label className="text-xs text-[#666] mb-1.5 block">Goal name</label>
            <input className="input-field" placeholder="e.g. Save ₹1.5L, Run 5km, Read 12 books..."
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>

          <div>
            <label className="text-xs text-[#666] mb-1.5 block">Description (optional)</label>
            <input className="input-field" placeholder="Why does this matter to you?"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#666] mb-1.5 block">Target value</label>
              <input type="number" min={1} className="input-field"
                value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: parseInt(e.target.value) || 100 }))} />
            </div>
            <div>
              <label className="text-xs text-[#666] mb-1.5 block">Unit</label>
              <input className="input-field" placeholder="kg, ₹, km, books..."
                value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#666] mb-1.5 block">Deadline (optional)</label>
            <input type="date" className="input-field"
              value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => { setShowModal(false); setCreateError('') }} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={createGoal.isPending} className="btn-primary flex-1">
              {createGoal.isPending ? 'Creating...' : 'Set Goal'}
            </button>
          </div>
          {createError && (
            <p className="text-xs text-red-400 text-center mt-1">{createError}</p>
          )}
        </form>
      </Modal>
    </div>
  )
}
