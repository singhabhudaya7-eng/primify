import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'

export function useGoals() {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const goalsQuery = useQuery({
    queryKey: ['goals', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    staleTime: 30000,
    gcTime: 60000,
  })

  const createGoal = useMutation({
    mutationFn: async (input: {
      name: string
      description?: string
      target_value: number
      unit?: string
      emoji?: string
      deadline?: string
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('goals')
        .insert({ user_id: user.id, ...input })
        .select()
        .single()

      if (error) {
        console.error('Create goal error:', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', user?.id] })
      toast.success('Goal created! Time to conquer it.', { duration: 2000 })
    },
    onError: (err: Error) => {
      console.error('Create goal mutation error:', err)
      toast.error(err.message || 'Failed to create goal')
    },
  })

  const updateGoalProgress = useMutation({
    mutationFn: async ({ goalId, value }: { goalId: string; value: number }) => {
      const goal = goalsQuery.data?.find(g => g.id === goalId)
      if (!goal) throw new Error('Goal not found')

      const isCompleted = value >= goal.target_value
      const { error } = await supabase
        .from('goals')
        .update({ current_value: value, is_completed: isCompleted })
        .eq('id', goalId)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', user?.id] })
    },
    onError: (err: Error) => {
      console.error('Update goal error:', err)
      toast.error(err.message || 'Failed to update goal')
    },
  })

  const deleteGoal = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', goalId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', user?.id] })
      toast.success('Goal removed', { duration: 2000 })
    },
    onError: (err: Error) => {
      console.error('Delete goal error:', err)
      toast.error(err.message || 'Failed to delete goal')
    },
  })

  return {
    goals: goalsQuery.data ?? [],
    isLoading: goalsQuery.isLoading,
    isError: goalsQuery.isError,
    createGoal,
    updateGoalProgress,
    deleteGoal,
  }
}
