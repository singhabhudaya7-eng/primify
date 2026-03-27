export interface Habit {
  id: string
  user_id: string
  goal_id?: string | null
  name: string
  description?: string
  points_value: number
  emoji: string
  frequency: 'daily' | 'weekdays' | 'weekends'
  is_active: boolean
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  name: string
  description?: string
  target_value: number
  current_value: number
  unit: string
  emoji: string
  deadline?: string | null
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface DailyLog {
  id: string
  user_id: string
  habit_id: string
  date: string
  points_earned: number
  completed_at: string
}

export interface Streak {
  id: string
  user_id: string
  current_streak: number
  longest_streak: number
  last_active_date: string | null
  updated_at: string
}

export interface GameState {
  id: string
  user_id: string
  dragon_name: string
  dragon_hp: number
  dragon_max_hp: number
  dragon_level: number
  dragon_strength: number
  dragon_emoji: string
  player_hp: number
  player_max_hp: number
  battles_won: number
  updated_at: string
}

export interface Reward {
  id: string
  user_id: string
  name: string
  description?: string
  cost_points: number
  emoji: string
  times_redeemed: number
  created_at: string
}

export interface InventoryItem {
  id: string
  user_id: string
  weapon_id: string
  quantity: number
  acquired_at: string
}
