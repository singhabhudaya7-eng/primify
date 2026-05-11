import { useState } from 'react'
import { Plus, Trash2, Zap, Flame, Pencil } from 'lucide-react'
import { useHabits } from '@/hooks/useHabits'
import { useGoals } from '@/hooks/useGoals'
import Modal from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import type { Habit } from '@/types/database'

const EMOJI_OPTIONS = ['💪', '🏃', '📚', '🧘', '💧', '🥗', '😴', '💻', '🎯', '✍️', '🌅', '🧠', '💰', '🚫', '🎵']

const FREQ_OPTIONS: { value: Habit['frequency']; label: string }[] = [
  { value: 'daily',    label: 'Every day' },
  { value: 'weekdays', label: 'Weekdays (Mon–Fri)' },
  { value: 'weekends', label: 'Weekends (Sat–Sun)' },
  { value: 'custom',   label: 'Custom (pick days/week)' },
]

const BLANK_FORM = {
  name: '',
  points_value: 10,
  energy_value: 10,
  emoji: '💪',
  goal_id: '',
  frequency: 'daily' as Habit['frequency'],
  frequency_days: 3,
}

type HabitForm = typeof BLANK_FORM

function freqLabel(h: Habit): string {
  if (h.frequency === 'custom') return `${h.frequency_days ?? 3}d/week`
  if (h.frequency === 'weekdays') return 'weekdays'
  if (h.frequency === 'weekends') return 'weekends'
  return 'daily'
}

export default function HabitsPage() {
  const { habits, isLoading, createHabit, deleteHabit } = useHabits()
  const { goals } = useGoals()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<HabitForm>(BLANK_FORM)
  const [createError, setCreateError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function openModal() {
    setForm(BLANK_FORM)
    setCreateError('')
    setShowModal(true)
  }

  function closeModal() {
    if (isSubmitting) return
    setShowModal(false)
    setForm(BLANK_FORM)
    setCreateError('')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    setIsSubmitting(true)
    try {
      await createHabit.mutateAsync({
        name: form.name,
        points_value: form.points_value,
        energy_value: form.energy_value,
        emoji: form.emoji,
        goal_id: form.goal_id || undefined,
        frequency: form.frequency,
        frequency_days: form.frequency === 'custom' ? form.frequency_days : undefined,
      })
      setForm(BLANK_FORM)
      setShowModal(false)
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create habit. Check your connection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#dddaff]">Habits</h1>
          <p className="text-[#666] text-sm mt-0.5">Daily actions that build your power</p>
        </div>
        <button onClick={openModal} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          New Habit
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-[#555]">
        <div className="flex items-center gap-1">
          <Zap size={10} className="text-[#ffd933]" />
          <span>Points</span>
        </div>
        <div className="flex items-center gap-1">
          <Flame size={10} className="text-[#8b85ff]" />
          <span>Energy</span>
        </div>
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
          <p className="text-[#555] text-sm mt-1 mb-4">Create your first habit to start earning points & energy</p>
          <button onClick={openModal} className="btn-primary">Add First Habit</button>
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
                    <span className="badge-void">{freqLabel(habit)}</span>
                    {linkedGoal && (
                      <span className="text-xs text-[#555]">→ {linkedGoal.emoji} {linkedGoal.name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 badge-gold">
                    <Zap size={10} />
                    <span>{habit.points_value}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono"
                    style={{ background: 'rgba(139,133,255,0.15)', color: '#8b85ff' }}>
                    <Flame size={10} />
                    <span>{habit.energy_value ?? 10}E</span>
                  </div>
                  <button
                    onClick={() => deleteHabit.mutate(habit.id)}
                    disabled={deleteHabit.isPending}
                    className="md:opacity-0 md:group-hover:opacity-100 p-1.5 rounded-lg text-[#444] hover:text-red-400 hover:bg-[rgba(255,32,32,0.1)] transition-all disabled:opacity-50"
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
      <Modal isOpen={showModal} onClose={closeModal} title="New Habit">
        <form onSubmit={handleCreate} className="space-y-4">
          {/* Emoji picker */}
          <div>
            <label className="text-xs text-[#666] mb-1.5 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e} type="button"
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

          {/* Points + Energy */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#666] mb-1.5 block flex items-center gap-1">
                <Zap size={10} className="text-[#ffd933]" /> Points value
              </label>
              <input
                type="number" min={1} max={500} className="input-field"
                value={form.points_value}
                onChange={e => setForm(f => ({ ...f, points_value: parseInt(e.target.value) || 10 }))}
              />
            </div>
            <div>
              <label className="text-xs text-[#666] mb-1.5 block flex items-center gap-1">
                <Flame size={10} className="text-[#8b85ff]" /> Energy value
              </label>
              <input
                type="number" min={1} max={50} className="input-field"
                value={form.energy_value}
                onChange={e => setForm(f => ({ ...f, energy_value: parseInt(e.target.value) || 10 }))}
              />
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="text-xs text-[#666] mb-1.5 block">Frequency</label>
            <div className="grid grid-cols-2 gap-2">
              {FREQ_OPTIONS.map(o => (
                <button
                  key={o.value} type="button"
                  onClick={() => setForm(f => ({ ...f, frequency: o.value }))}
                  className={cn(
                    'py-2 px-3 rounded-xl text-xs text-left transition-all border',
                    form.frequency === o.value
                      ? 'bg-[rgba(108,99,255,0.2)] border-[rgba(108,99,255,0.5)] text-[#b9b5ff]'
                      : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#666] hover:border-[rgba(108,99,255,0.2)] hover:text-[#888]'
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {/* Custom days slider */}
            {form.frequency === 'custom' && (
              <div className="mt-3 p-3 rounded-xl bg-[rgba(108,99,255,0.08)] border border-[rgba(108,99,255,0.15)]">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-[#888]">Days per week</span>
                  <span className="font-mono font-bold text-[#b9b5ff]">{form.frequency_days} day{form.frequency_days !== 1 ? 's' : ''}/week</span>
                </div>
                <input
                  type="range" min={1} max={7}
                  value={form.frequency_days}
                  onChange={e => setForm(f => ({ ...f, frequency_days: parseInt(e.target.value) }))}
                  className="w-full accent-[#8b85ff]"
                />
                <div className="flex justify-between text-[10px] text-[#444] mt-1 font-mono">
                  <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span>
                </div>
              </div>
            )}
          </div>

          {/* Goal link */}
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
                  <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="p-3 rounded-xl bg-[rgba(139,133,255,0.08)] border border-[rgba(139,133,255,0.15)]">
            <p className="text-xs text-[#888]">
              <span className="text-[#b9b5ff] font-medium">Energy powers the Arena.</span>{' '}
              3-day streak = 1.2× boost  •  7-day streak = 1.5× boost
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={closeModal} disabled={isSubmitting} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? 'Creating...' : 'Create Habit'}
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
