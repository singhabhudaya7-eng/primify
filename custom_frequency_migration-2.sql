-- ============================================================
-- PrimeOS — Custom Habit Frequency Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Drop existing frequency check constraint and add 'custom' option
ALTER TABLE habits DROP CONSTRAINT IF EXISTS habits_frequency_check;
ALTER TABLE habits ADD CONSTRAINT habits_frequency_check
  CHECK (frequency IN ('daily', 'weekdays', 'weekends', 'custom'));

-- Add frequency_days: used when frequency = 'custom' (1-7 days per week)
ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS frequency_days INTEGER
  CHECK (frequency_days IS NULL OR (frequency_days >= 1 AND frequency_days <= 7));

-- Done ✅
