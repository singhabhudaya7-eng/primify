import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { spawnFloatingText, getWeaponDamage } from '@/lib/utils'
import { WEAPON_MAP, DRAGONS, type Weapon } from '@/types/weapons'
import toast from 'react-hot-toast'

export function useGame() {
  const { user, profile, setProfile } = useAuthStore()
  const qc = useQueryClient()

  const gameQuery = useQuery({
    queryKey: ['game_state', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_state')
        .select('*')
        .eq('user_id', user!.id)
        .single()
      if (error) throw error
      return data
    },
    staleTime: 5000,
    gcTime: 15000,
  })

  const inventoryQuery = useQuery({
    queryKey: ['inventory', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user!.id)
      if (error) throw error
      return data || []
    },
    staleTime: 30000,
    gcTime: 60000,
  })

  const attackDragon = useMutation({
    mutationFn: async ({ weapon, event }: { weapon: Weapon; event?: MouseEvent }) => {
      const gs = gameQuery.data
      if (!gs) throw new Error('Game state not loaded')
      if (!profile) throw new Error('Profile not loaded')

      const currentPoints = profile.total_points
      if (weapon.cost_points > 0 && currentPoints < weapon.cost_points) {
        throw new Error(`Not enough points! Need ${weapon.cost_points} pts, you have ${currentPoints}`)
      }

      const { damage, isCrit } = getWeaponDamage(weapon, weapon.special)
      const newDragonHp = Math.max(0, gs.dragon_hp - damage)
      const dragonDefeated = newDragonHp === 0

      // Deduct points if weapon costs points
      const newPoints = weapon.cost_points > 0 ? currentPoints - weapon.cost_points : currentPoints

      // Update game state
      if (dragonDefeated) {
        // Progress to next dragon
        const nextLevel = gs.dragon_level + 1
        const nextDragon = DRAGONS.find(d => d.level === nextLevel) ?? {
          name: `Ancient Wyrm Lv.${nextLevel}`,
          emoji: '🌌',
          level: nextLevel,
          base_hp: gs.dragon_max_hp * 1.5,
        }
        const newMaxHp = Math.floor(nextDragon.base_hp * (1 + gs.battles_won * 0.1))

        const { error: updateError } = await supabase
          .from('game_state')
          .update({
            dragon_name: nextDragon.name,
            dragon_hp: newMaxHp,
            dragon_max_hp: newMaxHp,
            dragon_level: nextLevel,
            dragon_strength: gs.dragon_strength + 3,
            dragon_emoji: nextDragon.emoji,
            battles_won: gs.battles_won + 1,
          })
          .eq('user_id', user!.id)

        if (updateError) throw updateError
      } else {
        const { error: updateError } = await supabase
          .from('game_state')
          .update({
            dragon_hp: newDragonHp,
          })
          .eq('user_id', user!.id)

        if (updateError) throw updateError
      }

      // Update points
      if (weapon.cost_points > 0) {
        const { error: pointsError } = await supabase
          .from('profiles')
          .update({ total_points: newPoints })
          .eq('id', user!.id)

        if (pointsError) throw pointsError

        setProfile({ ...profile, total_points: newPoints })
      }

      return { damage, isCrit, dragonDefeated, newDragonHp, weapon }
    },
    onSuccess: (result, variables) => {
      if (variables.event) {
        spawnFloatingText(
          `${result.isCrit ? '💥 CRIT! ' : ''}-${result.damage}`,
          variables.event.clientX - 30,
          variables.event.clientY - 40,
          'damage'
        )
      }
      if (result.dragonDefeated) {
        toast.success('🏆 DRAGON DEFEATED! You level up!', { duration: 4000 })
      } else if (result.isCrit) {
        toast.success(`💥 Critical hit! ${result.damage} damage!`, { duration: 2000 })
      }
      qc.invalidateQueries({ queryKey: ['game_state', user?.id] })
    },
    onError: (err: Error) => {
      console.error('Attack dragon error:', err)
      toast.error(err.message || 'Failed to attack dragon')
    },
  })

  const buyWeapon = useMutation({
    mutationFn: async (weaponId: string) => {
      const weapon = WEAPON_MAP[weaponId]
      if (!weapon) throw new Error('Weapon not found')
      if (!profile) throw new Error('Profile not loaded')
      if (profile.total_points < weapon.cost_points) {
        throw new Error(`Need ${weapon.cost_points} pts, you have ${profile.total_points}`)
      }

      // Check if already owned
      const existing = inventoryQuery.data?.find(i => i.weapon_id === weaponId)
      if (existing) {
        // Increment quantity
        const { error: updateError } = await supabase
          .from('inventory')
          .update({ quantity: existing.quantity + 1 })
          .eq('id', existing.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from('inventory').insert({
          user_id: user!.id,
          weapon_id: weaponId,
          quantity: 1,
        })

        if (insertError) throw insertError
      }

      const newPoints = profile.total_points - weapon.cost_points
      const { error: pointsError } = await supabase
        .from('profiles')
        .update({ total_points: newPoints })
        .eq('id', user!.id)

      if (pointsError) throw pointsError

      setProfile({ ...profile, total_points: newPoints })

      return weapon
    },
    onSuccess: (weapon) => {
      qc.invalidateQueries({ queryKey: ['inventory', user?.id] })
      toast.success(`${weapon.emoji} ${weapon.name} acquired!`, { duration: 2000 })
    },
    onError: (err: Error) => {
      console.error('Buy weapon error:', err)
      toast.error(err.message || 'Failed to buy weapon')
    },
  })

  // Penalize dragon when streak is broken
  const applyStreakPenalty = useMutation({
    mutationFn: async () => {
      const gs = gameQuery.data
      if (!gs) return

      const hpBoost = Math.floor(gs.dragon_max_hp * 0.15)
      const { error } = await supabase
        .from('game_state')
        .update({
          dragon_hp: Math.min(gs.dragon_hp + hpBoost, gs.dragon_max_hp * 1.5),
          dragon_max_hp: Math.floor(gs.dragon_max_hp * 1.1),
          dragon_strength: gs.dragon_strength + 2,
        })
        .eq('user_id', user!.id)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['game_state', user?.id] })
      toast.error('💀 Streak broken! The dragon grows stronger...', { duration: 5000 })
    },
    onError: (err: Error) => {
      console.error('Apply streak penalty error:', err)
    },
  })

  const ownedWeaponIds = new Set(inventoryQuery.data?.map(i => i.weapon_id) ?? [])

  return {
    gameState: gameQuery.data,
    inventory: inventoryQuery.data ?? [],
    ownedWeaponIds,
    isLoading: gameQuery.isLoading,
    isError: gameQuery.isError,
    attackDragon,
    buyWeapon,
    applyStreakPenalty,
  }
}
