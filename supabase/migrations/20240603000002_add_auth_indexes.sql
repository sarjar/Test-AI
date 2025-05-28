-- Add composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_auth_events_type_success ON auth_events(event_type, success);
CREATE INDEX IF NOT EXISTS idx_auth_events_type_created_at ON auth_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_auth_events_user_id_created_at ON auth_events(user_id, created_at);

-- Add index for rate limit queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_action_identifier_created_at ON rate_limits(action, identifier, created_at);

-- Add index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_auth_events_cleanup ON auth_events(created_at) WHERE created_at < NOW() - INTERVAL '30 days';
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup ON rate_limits(created_at) WHERE created_at < NOW() - INTERVAL '24 hours';

-- Add function to automatically clean up old records
CREATE OR REPLACE FUNCTION cleanup_old_records()
RETURNS void AS $$
BEGIN
  -- Clean up auth events older than 30 days
  DELETE FROM auth_events
  WHERE created_at < NOW() - INTERVAL '30 days';

  -- Clean up rate limits older than 24 hours
  DELETE FROM rate_limits
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup every hour
SELECT cron.schedule(
  'cleanup-old-records',
  '0 * * * *',  -- Every hour
  $$SELECT cleanup_old_records()$$
); 