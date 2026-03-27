import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { todayStr, spawnFloatingText } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Habit } from '@/types/database'

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
    staleTime: 30000,
    gcTime: 60000,
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
    staleTime: 10000,
    gcTime: 30000,
  })

  const completedHabitIds = new Set(todayLogsQuery.data?.map(l => l.habit_id) ?? [])

  const completeHabit = useMutation({
    mutationFn: async ({ habitId, pointsValue, event }: { habitId: string; pointsValue: number; event?: MouseEvent }) => {
      if (completedHabitIds.has(habitId)) {
        throw new Error('Habit already completed today')
      }

      // Insert daily log
      const { error: logError } = await supabase.from('daily_logs').insert({
        user_id: user!.id,
        habit_id: habitId,
        date: todayStr(),
        points_earned: pointsValue,
      })
      if (logError) throw logError

      // Update total points on profile
      const newTotal = (profile?.total_points ?? 0) + pointsValue
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ total_points: newTotal })
        .eq('id', user!.id)
      if (profileError) throw profileError

      // Update streak
      await updateStreak()

      return { pointsValue, newTotal }
    },
    onSuccess: (data, variables) => {
      if (!data) return

      // Spawn floating +points text
      if (variables.event) {
        spawnFloatingText(`+${data.pointsValue} pts`, variables.event.clientX - 20, variables.event.clientY - 30, 'points')
      }

      // Update profile in store
      if (profile) {
        useAuthStore.getState().setProfile({ ...profile, total_points: data.newTotal })
      }

      // Invalidate queries
      qc.invalidateQueries({ queryKey: ['daily_logs', user?.id] })
      qc.invalidateQueries({ queryKey: ['streaks', user?.id] })

      toast.success(`+${data.pointsValue} points!`, { duration: 2000 })
    },
    onError: (err: Error) => {
      console.error('Complete habit error:', err)
      toast.error(err.message || 'Failed to complete habit')
    },
  })

  const createHabit = useMutation({
    mutationFn: async (input: { name: string; points_value: number; goal_id?: string; emoji?: string; frequency?: Habit['frequency'] }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('habits')
        .insert({ user_id: user.id, ...input })
        .select()
        .single()

      if (error) {
        console.error('Create habit error:', error)
        throw error
      }

      return data
    },
    onSuccess: (data) => {
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

      if (streakData?.last_active_date === today) return // already counted today
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
