-- Create agent_interactions table
CREATE TABLE IF NOT EXISTS agent_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    preferences JSONB DEFAULT '{}',
    status TEXT NOT NULL,
    result JSONB,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agent_interactions_user_id ON agent_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_created_at ON agent_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_status ON agent_interactions(status);

-- Add RLS policies
ALTER TABLE agent_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agent interactions"
    ON agent_interactions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent interactions"
    ON agent_interactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_agent_interactions_updated_at
    BEFORE UPDATE ON agent_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 