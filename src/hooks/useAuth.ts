import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

export function useAuth() {
  const store = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    // Use store-level flag so remounts don't re-run init
    if (useAuthStore.getState().initStarted) return
    useAuthStore.setState({ initStarted: true })

    const timeoutId = setTimeout(() => {
      console.warn('[PrimeOS] Auth init timed out')
      useAuthStore.setState({ isLoading: false, isInitialized: true })
    }, 5000)

    async function initAuth() {
      console.log('[PrimeOS] Starting auth init...')
      try {
        useAuthStore.setState({ isLoading: true })
        console.log('[PrimeOS] Calling getSession...')

        const { data: { session: sess } } = await supabase.auth.getSession()
        console.log('[PrimeOS] Session result:', sess)

        useAuthStore.setState({ session: sess, user: sess?.user ?? null })

        if (sess?.user) {
          console.log('[PrimeOS] Has user, fetching profile...')
          await fetchProfile(sess.user.id)
        } else {
          console.log('[PrimeOS] No user, going to auth page...')
          useAuthStore.setState({ isLoading: false, isInitialized: true })
        }
      } catch (err) {
        console.error('[PrimeOS] Auth init error:', err)
        useAuthStore.setState({ isLoading: false, isInitialized: true })
      } finally {
        clearTimeout(timeoutId)
      }
    }

    initAuth()

    return () => { clearTimeout(timeoutId) }
  }, [])

  const setupSubscriptionRef = useRef(false)

  useEffect(() => {
    if (!store.isInitialized || setupSubscriptionRef.current) return
    setupSubscriptionRef.current = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[PrimeOS] Auth state change:', event)
        useAuthStore.setState({ session, user: session?.user ?? null })

        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          useAuthStore.setState({
            user: null, session: null, profile: null, isLoading: false,
            initStarted: false, fetchingProfile: false,
          })
        }

        if (event === 'SIGNED_IN' && session?.user) {
          navigate('/dashboard', { replace: true })
        } else if (event === 'SIGNED_OUT') {
          navigate('/auth', { replace: true })
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
      setupSubscriptionRef.current = false
    }
  }, [store.isInitialized, navigate])

  async function fetchProfile(userId: string) {
    if (useAuthStore.getState().fetchingProfile) return
    useAuthStore.setState({ fetchingProfile: true })

    try {
      console.log('[PrimeOS] Querying profiles table...')
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      console.log('[PrimeOS] Profile result:', { data, error })

      if (error && error.code === 'PGRST116') {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({ id: user.id, email: user.email!, total_points: 0, level: 1 })
            .select()
            .single()
          if (newProfile) {
            useAuthStore.setState({ profile: newProfile })
            await bootstrapNewUser(user.id)
          }
        }
      } else if (data) {
        useAuthStore.setState({ profile: data })
      }
    } catch (err) {
      console.error('[PrimeOS] Profile fetch failed:', err)
    } finally {
      useAuthStore.setState({ fetchingProfile: false, isLoading: false, isInitialized: true })
      console.log('[PrimeOS] Done — initialized!')
    }
  }

  async function bootstrapNewUser(userId: string) {
    try {
      await supabase.from('streaks').upsert(
        { user_id: userId, current_streak: 0, longest_streak: 0 },
        { onConflict: 'user_id' }
      )
      await supabase.from('game_state').upsert(
        {
          user_id: userId,
          dragon_name: 'Ignar the Weak',
          dragon_hp: 100,
          dragon_max_hp: 100,
          dragon_level: 1,
          dragon_strength: 5,
          dragon_emoji: '🐲',
          player_hp: 100,
          player_max_hp: 100,
          battles_won: 0,
        },
        { onConflict: 'user_id' }
      )
      await supabase.from('rewards').insert([
        { user_id: userId, name: 'Eat Out', description: 'Treat yourself to a meal out', cost_points: 150, emoji: '🍜' },
        { user_id: userId, name: 'Chill Day', description: 'A full guilt-free rest day', cost_points: 300, emoji: '😌' },
        { user_id: userId, name: 'Buy Something', description: "Something you've been wanting", cost_points: 500, emoji: '🛍️' },
        { user_id: userId, name: 'Gaming Session', description: '2 hours of guilt-free gaming', cost_points: 100, emoji: '🎮' },
      ])
    } catch (err) {
      console.error('[PrimeOS] Bootstrap error:', err)
    }
  }

  async function signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    if (error) throw error
    return data
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { ...store, signUp, signIn, signOut }
}
