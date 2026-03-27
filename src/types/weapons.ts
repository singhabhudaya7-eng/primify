export interface Weapon {
  id: string
  name: string
  emoji: string
  description: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  damage_min: number
  damage_max: number
  cost_points: number
  special?: string
}

export const WEAPONS: Weapon[] = [
  {
    id: 'stone_fist',
    name: 'Stone Fist',
    emoji: '👊',
    description: 'Your bare hands. Always available, zero cost.',
    rarity: 'common',
    damage_min: 5,
    damage_max: 12,
    cost_points: 0,
  },
  {
    id: 'iron_blade',
    name: 'Iron Blade',
    emoji: '🗡️',
    description: 'A basic iron sword. Reliable damage.',
    rarity: 'uncommon',
    damage_min: 15,
    damage_max: 28,
    cost_points: 50,
  },
  {
    id: 'flame_staff',
    name: 'Flame Staff',
    emoji: '🔥',
    description: 'Channels fire energy. Burns the dragon for extra damage.',
    rarity: 'rare',
    damage_min: 30,
    damage_max: 55,
    cost_points: 100,
    special: 'Burns for 10% bonus damage',
  },
  {
    id: 'thunder_axe',
    name: 'Thunder Axe',
    emoji: '⚡',
    description: 'Strikes with lightning. High crit chance.',
    rarity: 'epic',
    damage_min: 45,
    damage_max: 80,
    cost_points: 200,
    special: 'Crit — 30% chance for 1.8× damage',
  },
  {
    id: 'void_blade',
    name: 'Void Blade',
    emoji: '🌌',
    description: 'A weapon forged from pure discipline. Devastating.',
    rarity: 'legendary',
    damage_min: 80,
    damage_max: 150,
    cost_points: 500,
    special: 'Crit — guaranteed bonus on first strike',
  },
]

export const WEAPON_MAP: Record<string, Weapon> = Object.fromEntries(
  WEAPONS.map(w => [w.id, w])
)

export const RARITY_COLORS: Record<Weapon['rarity'], string> = {
  common:    'text-[#888]',
  uncommon:  'text-green-400',
  rare:      'text-blue-400',
  epic:      'text-purple-400',
  legendary: 'text-[#ffd933]',
}

export const RARITY_GLOW: Record<Weapon['rarity'], string> = {
  common:    '',
  uncommon:  '',
  rare:      '',
  epic:      'border-purple-500/20',
  legendary: 'border-yellow-500/20 shadow-[0_0_12px_rgba(255,217,51,0.1)]',
}

export const DRAGONS = [
  { level: 1,  name: 'Ignar the Weak',    emoji: '🐲', base_hp: 100  },
  { level: 2,  name: 'Scorch the Hungry', emoji: '🔥', base_hp: 200  },
  { level: 3,  name: 'Venom Fang',        emoji: '🐉', base_hp: 350  },
  { level: 4,  name: 'Ironscale',         emoji: '⚔️', base_hp: 550  },
  { level: 5,  name: 'The Ashen King',    emoji: '👑', base_hp: 800  },
  { level: 6,  name: 'Umbral Wyrm',       emoji: '🌑', base_hp: 1200 },
  { level: 7,  name: 'Chaos Serpent',     emoji: '🌪️', base_hp: 1700 },
  { level: 8,  name: 'The Void Dragon',   emoji: '🌌', base_hp: 2500 },
]
