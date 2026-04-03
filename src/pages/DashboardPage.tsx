import { useState } from 'react'
import { Flame, Zap, Trophy, TrendingUp, Plus, Check } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { useHabits } from '@/hooks/useHabits'
import { useStreak } from '@/hooks/useStreak'
import { useGoals } from '@/hooks/useGoals'
import { useGame } from '@/hooks/useGame'
import { cn, formatPoints, getStreakMessage, getProgressPercent, todayStr } from '@/lib/utils'
import { format } from 'date-fns'
import ProgressBar from '@/components/ui/ProgressBar'

export default function DashboardPage() {
  const { profile } = useAuthStore()
  const { habits, completedHabitIds, todayPoints, completeHabit, isLoading } = useHabits()
  const { currentStreak, longestStreak } = useStreak()
  const { goals } = useGoals()
  const { gameState } = useGame()

  const totalHabits = habits.length
  const completedToday = completedHabitIds.size
  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0

  const activeGoals = goals.filter(g => !g.is_completed).slice(0, 3)

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#dddaff]">
            {getGreeting()}, {profile?.username ?? 'Warrior'}
          </h1>
          <p className="text-[#666] text-sm mt-0.5">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-bold text-[#ffd933]">
            {formatPoints(profile?.total_points ?? 0)}
          </div>
          <div className="text-xs text-[#666] font-mono">total pts</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Flame size={18} className="text-orange-400" />}
          label="Streak"
          value={currentStreak > 0 ? `${currentStreak}d` : '—'}
          sub={getStreakMessage(currentStreak)}
          glow={currentStreak >= 7}
        />
        <StatCard
          icon={<Zap size={18} className="text-[#8b85ff]" />}
          label="Today"
          value={`+${todayPoints}`}
          sub="pts earned"
        />
        <StatCard
          icon={<Check size={18} className="text-green-400" />}
          label="Done"
          value={`${completedToday}/${totalHabits}`}
          sub="habits"
        />
        <StatCard
          icon={<Trophy size={18} className="text-[#ffd933]" />}
          label="Best"
          value={`${longestStreak}d`}
          sub="longest run"
        />
      </div>

      {/* Today's habits */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Today's Habits</h2>
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-mono', completionRate === 100 ? 'text-green-400' : 'text-[#666]')}>
              {completionRate}%
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-14 rounded-xl bg-[rgba(255,255,255,0.03)] animate-pulse" />
            ))}
          </div>
        ) : habits.length === 0 ? (
          <EmptyState
            emoji="✨"
            text="No habits yet"
            sub="Add habits to start earning points"
            linkTo="/habits"
            linkText="Add first habit"
          />
        ) : (
          <div className="space-y-2">
            {habits.map(habit => {
              const done = completedHabitIds.has(habit.id)
              return (
                <button
                  key={habit.id}
                  onClick={(e) => !done && completeHabit.mutate({
                    habitId: habit.id,
                    pointsValue: habit.points_value,
                    event: e.nativeEvent as MouseEvent,
                  })}
                  disabled={done || completeHabit.isPending}
                  className={cn(
                    'habit-check w-full text-left group',
                    done && 'completed opacity-70'
                  )}
                >
                  {/* Checkbox circle */}
                  <div className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200',
                    done
                      ? 'bg-[#5548f5] border-[#5548f5]'
                      : 'border-[rgba(108,99,255,0.3)] group-hover:border-[rgba(108,99,255,0.6)]'
                  )}>
                    {done && <Check size={12} className="text-white" />}
                  </div>

                  <span className="text-lg">{habit.emoji}</span>

                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium', done ? 'line-through text-[#555]' : 'text-[#dddaff]')}>
                      {habit.name}
                    </p>
                  </div>

                  <span className={cn('badge-gold text-xs flex-shrink-0', done && 'opacity-50')}>
                    +{habit.points_value}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Daily completion bar */}
        {habits.length > 0 && (
          <div className="mt-3">
            <ProgressBar value={completedToday} max={totalHabits} variant="void" size="sm" />
          </div>
        )}
      </div>

      {/* Goal progress */}
      {activeGoals.length > 0 && (
        <div>
          <h2 className="section-title mb-3">Goal Progress</h2>
          <div className="space-y-3">
            {activeGoals.map(goal => (
              <div key={goal.id} className="stat-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{goal.emoji}</span>
                    <span className="text-sm font-medium text-[#dddaff]">{goal.name}</span>
                  </div>
                  <span className="text-xs font-mono text-[#666]">
                    {goal.current_value}/{goal.target_value} {goal.unit}
                  </span>
                </div>
                <ProgressBar
                  value={goal.current_value}
                  max={goal.target_value}
                  variant="gold"
                  size="sm"
                  showLabel
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dragon status teaser */}
      {gameState && (
        <div className="stat-card border border-[rgba(255,32,32,0.15)] bg-[rgba(255,32,32,0.04)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-float">{gameState.dragon_emoji}</span>
              <div>
                <p className="text-sm font-medium text-[#dddaff]">{gameState.dragon_name}</p>
                <p className="text-xs text-red-400">Lv.{gameState.dragon_level} Boss</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono text-red-400">{gameState.dragon_hp}/{gameState.dragon_max_hp} HP</p>
              <ProgressBar
                value={gameState.dragon_hp}
                max={gameState.dragon_max_hp}
                variant="dragon"
                size="sm"
                className="w-28 mt-1"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function StatCard({ icon, label, value, sub, glow }: {
  icon: React.ReactNode; label: string; value: string; sub: string; glow?: boolean
}) {
  return (
    <div className={cn('stat-card text-center', glow && 'glow-ember border-orange-500/20')}>
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-lg font-mono font-bold text-[#dddaff]">{value}</div>
      <div className="text-xs text-[#666]">{sub}</div>
    </div>
  )
}

function EmptyState({ emoji, text, sub, linkTo, linkText }: {
  emoji: string; text: string; sub: string; linkTo?: string; linkText?: string
}) {
  return (
    <div className="text-center py-10 stat-card">
      <div className="text-4xl mb-2">{emoji}</div>
      <p className="text-[#dddaff] font-medium">{text}</p>
      <p className="text-[#555] text-sm mt-1">{sub}</p>
      {linkTo && (
        <a href={linkTo} className="inline-block mt-3 text-sm text-[#8b85ff] hover:underline">{linkText}</a>
      )}
    </div>
  )
}
