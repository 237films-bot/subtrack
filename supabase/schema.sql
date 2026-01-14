-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo TEXT,
  color TEXT NOT NULL,
  category TEXT NOT NULL,
  cost NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'custom')),
  custom_cycle_days INTEGER,
  renewal_date TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  url TEXT,
  notes TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Renewal history table
CREATE TABLE IF NOT EXISTS renewal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cost NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  note TEXT,
  was_auto_renewed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_enabled ON subscriptions(enabled);
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal_date ON subscriptions(renewal_date);
CREATE INDEX IF NOT EXISTS idx_renewal_history_subscription_id ON renewal_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_renewal_history_date ON renewal_history(date);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
-- Note: Since you're the only user, we'll keep it simple
-- You can make all data public or use API keys for authentication
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE renewal_history ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all operations
-- This is safe since you're using your own Supabase project
CREATE POLICY "Allow all operations on subscriptions" ON subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on renewal_history" ON renewal_history
  FOR ALL
  USING (true)
  WITH CHECK (true);
