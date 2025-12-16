-- ============================================
-- AFFILIATE SYSTEM ENHANCEMENTS
-- Adds affiliate_earnings, affiliate_referrals, 
-- affiliate_clicks, and affiliate_payouts tables
-- ============================================

-- TABLE: affiliate_clicks
-- Track affiliate link clicks
CREATE TABLE IF NOT EXISTS affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    
    -- Click metadata
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate ON affiliate_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_created ON affiliate_clicks(created_at);

-- TABLE: affiliate_referrals
-- Track individual referrals
CREATE TABLE IF NOT EXISTS affiliate_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Status tracking
    status TEXT CHECK (status IN ('pending', 'converted', 'expired')) DEFAULT 'pending',
    converted_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred ON affiliate_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_status ON affiliate_referrals(status);

-- TABLE: affiliate_earnings
-- Track individual commission earnings
CREATE TABLE IF NOT EXISTS affiliate_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    referral_id UUID REFERENCES affiliate_referrals(id) ON DELETE SET NULL,
    
    -- Earning details
    amount DECIMAL(10,2) NOT NULL,
    tier TEXT, -- basic, premium, ultimate
    
    -- Status
    status TEXT CHECK (status IN ('pending', 'paid', 'cancelled')) DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_affiliate ON affiliate_earnings(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_status ON affiliate_earnings(status);

-- TABLE: affiliate_payouts
-- Track payout requests and processing
CREATE TABLE IF NOT EXISTS affiliate_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    
    -- Payout details
    amount DECIMAL(10,2) NOT NULL,
    status TEXT CHECK (status IN ('requested', 'processing', 'completed', 'failed')) DEFAULT 'requested',
    
    -- Processing details
    transaction_id TEXT,
    processed_at TIMESTAMPTZ,
    failure_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate ON affiliate_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_status ON affiliate_payouts(status);

-- Update affiliates table to add affiliate_code column if using separate tracking
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS affiliate_code TEXT UNIQUE;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')) DEFAULT 'pending';
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS description TEXT;

-- Create index on affiliate_code
CREATE INDEX IF NOT EXISTS idx_affiliates_affiliate_code ON affiliates(affiliate_code);

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- Policies for affiliate_clicks (service role only)
DROP POLICY IF EXISTS "Affiliate clicks - service insert" ON affiliate_clicks;
CREATE POLICY "Affiliate clicks - service insert" ON affiliate_clicks
    FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Affiliate clicks - affiliate read own" ON affiliate_clicks;
CREATE POLICY "Affiliate clicks - affiliate read own" ON affiliate_clicks
    FOR SELECT USING (
        affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
    );

-- Policies for affiliate_referrals
DROP POLICY IF EXISTS "Affiliate referrals - service role" ON affiliate_referrals;
CREATE POLICY "Affiliate referrals - service role" ON affiliate_referrals
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Affiliate referrals - affiliate read own" ON affiliate_referrals;
CREATE POLICY "Affiliate referrals - affiliate read own" ON affiliate_referrals
    FOR SELECT USING (
        affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
    );

-- Policies for affiliate_earnings
DROP POLICY IF EXISTS "Affiliate earnings - service role" ON affiliate_earnings;
CREATE POLICY "Affiliate earnings - service role" ON affiliate_earnings
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Affiliate earnings - affiliate read own" ON affiliate_earnings;
CREATE POLICY "Affiliate earnings - affiliate read own" ON affiliate_earnings
    FOR SELECT USING (
        affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
    );

-- Policies for affiliate_payouts
DROP POLICY IF EXISTS "Affiliate payouts - service role" ON affiliate_payouts;
CREATE POLICY "Affiliate payouts - service role" ON affiliate_payouts
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Affiliate payouts - affiliate read own" ON affiliate_payouts;
CREATE POLICY "Affiliate payouts - affiliate read own" ON affiliate_payouts
    FOR SELECT USING (
        affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
    );

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE affiliate_clicks IS 'Tracks clicks on affiliate referral links';
COMMENT ON TABLE affiliate_referrals IS 'Tracks individual referrals and their conversion status';
COMMENT ON TABLE affiliate_earnings IS 'Tracks commission earnings for affiliates';
COMMENT ON TABLE affiliate_payouts IS 'Tracks payout requests and processing';
