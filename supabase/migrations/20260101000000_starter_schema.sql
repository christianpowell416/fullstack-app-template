-- ===========================================
-- Starter Schema
-- ===========================================
-- A minimal database schema to get you started.
-- Run this as your first Supabase migration:
--   supabase migration new initial_schema
--   (paste this content into the generated file)
--   supabase db push

-- gen_random_uuid() is available by default in Supabase (pgcrypto)


-- ===========================================
-- PROFILES TABLE
-- ===========================================
-- Extends Supabase auth.users with app-specific profile data.
-- Automatically created when a user signs up (via trigger below).

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ===========================================
-- ADMIN USERS TABLE
-- ===========================================
-- Controls who can access the admin dashboard.
-- Add yourself after signing up:
--   INSERT INTO admin_users (id, role) VALUES ('your-user-uuid', 'admin');

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT DEFAULT 'admin'  -- 'admin' or other roles you define
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can read the admin_users table (to check their own access)
CREATE POLICY "Admins can check their own access"
  ON admin_users FOR SELECT
  USING (auth.uid() = id);


-- ===========================================
-- API USAGE TRACKING
-- ===========================================
-- Track daily AI API usage per user for cost management and rate limiting.
-- Accessed via SECURITY DEFINER RPCs (not direct client access).

CREATE TABLE IF NOT EXISTS user_daily_usage (
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  usage_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  image_count   INTEGER NOT NULL DEFAULT 0,
  ai_request_count INTEGER NOT NULL DEFAULT 0,
  total_cost_usd DECIMAL(10,4) NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, usage_date)
);

-- RLS enabled but no public policies — accessed only via SECURITY DEFINER RPCs
ALTER TABLE user_daily_usage ENABLE ROW LEVEL SECURITY;

-- Atomic check-and-increment function for rate limiting
-- Call this from your Edge Function before making an AI API call.
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_operation TEXT,        -- 'image_generation' | 'ai_request'
  p_cost_usd DECIMAL DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_daily_usage (user_id, usage_date, image_count, ai_request_count, total_cost_usd)
  VALUES (
    p_user_id,
    CURRENT_DATE,
    CASE WHEN p_operation = 'image_generation' THEN 1 ELSE 0 END,
    CASE WHEN p_operation = 'ai_request' THEN 1 ELSE 0 END,
    p_cost_usd
  )
  ON CONFLICT (user_id, usage_date) DO UPDATE SET
    image_count = user_daily_usage.image_count + CASE WHEN p_operation = 'image_generation' THEN 1 ELSE 0 END,
    ai_request_count = user_daily_usage.ai_request_count + CASE WHEN p_operation = 'ai_request' THEN 1 ELSE 0 END,
    total_cost_usd = user_daily_usage.total_cost_usd + p_cost_usd;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ===========================================
-- CLIENT ERROR LOGGING
-- ===========================================
-- Log errors from the mobile app for debugging.

CREATE TABLE IF NOT EXISTS client_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  stack TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE client_errors ENABLE ROW LEVEL SECURITY;

-- Users can insert their own errors
CREATE POLICY "Users can log errors"
  ON client_errors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for querying recent errors
CREATE INDEX idx_client_errors_created_at ON client_errors(created_at DESC);


-- ===========================================
-- ANONYMOUS RATE LIMITING
-- ===========================================
-- For pre-auth API calls (onboarding, etc.) — rate limit by IP.

CREATE TABLE IF NOT EXISTS anon_rate_limits (
  ip_address TEXT NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  request_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (ip_address, window_start)
);

CREATE OR REPLACE FUNCTION check_anon_rate_limit(
  ip_addr TEXT,
  max_requests INTEGER DEFAULT 20,
  window_seconds INTEGER DEFAULT 3600
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  window_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  window_start_time := NOW() - (window_seconds || ' seconds')::INTERVAL;

  -- Count recent requests
  SELECT COALESCE(SUM(request_count), 0) INTO current_count
  FROM anon_rate_limits
  WHERE ip_address = ip_addr
    AND window_start >= window_start_time;

  -- If over limit, deny
  IF current_count >= max_requests THEN
    RETURN FALSE;
  END IF;

  -- Log this request
  INSERT INTO anon_rate_limits (ip_address, window_start, request_count)
  VALUES (ip_addr, date_trunc('minute', NOW()), 1)
  ON CONFLICT (ip_address, window_start) DO UPDATE
    SET request_count = anon_rate_limits.request_count + 1;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ===========================================
-- STORAGE BUCKETS (run in Supabase Dashboard or via API)
-- ===========================================
-- Create these buckets in Supabase Dashboard → Storage:
--
-- 1. "avatars" (public) — User profile photos
-- 2. "images" (private) — App-generated images (use signed URLs)
--
-- Set appropriate RLS policies on each bucket.
