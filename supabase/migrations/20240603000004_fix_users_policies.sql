-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;

-- Create new policies
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage users"
    ON users FOR ALL
    USING (auth.role() = 'service_role');

-- Allow insert during signup
CREATE POLICY "Allow insert during signup"
    ON users FOR INSERT
    WITH CHECK (true);  -- Allow all inserts, we'll validate in the application

-- Grant necessary permissions
GRANT ALL ON users TO service_role;
GRANT SELECT, UPDATE ON users TO authenticated;
GRANT INSERT ON users TO authenticated; 