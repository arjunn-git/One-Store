-- =============================================================================
-- Migration: 20261016000003_genuine_activity_events.sql
-- Description: Dedicated genuine activity stream and privacy-conscious active session tracking
-- =============================================================================

-- 1. Create activity_events table for genuine store events
CREATE TABLE IF NOT EXISTS public.activity_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_session_id TEXT,
  market TEXT NOT NULL CHECK (market IN ('IN', 'GB')),
  currency TEXT NOT NULL CHECK (currency IN ('INR', 'GBP')),
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- Telemetry indexing for high-frequency queries and filtering
CREATE INDEX IF NOT EXISTS idx_activity_events_created_at ON public.activity_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_type ON public.activity_events(type);
CREATE INDEX IF NOT EXISTS idx_activity_events_market ON public.activity_events(market);
CREATE INDEX IF NOT EXISTS idx_activity_events_session ON public.activity_events(anonymous_session_id);

-- RLS: Only authorized admins can view activity telemetry
CREATE POLICY "Admins can view all activity events"
  ON public.activity_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customer_profiles
      WHERE customer_profiles.auth_user_id = auth.uid()
      AND customer_profiles.role IN ('admin', 'owner', 'superadmin')
    )
  );

-- Service role full access for backend event recording
CREATE POLICY "Service role full access on activity_events"
  ON public.activity_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Create active_sessions table for genuine privacy-conscious visitor telemetry
CREATE TABLE IF NOT EXISTS public.active_sessions (
  session_id TEXT PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  market TEXT DEFAULT 'IN' CHECK (market IN ('IN', 'GB')),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_active_sessions_last_active ON public.active_sessions(last_active_at DESC);

CREATE POLICY "Service role full access on active_sessions"
  ON public.active_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable Supabase Realtime publication if available
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_events;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Publication adjustment is non-blocking if already added or restricted
    NULL;
END $$;
