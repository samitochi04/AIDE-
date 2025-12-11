-- ============================================
-- USER PROCEDURES TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- Create user_procedures table for tracking user's procedure progress
CREATE TABLE IF NOT EXISTS user_procedures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Procedure identification
    procedure_id TEXT NOT NULL,
    procedure_name TEXT NOT NULL,
    procedure_description TEXT,
    procedure_category TEXT, -- 'housing', 'health', 'employment', 'education', 'administrative', 'banking'
    
    -- Provider/Organization
    provider TEXT, -- 'CAF', 'CPAM', 'Prefecture', 'CROUS', etc.
    provider_url TEXT,
    
    -- Status tracking
    status TEXT DEFAULT 'not-started' CHECK (status IN ('not-started', 'in-progress', 'pending', 'completed', 'rejected')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    
    -- Steps tracking (JSONB array)
    steps JSONB DEFAULT '[]'::jsonb,
    current_step INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 0,
    
    -- Required documents (JSONB array)
    required_documents JSONB DEFAULT '[]'::jsonb,
    
    -- Important dates
    started_at TIMESTAMPTZ,
    deadline TIMESTAMPTZ,
    estimated_decision TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Related aide (if procedure is for an aide application)
    related_aide_id TEXT,
    related_aide_name TEXT,
    
    -- User notes
    notes TEXT,
    
    -- Source (which simulation or manual)
    source TEXT DEFAULT 'manual', -- 'simulation', 'manual', 'recommended'
    simulation_id UUID REFERENCES simulations(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint - user can only have one instance of each procedure
    UNIQUE(user_id, procedure_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_procedures_user ON user_procedures(user_id);
CREATE INDEX IF NOT EXISTS idx_user_procedures_status ON user_procedures(status);
CREATE INDEX IF NOT EXISTS idx_user_procedures_category ON user_procedures(procedure_category);
CREATE INDEX IF NOT EXISTS idx_user_procedures_created ON user_procedures(created_at);

-- Enable RLS
ALTER TABLE user_procedures ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own procedures" ON user_procedures;
CREATE POLICY "Users can view own procedures"
    ON user_procedures FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own procedures" ON user_procedures;
CREATE POLICY "Users can create own procedures"
    ON user_procedures FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own procedures" ON user_procedures;
CREATE POLICY "Users can update own procedures"
    ON user_procedures FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own procedures" ON user_procedures;
CREATE POLICY "Users can delete own procedures"
    ON user_procedures FOR DELETE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access to user_procedures" ON user_procedures;
CREATE POLICY "Service role full access to user_procedures"
    ON user_procedures FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_procedures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_procedures_updated_at ON user_procedures;
CREATE TRIGGER trigger_user_procedures_updated_at
    BEFORE UPDATE ON user_procedures
    FOR EACH ROW
    EXECUTE FUNCTION update_user_procedures_updated_at();
