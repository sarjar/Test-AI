-- Create a function to ensure the rate_limits table exists
CREATE OR REPLACE FUNCTION ensure_rate_limits_table()
RETURNS void AS $$
DECLARE
  table_exists boolean;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'rate_limits'
  ) INTO table_exists;

  -- Create the table if it doesn't exist
  IF NOT table_exists THEN
    CREATE TABLE public.rate_limits (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      action TEXT NOT NULL,
      identifier TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Add indexes
    CREATE INDEX idx_rate_limits_action_identifier ON rate_limits(action, identifier);
    CREATE INDEX idx_rate_limits_created_at ON rate_limits(created_at);

    -- Enable RLS
    ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

    -- Create policy
    CREATE POLICY "Service role can manage rate limits"
      ON rate_limits FOR ALL
      USING (auth.role() = 'service_role');

    -- Grant permissions
    GRANT ALL ON rate_limits TO service_role;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema'; 