import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'

export interface TimerSession {
  id: string
  user_id: string
  task_name: string
  mode: 'stopwatch' | 'countdown'
  target_seconds: number
  elapsed_seconds: number
  completed: boolean
  points_earned: number
  energy_earned: number
  created_at: string
}

function calculateReward(targetSeconds: number) {
  const minutes = targetSeconds / 60
  const pointsEarned = Math.max(5, Math.round(minutes * 2))
  const energyEarned = Math.max(2, Math.round(minutes * 1))
  return { pointsEarned, energyEarned }
}

export function useTimer() {
  const { user, profile, setProfile } = useAuthStore()
  const qc = useQueryClient()

  const sessionsQuery = useQuery({
    queryKey: ['timer_sessions', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timer_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw error
      return (data || []) as TimerSession[]
    },
  })

  const finishSession = useMutation({
    mutationFn: async (input: {
      taskName: string
      mode: 'stopwatch' | 'countdown'
      targetSeconds: number
      elapsedSeconds: number
    }) => {
      if (!user?.id) throw new Error('User not authenticated')

      const completed = input.elapsedSeconds >= input.targetSeconds
      const { pointsEarned, energyEarned } = completed
        ? calculateReward(input.targetSeconds)
        : { pointsEarned: 0, energyEarned: 0 }

      const { data, error } = await supabase
        .from('timer_sessions')
        .insert({
          user_id: user.id,
          task_name: input.taskName,
          mode: input.mode,
          target_seconds: input.targetSeconds,
          elapsed_seconds: input.elapsedSeconds,
          completed,
          points_earned: pointsEarned,
          energy_earned: energyEarned,
        })
        .select()
        .single()
      if (error) throw error

      if (completed && profile) {
        const newTotal = (profile.total_points ?? 0) + pointsEarned
        const newEnergy = (profile.energy_current ?? 0) + energyEarned
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ total_points: newTotal, energy_current: newEnergy })
          .eq('id', user.id)
        if (profileError) throw profileError
        setProfile({ ...profile, total_points: newTotal, energy_current: newEnergy })
      }

      return { session: data as TimerSession, completed, pointsEarned, energyEarned }
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['timer_sessions', user?.id] })
      if (result.completed) {
        toast.success(`🎯 Session complete! +${result.pointsEarned} pts  ⚡+${result.energyEarned}E`, { duration: 3000 })
      } else {
        toast('Session saved (goal not reached — no reward)', { duration: 2500 })
      }
    },
    onError: (err: Error) => {
      console.error('Finish timer session error:', err)
      toast.error(err.message || 'Failed to save session')
    },
  })

  return {
    sessions: sessionsQuery.data ?? [],
    isLoading: sessionsQuery.isLoading,
    isError: sessionsQuery.isError,
    finishSession,
  }
}
