-- Run this in Supabase SQL Editor to enable per-user memory isolation.
-- Dashboard: https://supabase.com/dashboard → your project → SQL Editor

CREATE TABLE IF NOT EXISTS user_sessions (
  user_id   UUID PRIMARY KEY,
  assistant_id TEXT NOT NULL,
  thread_id    TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Allow the service role (backend) to read/write; block anon/public access.
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access" ON user_sessions
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
