import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

export function useStreak() {
  const { user } = useAuthStore()

  const streakQuery = useQuery({
    queryKey: ['streaks', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user!.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return data ?? { current_streak: 0, longest_streak: 0, last_active_date: null }
    },
    staleTime: 30000,
    gcTime: 60000,
    refetchInterval: 60 * 1000, // refresh every minute
  })

  return {
    currentStreak: streakQuery.data?.current_streak ?? 0,
    longestStreak: streakQuery.data?.longest_streak ?? 0,
    lastActiveDate: streakQuery.data?.last_active_date,
    isLoading: streakQuery.isLoading,
    isError: streakQuery.isError,
  }
}
