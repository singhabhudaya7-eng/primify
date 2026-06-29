import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { todayStr, spawnFloatingText, getStreakMultiplier } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Habit } from '@/types/database'

// Aborts the actual request on timeout (instead of racing it and abandoning
// it mid-flight, which let the insert silently complete server-side and
// produced duplicate rows when the user retried after a false "timed out").
async function withAbortTimeout<T>(
  build: (signal: AbortSignal) => PromiseLike<T>,
  ms = 15000
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ms)
  try {
    return await build(controller.signal)
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error('Request timed out — check your connection and try again.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

export function useHabits() {
  const { user, profile, setProfile } = useAuthStore()
  const qc = useQueryClient()

  const habitsQuery = useQuery({
    queryKey: ['habits', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data || []
    },
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  })

  const todayLogsQuery = useQuery({
    queryKey: ['daily_logs', user?.id, todayStr()],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user!.id)
        .eq('date', todayStr())
      if (error) throw error
      return data || []
    },
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  })

  const completedHabitIds = new Set(todayLogsQuery.data?.map(l => l.habit_id) ?? [])

  const completeHabit = useMutation({
    mutationFn: async ({ habitId, pointsValue, energyValue, event }: {
      habitId: string
      pointsValue: number
      energyValue: number
      event?: MouseEvent
    }) => {
      if (completedHabitIds.has(habitId)) {
        throw new Error('Habit already completed today')
      }

      // Read current streak to apply multiplier
      const { data: streakData } = await supabase
        .from('streaks')
        .select('current_streak')
        .eq('user_id', user!.id)
        .single()

      const currentStreak = streakData?.current_streak ?? 0
      const multiplier = getStreakMultiplier(currentStreak)
      const energyEarned = Math.round(energyValue * multiplier)

      // Insert daily log
      const { error: logError } = await supabase.from('daily_logs').insert({
        user_id: user!.id,
        habit_id: habitId,
        date: todayStr(),
        points_earned: pointsValue,
      })
      if (logError) throw logError

      // Update profile: points + energy
      const newTotal = (profile?.total_points ?? 0) + pointsValue
      const newEnergy = (profile?.energy_current ?? 0) + energyEarned
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ total_points: newTotal, energy_current: newEnergy })
        .eq('id', user!.id)
      if (profileError) throw profileError

      await updateStreak()

      return { pointsValue, energyEarned, newTotal, newEnergy, multiplier }
    },
    onSuccess: (data, variables) => {
      if (!data) return

      if (variables.event) {
        spawnFloatingText(`+${data.pointsValue} pts`, variables.event.clientX - 20, variables.event.clientY - 30, 'points')
        spawnFloatingText(`⚡+${data.energyEarned}E`, variables.event.clientX + 30, variables.event.clientY - 50, 'damage')
      }

      if (profile) {
        useAuthStore.getState().setProfile({
          ...profile,
          total_points: data.newTotal,
          energy_current: data.newEnergy,
        })
      }

      qc.invalidateQueries({ queryKey: ['daily_logs', user?.id] })
      qc.invalidateQueries({ queryKey: ['streaks', user?.id] })

      const multiplierLabel = data.multiplier > 1 ? ` (${data.multiplier}x streak!)` : ''
      toast.success(`+${data.pointsValue} pts  ⚡+${data.energyEarned}E${multiplierLabel}`, { duration: 2500 })
    },
    onError: (err: Error) => {
      console.error('Complete habit error:', err)
      toast.error(err.message || 'Failed to complete habit')
    },
  })

  const createHabit = useMutation({
    mutationFn: async (input: {
      name: string
      points_value: number
      energy_value: number
      goal_id?: string
      emoji?: string
      frequency?: Habit['frequency']
      frequency_days?: number
    }) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await withAbortTimeout<{ data: Habit | null; error: Error | null }>(signal =>
        supabase.from('habits').insert({ user_id: user.id, ...input }).select().abortSignal(signal).single()
      )

      if (error) {
        console.error('Create habit error:', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits', user?.id] })
      toast.success('Habit created!', { duration: 2000 })
    },
    onError: (err: Error) => {
      console.error('Create habit mutation error:', err)
      toast.error(err.message || 'Failed to create habit')
    },
  })

  const deleteHabit = useMutation({
    mutationFn: async (habitId: string) => {
      const { error } = await supabase
        .from('habits')
        .update({ is_active: false })
        .eq('id', habitId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits', user?.id] })
      toast.success('Habit removed', { duration: 2000 })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete habit')
    },
  })

  async function updateStreak() {
    try {
      const { data: streakData } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user!.id)
        .single()

      const today = todayStr()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      let newStreak = 1
      let longest = streakData?.longest_streak ?? 0

      if (streakData?.last_active_date === today) return
      if (streakData?.last_active_date === yesterdayStr) {
        newStreak = (streakData.current_streak ?? 0) + 1
      }

      longest = Math.max(longest, newStreak)

      await supabase.from('streaks').upsert(
        {
          user_id: user!.id,
          current_streak: newStreak,
          longest_streak: longest,
          last_active_date: today,
        },
        { onConflict: 'user_id' }
      )
    } catch (err) {
      console.error('Update streak error:', err)
    }
  }

  const todayPoints = todayLogsQuery.data?.reduce((sum, l) => sum + l.points_earned, 0) ?? 0

  return {
    habits: habitsQuery.data ?? [],
    isLoading: habitsQuery.isLoading,
    isError: habitsQuery.isError,
    completedHabitIds,
    todayPoints,
    completeHabit,
    createHabit,
    deleteHabit,
    refetch: habitsQuery.refetch,
  }
}
