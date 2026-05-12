-- Gym / Muscle Progress tables migration
-- Run this once against your Supabase project

-- ── user_muscle_progress ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_muscle_progress (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  muscle_id   TEXT NOT NULL,
  total_xp    INTEGER NOT NULL DEFAULT 0,
  last_trained TIMESTAMPTZ,
  UNIQUE (user_id, muscle_id)
);

ALTER TABLE user_muscle_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Muscle progress is viewable by authenticated users"
  ON user_muscle_progress FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can upsert own muscle progress"
  ON user_muscle_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own muscle progress"
  ON user_muscle_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_muscle_progress_user
  ON user_muscle_progress (user_id);

-- ── workout_logs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workout_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  muscle_id  TEXT NOT NULL,
  xp_earned  INTEGER NOT NULL DEFAULT 100,
  logged_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout logs"
  ON workout_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout logs"
  ON workout_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_workout_logs_user
  ON workout_logs (user_id, logged_at DESC);
