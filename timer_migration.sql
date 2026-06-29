-- Timer module table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS timer_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_name       TEXT NOT NULL,
  mode            TEXT NOT NULL CHECK (mode IN ('stopwatch', 'countdown')),
  target_seconds  INTEGER NOT NULL,
  elapsed_seconds INTEGER NOT NULL,
  completed       BOOLEAN NOT NULL DEFAULT FALSE,
  points_earned   INTEGER NOT NULL DEFAULT 0,
  energy_earned   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE timer_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own timer sessions"
  ON timer_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_timer_sessions_user_created
  ON timer_sessions (user_id, created_at DESC);
