import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'

export function useRewards() {
  const { user, profile, setProfile } = useAuthStore()
  const qc = useQueryClient()

  const rewardsQuery = useQuery({
    queryKey: ['rewards', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('user_id', user!.id)
        .order('cost_points', { ascending: true })
      if (error) throw error
      return data || []
    },
    staleTime: 30000,
    gcTime: 60000,
  })

  const createReward = useMutation({
    mutationFn: async (input: { name: string; description?: string; cost_points: number; emoji?: string }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('rewards')
        .insert({ user_id: user.id, ...input })
        .select()
        .single()

      if (error) {
        console.error('Create reward error:', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rewards', user?.id] })
      toast.success('Reward added!', { duration: 2000 })
    },
    onError: (err: Error) => {
      console.error('Create reward mutation error:', err)
      toast.error(err.message || 'Failed to create reward')
    },
  })

  const redeemReward = useMutation({
    mutationFn: async (rewardId: string) => {
      const reward = rewardsQuery.data?.find(r => r.id === rewardId)
      if (!reward) throw new Error('Reward not found')
      if (!profile) throw new Error('Profile not loaded')
      if (profile.total_points < reward.cost_points) {
        throw new Error(`Need ${reward.cost_points} pts, you have ${profile.total_points}`)
      }

      // Deduct points
      const newPoints = profile.total_points - reward.cost_points
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ total_points: newPoints })
        .eq('id', user!.id)

      if (updateError) throw updateError

      // Record redemption
      const { error: redeemError } = await supabase.from('reward_redemptions').insert({
        user_id: user!.id,
        reward_id: rewardId,
        points_spent: reward.cost_points,
      })

      if (redeemError) throw redeemError

      // Increment times_redeemed
      const { error: incrementError } = await supabase
        .from('rewards')
        .update({
          times_redeemed: (reward.times_redeemed || 0) + 1,
        })
        .eq('id', rewardId)

      if (incrementError) throw incrementError

      setProfile({ ...profile, total_points: newPoints })
      return reward
    },
    onSuccess: (reward) => {
      qc.invalidateQueries({ queryKey: ['rewards', user?.id] })
      toast.success(`${reward.emoji} Enjoy your ${reward.name}! You earned it.`, { duration: 4000 })
    },
    onError: (err: Error) => {
      console.error('Redeem reward error:', err)
      toast.error(err.message || 'Failed to redeem reward')
    },
  })

  const deleteReward = useMutation({
    mutationFn: async (rewardId: string) => {
      const { error } = await supabase.from('rewards').delete().eq('id', rewardId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rewards', user?.id] })
      toast.success('Reward deleted', { duration: 2000 })
    },
    onError: (err: Error) => {
      console.error('Delete reward error:', err)
      toast.error(err.message || 'Failed to delete reward')
    },
  })

  return {
    rewards: rewardsQuery.data ?? [],
    isLoading: rewardsQuery.isLoading,
    isError: rewardsQuery.isError,
    createReward,
    redeemReward,
    deleteReward,
  }
}
