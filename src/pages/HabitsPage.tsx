import { useState } from 'react'
import { Plus, Trash2, Zap } from 'lucide-react'
import { useHabits } from '@/hooks/useHabits'
import { useGoals } from '@/hooks/useGoals'
import Modal from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import type { Habit } from '@/types/database'

const EMOJI_OPTIONS = ['💪', '🏃', '📚', '🧘', '💧', '🥗', '😴', '💻', '🎯', '✍️', '🌅', '🧠', '💰', '🚫', '🎵']
const FREQ_OPTIONS: { value: Habit['frequency']; label: string }[] = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekends', label: 'Weekends' },
]

const INITIAL_FORM = {
  name: '',
  points_value: 10,
  emoji: '💪',
  goal_id: '',
  frequency: 'daily' as Habit['frequency'],
}

export default function HabitsPage() {
  const { habits, isLoading, createHabit, deleteHabit } = useHabits()
  const { goals } = useGoals()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      await createHabit.mutateAsync({
        ...form,
        goal_id: form.goal_id || undefined,
      })
      
      // Reset form after successful creation
      setForm(INITIAL_FORM)
      setShowModal(false)
    } catch (err) {
      console.error('Form submission error:', err)
      // Error toast is handled by the mutation's onError
    }
  }

  function handleOpenModal() {
    setForm(INITIAL_FORM)
    setShowModal(true)
  }

  function handleCloseModal() {
    setShowModal(false)
    setForm(INITIAL_FORM)
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#dddaff]">Habits</h1>
          <p className="text-[#666] text-sm mt-0.5">Daily actions that build your power</p>
        </div>
        <button onClick={handleOpenModal} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          New Habit
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-2xl bg-[rgba(255,255,255,0.03)] animate-pulse" />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-16 stat-card">
          <div className="text-5xl mb-3">🎯</div>
          <p className="text-[#dddaff] font-medium">No habits yet</p>
          <p className="text-[#555] text-sm mt-1 mb-4">Create your first habit to start earning points</p>
          <button onClick={handleOpenModal} className="btn-primary">
            Add First Habit
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map(habit => {
            const linkedGoal = goals.find(g => g.id === habit.goal_id)
            return (
              <div key={habit.id} className="stat-card flex items-center gap-4 group">
                <span className="text-2xl">{habit.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#dddaff]">{habit.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="badge-void">{habit.frequency}</span>
                    {linkedGoal && (
                      <span className="text-xs text-[#555]">→ {linkedGoal.emoji} {linkedGoal.name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 badge-gold">
                    <Zap size={10} />
                    <span>{habit.points_value}</span>
                  </div>
                  <button
                    onClick={() => deleteHabit.mutate(habit.id)}
                    disabled={deleteHabit.isPending}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[#444] hover:text-red-400 hover:bg-[rgba(255,32,32,0.1)] transition-all disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title="New Habit">
        <form onSubmit={handleCreate} className="space-y-4">
          {/* Emoji picker */}
          <div>
            <label className="text-xs text-[#666] mb-1.5 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  className={cn(
                    'w-9 h-9 rounded-lg text-lg transition-all',
                    form.emoji === e
                      ? 'bg-[rgba(108,99,255,0.3)] ring-1 ring-[#5548f5]'
                      : 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)]'
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[#666] mb-1.5 block">Habit name</label>
            <input
              className="input-field"
              placeholder="e.g. Morning workout, Read 20 pages..."
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#666] mb-1.5 block">Points value</label>
              <input
                type="number"
                min={1}
                max={500}
                className="input-field"
                value={form.points_value}
                onChange={e => setForm(f => ({ ...f, points_value: parseInt(e.target.value) || 10 }))}
              />
            </div>
            <div>
              <label className="text-xs text-[#666] mb-1.5 block">Frequency</label>
              <select
                className="input-field"
                value={form.frequency}
                onChange={e => setForm(f => ({ ...f, frequency: e.target.value as Habit['frequency'] }))}
              >
                {FREQ_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {goals.length > 0 && (
            <div>
              <label className="text-xs text-[#666] mb-1.5 block">Link to goal (optional)</label>
              <select
                className="input-field"
                value={form.goal_id}
                onChange={e => setForm(f => ({ ...f, goal_id: e.target.value }))}
              >
                <option value="">None</option>
                {goals.filter(g => !g.is_completed).map(g => (
                  <option key={g.id} value={g.id}>
                    {g.emoji} {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={handleCloseModal} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" disabled={createHabit.isPending} className="btn-primary flex-1">
              {createHabit.isPending ? 'Creating...' : 'Create Habit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
