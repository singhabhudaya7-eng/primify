-- Finance module tables
-- Run this in your Supabase SQL Editor

-- ── user_finance_config ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_finance_config (
  user_id         UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  monthly_salary  NUMERIC NOT NULL DEFAULT 0,
  savings_goal    NUMERIC NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_finance_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own finance config"
  ON user_finance_config FOR ALL
  USING (auth.uid() = user_id);

-- ── finance_transactions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS finance_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount        NUMERIC NOT NULL,
  category      TEXT NOT NULL,
  description   TEXT,
  type          TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transactions"
  ON finance_transactions FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_user_date
  ON finance_transactions (user_id, date DESC);

-- Trigger for updated_at
CREATE TRIGGER set_user_finance_config_updated_at
  BEFORE UPDATE ON user_finance_config
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
