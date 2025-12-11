-- ============================================
-- SIMULATIONS TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- Create simulations table
CREATE TABLE IF NOT EXISTS simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Simulation input (user's answers)
    answers JSONB NOT NULL,
    
    -- Simulation results
    results JSONB NOT NULL,
    
    -- Summary
    total_monthly DECIMAL(10,2) DEFAULT 0,
    total_annual DECIMAL(10,2) DEFAULT 0,
    eligible_aides_count INTEGER DEFAULT 0,
    
    -- Language used for results
    language TEXT DEFAULT 'fr',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_simulations_user ON simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_simulations_created ON simulations(created_at);

-- Enable RLS
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own simulations" ON simulations;
CREATE POLICY "Users can view own simulations"
    ON simulations FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create simulations" ON simulations;
CREATE POLICY "Users can create simulations"
    ON simulations FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access to simulations" ON simulations;
CREATE POLICY "Service role full access to simulations"
    ON simulations FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Done!
SELECT 'Simulations table created successfully!' as message;
