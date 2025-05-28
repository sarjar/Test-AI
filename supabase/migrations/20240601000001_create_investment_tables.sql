-- Create investment_preferences table
CREATE TABLE IF NOT EXISTS investment_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sectors TEXT[] NOT NULL DEFAULT ARRAY['Technology', 'Finance', 'Energy']::TEXT[],
  regions TEXT[] NOT NULL DEFAULT ARRAY['USA', 'Global']::TEXT[],
  yield_min NUMERIC NOT NULL DEFAULT 2.0,
  yield_max NUMERIC NOT NULL DEFAULT 8.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create research_reports table
CREATE TABLE IF NOT EXISTS research_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  top_picks JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_sent BOOLEAN DEFAULT FALSE
);

-- Enable RLS on tables
ALTER TABLE investment_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for investment_preferences
DROP POLICY IF EXISTS "Users can view their own preferences" ON investment_preferences;
CREATE POLICY "Users can view their own preferences"
  ON investment_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON investment_preferences;
CREATE POLICY "Users can update their own preferences"
  ON investment_preferences FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON investment_preferences;
CREATE POLICY "Users can insert their own preferences"
  ON investment_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policies for research_reports
DROP POLICY IF EXISTS "Users can view their own reports" ON research_reports;
CREATE POLICY "Users can view their own reports"
  ON research_reports FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own reports" ON research_reports;
CREATE POLICY "Users can insert their own reports"
  ON research_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for both tables
alter publication supabase_realtime add table investment_preferences;
alter publication supabase_realtime add table research_reports;
