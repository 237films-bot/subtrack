-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  logo TEXT NOT NULL DEFAULT 'sparkles',
  color TEXT NOT NULL DEFAULT '#6366f1',
  total_credits INTEGER NOT NULL DEFAULT 100,
  used_credits INTEGER NOT NULL DEFAULT 0,
  reset_day INTEGER NOT NULL DEFAULT 1,
  reset_type TEXT NOT NULL DEFAULT 'monthly',
  custom_reset_days INTEGER,
  url TEXT,
  notes TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create credit_history table
CREATE TABLE IF NOT EXISTS public.credit_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  previous_used INTEGER NOT NULL,
  new_used INTEGER NOT NULL,
  change INTEGER NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS credit_history_user_id_idx ON public.credit_history(user_id);
CREATE INDEX IF NOT EXISTS credit_history_subscription_id_idx ON public.credit_history(subscription_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_history ENABLE ROW LEVEL SECURITY;

-- Create policies for subscriptions table
-- Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions"
  ON public.subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for credit_history table
-- Users can only see their own credit history
CREATE POLICY "Users can view own credit history"
  ON public.credit_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own credit history
CREATE POLICY "Users can insert own credit history"
  ON public.credit_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own credit history
CREATE POLICY "Users can delete own credit history"
  ON public.credit_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscriptions table
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
