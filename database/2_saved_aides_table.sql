-- ============================================
-- SAVED AIDES TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- Create saved_aides table for bookmarking aides
CREATE TABLE IF NOT EXISTS saved_aides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Aide information (denormalized for quick access)
    aide_id TEXT NOT NULL,
    aide_name TEXT NOT NULL,
    aide_description TEXT,
    aide_category TEXT,
    monthly_amount DECIMAL(10,2) DEFAULT 0,
    
    -- URLs for actions
    source_url TEXT,
    application_url TEXT,
    
    -- Status tracking
    status TEXT DEFAULT 'saved' CHECK (status IN ('saved', 'applied', 'received', 'rejected')),
    applied_at TIMESTAMPTZ,
    notes TEXT,
    
    -- From which simulation this aide was saved
    simulation_id UUID REFERENCES simulations(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: user can only save same aide once
    UNIQUE(user_id, aide_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_saved_aides_user ON saved_aides(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_aides_status ON saved_aides(status);
CREATE INDEX IF NOT EXISTS idx_saved_aides_created ON saved_aides(created_at);

-- Enable RLS
ALTER TABLE saved_aides ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own saved aides" ON saved_aides;
CREATE POLICY "Users can view own saved aides"
    ON saved_aides FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create saved aides" ON saved_aides;
CREATE POLICY "Users can create saved aides"
    ON saved_aides FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own saved aides" ON saved_aides;
CREATE POLICY "Users can update own saved aides"
    ON saved_aides FOR UPDATE
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own saved aides" ON saved_aides;
CREATE POLICY "Users can delete own saved aides"
    ON saved_aides FOR DELETE
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access to saved_aides" ON saved_aides;
CREATE POLICY "Service role full access to saved_aides"
    ON saved_aides FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_saved_aides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_saved_aides_updated_at ON saved_aides;
CREATE TRIGGER trigger_saved_aides_updated_at
    BEFORE UPDATE ON saved_aides
    FOR EACH ROW
    EXECUTE FUNCTION update_saved_aides_updated_at();
