-- ============================================================
-- PrimeOS — Warrior Energy System Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Add energy_value to habits (energy earned per completion)
ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS energy_value INTEGER NOT NULL DEFAULT 10;

-- Add energy_current to profiles (ephemeral daily energy pool)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS energy_current INTEGER NOT NULL DEFAULT 0;

-- Add reward_slots to game_state (unlocked by defeating dragons)
ALTER TABLE game_state
  ADD COLUMN IF NOT EXISTS reward_slots INTEGER NOT NULL DEFAULT 0;

-- Done ✅
-- After running this, restart your dev server so the new columns are picked up.
