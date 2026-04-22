import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { spawnFloatingText, getWeaponDamage } from '@/lib/utils'
import { WEAPON_MAP, DRAGONS, type Weapon } from '@/types/weapons'
import toast from 'react-hot-toast'

const LOOT_DROP_POINTS = 500
// Energy cost per weapon attack (all weapons require energy, no free attacks)
const WEAPON_ENERGY_COST = 1
// Damage per energy in the Energy Strike mode
const ENERGY_DMG_RATIO = 2

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

  // ── Weapon-based attack (costs 1 Energy + weapon's point cost) ─────────────
  const attackDragon = useMutation({
    mutationFn: async ({ weapon, event }: { weapon: Weapon; event?: MouseEvent }) => {
      const gs = gameQuery.data
      if (!gs) throw new Error('Game state not loaded')
      if (!profile) throw new Error('Profile not loaded')

      const energyAvailable = profile.energy_current ?? 0
      if (energyAvailable < WEAPON_ENERGY_COST) {
        throw new Error('No energy left! Complete habits to restore Energy before attacking.')
      }

      const currentPoints = profile.total_points
      if (weapon.cost_points > 0 && currentPoints < weapon.cost_points) {
        throw new Error(`Not enough points! Need ${weapon.cost_points} pts, you have ${currentPoints}`)
      }

      const { damage, isCrit } = getWeaponDamage(weapon, weapon.special)
      const newDragonHp = Math.max(0, gs.dragon_hp - damage)
      const dragonDefeated = newDragonHp === 0

      const newEnergy = energyAvailable - WEAPON_ENERGY_COST
      const newPoints = weapon.cost_points > 0 ? currentPoints - weapon.cost_points : currentPoints

      if (dragonDefeated) {
        const lootPoints = newPoints + LOOT_DROP_POINTS
        await triggerLootDrop(gs, lootPoints, newEnergy)
        return { damage, isCrit, dragonDefeated, newDragonHp, weapon, lootDrop: true }
      }

      // Update dragon HP + deduct energy (and points if weapon costs points)
      const { error: gsError } = await supabase
        .from('game_state')
        .update({ dragon_hp: newDragonHp })
        .eq('user_id', user!.id)
      if (gsError) throw gsError

      const profileUpdate: Record<string, number> = { energy_current: newEnergy }
      if (weapon.cost_points > 0) profileUpdate.total_points = newPoints

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', user!.id)
      if (profileError) throw profileError

      setProfile({ ...profile, energy_current: newEnergy, total_points: newPoints })
      return { damage, isCrit, dragonDefeated, newDragonHp, weapon, lootDrop: false }
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
        toast.success(`🏆 DRAGON DEFEATED! +${LOOT_DROP_POINTS}P LOOT DROP! Reward slot unlocked!`, { duration: 5000 })
        qc.invalidateQueries({ queryKey: ['profiles', user?.id] })
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

  // ── Energy Strike (1E = 2 DMG) ─────────────────────────────────────────────
  const energyAttack = useMutation({
    mutationFn: async ({ strikes, event }: { strikes: number; event?: MouseEvent }) => {
      const gs = gameQuery.data
      if (!gs) throw new Error('Game state not loaded')
      if (!profile) throw new Error('Profile not loaded')

      const energyAvailable = profile.energy_current ?? 0
      if (energyAvailable < strikes) {
        throw new Error(`Not enough energy! You have ${energyAvailable}E, need ${strikes}E.`)
      }

      const damage = strikes * ENERGY_DMG_RATIO
      const newDragonHp = Math.max(0, gs.dragon_hp - damage)
      const dragonDefeated = newDragonHp === 0
      const newEnergy = energyAvailable - strikes
      const newPoints = dragonDefeated ? (profile.total_points + LOOT_DROP_POINTS) : profile.total_points

      const { error: energyError } = await supabase
        .from('profiles')
        .update({ energy_current: newEnergy, ...(dragonDefeated ? { total_points: newPoints } : {}) })
        .eq('id', user!.id)
      if (energyError) throw energyError

      if (dragonDefeated) {
        await triggerLootDrop(gs, newPoints, newEnergy)
      } else {
        const { error } = await supabase
          .from('game_state')
          .update({ dragon_hp: newDragonHp })
          .eq('user_id', user!.id)
        if (error) throw error
      }

      setProfile({ ...profile, energy_current: newEnergy, total_points: newPoints })
      return { damage, dragonDefeated, newEnergy, strikes, lootDrop: dragonDefeated }
    },
    onSuccess: (result, variables) => {
      if (variables.event) {
        spawnFloatingText(
          `⚡ -${result.damage} DMG`,
          variables.event.clientX - 40,
          variables.event.clientY - 40,
          'damage'
        )
      }
      if (result.dragonDefeated) {
        toast.success(`🏆 DRAGON DEFEATED! +${LOOT_DROP_POINTS}P LOOT DROP! Reward slot unlocked!`, { duration: 5000 })
        qc.invalidateQueries({ queryKey: ['profiles', user?.id] })
      } else {
        toast.success(`⚡ Energy Strike! ${result.damage} damage dealt! (${result.strikes}E spent)`, { duration: 2000 })
      }
      qc.invalidateQueries({ queryKey: ['game_state', user?.id] })
    },
    onError: (err: Error) => {
      console.error('Energy attack error:', err)
      toast.error(err.message || 'Energy attack failed')
    },
  })

  // ── Energy → Points conversion (4E = 1P) ───────────────────────────────────
  const convertEnergyToPoints = useMutation({
    mutationFn: async (energyToConvert: number) => {
      if (!profile) throw new Error('Profile not loaded')
      const pointsGained = Math.floor(energyToConvert / 4)
      const energyCost = pointsGained * 4

      if (energyCost === 0) throw new Error('Need at least 4 Energy to convert.')
      if ((profile.energy_current ?? 0) < energyCost) {
        throw new Error(`Not enough energy. Need ${energyCost}E.`)
      }

      const newEnergy = (profile.energy_current ?? 0) - energyCost
      const newPoints = profile.total_points + pointsGained

      const { error } = await supabase
        .from('profiles')
        .update({ energy_current: newEnergy, total_points: newPoints })
        .eq('id', user!.id)
      if (error) throw error

      setProfile({ ...profile, energy_current: newEnergy, total_points: newPoints })
      return { pointsGained, energyCost, newEnergy, newPoints }
    },
    onSuccess: (result) => {
      toast.success(`Converted ${result.energyCost}E → +${result.pointsGained}P`, { duration: 2500 })
      qc.invalidateQueries({ queryKey: ['profiles', user?.id] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Conversion failed')
    },
  })

  // ── Shared: trigger loot drop when dragon is defeated ──────────────────────
  async function triggerLootDrop(gs: NonNullable<typeof gameQuery.data>, newPoints: number, newEnergy?: number) {
    const nextLevel = gs.dragon_level + 1
    const nextDragon = DRAGONS.find(d => d.level === nextLevel) ?? {
      name: `Ancient Wyrm Lv.${nextLevel}`,
      emoji: '🌌',
      level: nextLevel,
      base_hp: gs.dragon_max_hp * 1.5,
    }
    const newMaxHp = Math.floor(nextDragon.base_hp * (1 + gs.battles_won * 0.1))

    const [gsResult, profileResult] = await Promise.all([
      supabase
        .from('game_state')
        .update({
          dragon_name: nextDragon.name,
          dragon_hp: newMaxHp,
          dragon_max_hp: newMaxHp,
          dragon_level: nextLevel,
          dragon_strength: gs.dragon_strength + 3,
          dragon_emoji: nextDragon.emoji,
          battles_won: gs.battles_won + 1,
          reward_slots: (gs.reward_slots ?? 0) + 1,
        })
        .eq('user_id', user!.id),
      supabase
        .from('profiles')
        .update({
          total_points: newPoints,
          ...(newEnergy !== undefined ? { energy_current: newEnergy } : {}),
        })
        .eq('id', user!.id),
    ])

    if (gsResult.error) throw gsResult.error
    if (profileResult.error) throw profileResult.error

    if (profile) {
      setProfile({
        ...profile,
        total_points: newPoints,
        ...(newEnergy !== undefined ? { energy_current: newEnergy } : {}),
      })
    }
  }

  // ── Buy weapon (uses Points) ───────────────────────────────────────────────
  const buyWeapon = useMutation({
    mutationFn: async (weaponId: string) => {
      const weapon = WEAPON_MAP[weaponId]
      if (!weapon) throw new Error('Weapon not found')
      if (!profile) throw new Error('Profile not loaded')
      if (profile.total_points < weapon.cost_points) {
        throw new Error(`Need ${weapon.cost_points} pts, you have ${profile.total_points}`)
      }

      const existing = inventoryQuery.data?.find(i => i.weapon_id === weaponId)
      if (existing) {
        const { error } = await supabase
          .from('inventory')
          .update({ quantity: existing.quantity + 1 })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('inventory').insert({
          user_id: user!.id,
          weapon_id: weaponId,
          quantity: 1,
        })
        if (error) throw error
      }

      const newPoints = profile.total_points - weapon.cost_points
      const { error } = await supabase
        .from('profiles')
        .update({ total_points: newPoints })
        .eq('id', user!.id)
      if (error) throw error

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

  // ── Streak penalty (dragon heals on missed day) ────────────────────────────
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
    energyAttack,
    convertEnergyToPoints,
    buyWeapon,
    applyStreakPenalty,
    weaponEnergyCost: WEAPON_ENERGY_COST,
    energyDmgRatio: ENERGY_DMG_RATIO,
  }
}
