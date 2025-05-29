-- Fix rate_limits table structure and policies

-- Drop existing table if it exists
DROP TABLE IF EXISTS rate_limits;

-- Create rate_limits table with proper structure
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  identifier TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_action_identifier ON rate_limits(action, identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_created_at ON rate_limits(created_at);

-- Create or replace the ensure_rate_limits_table function
CREATE OR REPLACE FUNCTION ensure_rate_limits_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function ensures the rate_limits table exists
  -- The table is already created above, so this is just a placeholder
  -- for compatibility with existing code
  NULL;
END;
$$;

-- Enable realtime (only if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'rate_limits'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE rate_limits;
  END IF;
END $$;