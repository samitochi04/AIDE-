-- ===========================================
-- Migration: Add Subscription Enhancements
-- ===========================================
-- This migration adds tables and columns needed for the subscription/freemium system

-- =============================================
-- 1. Update subscription_tier enum to include new tiers
-- =============================================

-- First, check if 'ultimate' tier exists, add if not
DO $$ 
BEGIN
    -- Check if 'ultimate' is already in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'ultimate' 
        AND enumtypid = 'subscription_tier'::regtype
    ) THEN
        ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'ultimate';
    END IF;
END $$;

-- =============================================
-- 2. Add billing_interval to stripe_subscriptions
-- =============================================

ALTER TABLE stripe_subscriptions 
ADD COLUMN IF NOT EXISTS billing_interval VARCHAR(10) DEFAULT 'monthly'
CHECK (billing_interval IN ('monthly', 'yearly'));

-- =============================================
-- 3. Create content_views table for tracking content access
-- =============================================

CREATE TABLE IF NOT EXISTS content_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
    view_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Unique constraint to prevent duplicate counts per day
    CONSTRAINT unique_user_content_per_day UNIQUE (user_id, content_id, view_date)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_content_views_user_id ON content_views(user_id);
CREATE INDEX IF NOT EXISTS idx_content_views_content_id ON content_views(content_id);
CREATE INDEX IF NOT EXISTS idx_content_views_view_date ON content_views(view_date);
CREATE INDEX IF NOT EXISTS idx_content_views_user_date ON content_views(user_id, view_date);

-- Enable RLS
ALTER TABLE content_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own content views"
    ON content_views FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own content views"
    ON content_views FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 4. Create saved_housing_platforms table
-- =============================================

CREATE TABLE IF NOT EXISTS saved_housing_platforms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    platform_id VARCHAR(100) NOT NULL,
    platform_name VARCHAR(255),
    category VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT unique_user_platform UNIQUE (user_id, platform_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_saved_housing_user_id ON saved_housing_platforms(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_housing_category ON saved_housing_platforms(category);

-- Enable RLS
ALTER TABLE saved_housing_platforms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own saved platforms"
    ON saved_housing_platforms FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can save platforms"
    ON saved_housing_platforms FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved platforms"
    ON saved_housing_platforms FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- 5. Add subscription_tier to profiles if not exists
-- =============================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_tier subscription_tier DEFAULT 'free';

-- =============================================
-- 6. Create subscription usage tracking functions
-- =============================================

-- Function to get user's daily AI message count
CREATE OR REPLACE FUNCTION get_daily_ai_message_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    message_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO message_count
    FROM chat_messages
    WHERE user_id = p_user_id
      AND role = 'user'
      AND created_at >= CURRENT_DATE;
    
    RETURN COALESCE(message_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's daily simulation count
CREATE OR REPLACE FUNCTION get_daily_simulation_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    sim_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO sim_count
    FROM simulations
    WHERE user_id = p_user_id
      AND created_at >= CURRENT_DATE;
    
    RETURN COALESCE(sim_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's saved aides count
CREATE OR REPLACE FUNCTION get_saved_aides_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    count_result INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO count_result
    FROM saved_aides
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(count_result, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's procedures count
CREATE OR REPLACE FUNCTION get_procedures_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    count_result INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO count_result
    FROM user_procedures
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(count_result, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's daily content access count
CREATE OR REPLACE FUNCTION get_daily_content_access_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    count_result INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO count_result
    FROM content_views
    WHERE user_id = p_user_id
      AND created_at >= CURRENT_DATE;
    
    RETURN COALESCE(count_result, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's saved housing platforms count
CREATE OR REPLACE FUNCTION get_saved_housing_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    count_result INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO count_result
    FROM saved_housing_platforms
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(count_result, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 7. Grant execute permissions
-- =============================================

GRANT EXECUTE ON FUNCTION get_daily_ai_message_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_simulation_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_saved_aides_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_procedures_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_content_access_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_saved_housing_count(UUID) TO authenticated;

-- =============================================
-- 8. Comments for documentation
-- =============================================

COMMENT ON TABLE content_views IS 'Tracks daily content access for subscription limits';
COMMENT ON TABLE saved_housing_platforms IS 'User saved housing platforms for quick access';
COMMENT ON COLUMN stripe_subscriptions.billing_interval IS 'monthly or yearly billing cycle';
COMMENT ON COLUMN profiles.subscription_tier IS 'Current subscription tier: free, basic, premium, ultimate';
