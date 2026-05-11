import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'

export interface Profile {
  id: string
  email: string
  username?: string
  avatar_url?: string
  total_points: number
  energy_current: number
  level: number
  created_at: string
  updated_at: string
}

interface AuthStore {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  isInitialized: boolean
  initStarted: boolean
  fetchingProfile: boolean
  setUser: (u: User | null) => void
  setSession: (s: Session | null) => void
  setProfile: (p: Profile | null) => void
  setLoading: (v: boolean) => void
  setInitialized: (v: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isInitialized: false,
  initStarted: false,
  fetchingProfile: false,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  reset: () => set({ user: null, session: null, profile: null, isLoading: false }),
}))

interface MuscleStore {
  progress: Record<string, number>
  lastTrained: Record<string, string>
  loading: boolean
  isInitialized: boolean
  setProgress: (p: Record<string, number>) => void
  setLastTrained: (lt: Record<string, string>) => void
  setLoading: (l: boolean) => void
}

export const useMuscleStore = create<MuscleStore>((set) => ({
  progress: {},
  lastTrained: {},
  loading: true,
  isInitialized: false,
  setProgress: (progress) => set({ progress, isInitialized: true }),
  setLastTrained: (lastTrained) => set({ lastTrained }),
  setLoading: (loading) => set({ loading }),
}))
