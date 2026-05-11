-- ============================================================
-- PrimeOS — Gamified Life System
-- Supabase PostgreSQL Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  username    TEXT,
  avatar_url  TEXT,
  total_points INTEGER NOT NULL DEFAULT 0,
  level       INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ─────────────────────────────────────────
-- GOALS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  target_value    NUMERIC NOT NULL DEFAULT 100,
  current_value   NUMERIC NOT NULL DEFAULT 0,
  unit            TEXT NOT NULL DEFAULT '',
  emoji           TEXT NOT NULL DEFAULT '🎯',
  deadline        DATE,
  is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own goals"
  ON goals FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- HABITS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS habits (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_id       UUID REFERENCES goals(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  points_value  INTEGER NOT NULL DEFAULT 10,
  emoji         TEXT NOT NULL DEFAULT '💪',
  frequency     TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily','weekdays','weekends')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own habits"
  ON habits FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- DAILY LOGS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  habit_id      UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, habit_id, date)  -- Prevent double-completing
);

ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own daily logs"
  ON daily_logs FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- STREAKS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS streaks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak    INTEGER NOT NULL DEFAULT 0,
  longest_streak    INTEGER NOT NULL DEFAULT 0,
  last_active_date  DATE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own streak"
  ON streaks FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- GAME STATE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_state (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  dragon_name     TEXT NOT NULL DEFAULT 'Ignar the Weak',
  dragon_hp       INTEGER NOT NULL DEFAULT 100,
  dragon_max_hp   INTEGER NOT NULL DEFAULT 100,
  dragon_level    INTEGER NOT NULL DEFAULT 1,
  dragon_strength INTEGER NOT NULL DEFAULT 5,
  dragon_emoji    TEXT NOT NULL DEFAULT '🐲',
  player_hp       INTEGER NOT NULL DEFAULT 100,
  player_max_hp   INTEGER NOT NULL DEFAULT 100,
  battles_won     INTEGER NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own game state"
  ON game_state FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- INVENTORY
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weapon_id     TEXT NOT NULL,
  quantity      INTEGER NOT NULL DEFAULT 1,
  acquired_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, weapon_id)
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own inventory"
  ON inventory FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- REWARDS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rewards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  cost_points     INTEGER NOT NULL DEFAULT 100,
  emoji           TEXT NOT NULL DEFAULT '🎁',
  times_redeemed  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own rewards"
  ON rewards FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- REWARD REDEMPTIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id     UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  points_spent  INTEGER NOT NULL,
  redeemed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own redemptions"
  ON reward_redemptions FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- AUTO-UPDATE updated_at TRIGGER
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_game_state_updated_at
  BEFORE UPDATE ON game_state
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_streaks_updated_at
  BEFORE UPDATE ON streaks
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─────────────────────────────────────────
-- AUTO-CREATE PROFILE ON SIGNUP
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  -- Bootstrap streak
  INSERT INTO streaks (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;

  -- Bootstrap game state
  INSERT INTO game_state (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────
-- INDEXES FOR PERFORMANCE
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id) WHERE is_completed = FALSE;
CREATE INDEX IF NOT EXISTS idx_rewards_user ON rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory(user_id);

-- ─────────────────────────────────────────
-- DONE! ✅
-- ─────────────────────────────────────────
-- After running this:
-- 1. Go to Authentication > Settings and configure your site URL
-- 2. Copy your SUPABASE_URL and SUPABASE_ANON_KEY
-- 3. Create apps/web/.env with those values
-- ─────────────────────────────────────────