-- ============================================
-- Migration: Add deleted_profiles table and update profiles
-- Version: 7
-- Description: Track deleted accounts for data analysis
-- ============================================

-- Add in_app_notifications_enabled column to profiles for in-app notification preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS in_app_notifications_enabled BOOLEAN DEFAULT true;

-- Create deleted_profiles table to track deleted accounts
CREATE TABLE IF NOT EXISTS deleted_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Original user ID (not a foreign key since user is deleted from auth)
    original_user_id UUID NOT NULL,
    
    -- User info at time of deletion
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    
    -- Demographics at deletion
    status user_status,
    nationality nationality_type,
    country_of_origin TEXT,
    date_of_birth DATE,
    
    -- Location at deletion
    region TEXT,
    department TEXT,
    city TEXT,
    postal_code TEXT,
    
    -- Subscription info at deletion
    subscription_tier subscription_tier,
    
    -- Account lifecycle dates
    original_created_at TIMESTAMPTZ,
    original_last_seen_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Deletion metadata
    deletion_reason TEXT, -- 'user_requested', 'admin_action', etc.
    deletion_feedback TEXT, -- Optional feedback from user
    
    -- Stats at deletion (for analysis)
    total_simulations INTEGER DEFAULT 0,
    total_saved_aides INTEGER DEFAULT 0,
    total_procedures INTEGER DEFAULT 0,
    total_ai_conversations INTEGER DEFAULT 0,
    
    -- Track if user recreated account
    recreated_at TIMESTAMPTZ,
    new_user_id UUID,
    
    -- Index for finding same email deletions
    deletion_count INTEGER DEFAULT 1 -- How many times this email was deleted
);

-- Indexes for analysis queries
CREATE INDEX IF NOT EXISTS idx_deleted_profiles_email ON deleted_profiles(email);
CREATE INDEX IF NOT EXISTS idx_deleted_profiles_original_user_id ON deleted_profiles(original_user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_profiles_deleted_at ON deleted_profiles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_deleted_profiles_subscription ON deleted_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_deleted_profiles_region ON deleted_profiles(region);

-- Create data_exports table to track PDF exports
CREATE TABLE IF NOT EXISTS data_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Export details
    export_type TEXT DEFAULT 'full' CHECK (export_type IN ('full', 'partial', 'gdpr')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
    
    -- File info
    file_path TEXT, -- Storage path
    file_url TEXT, -- Public URL (temporary)
    file_size INTEGER, -- Size in bytes
    
    -- Processing info
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ, -- URL expiration
    error_message TEXT,
    
    -- Metadata
    requested_from TEXT, -- 'settings', 'gdpr_request', 'admin'
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_exports_user ON data_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_data_exports_status ON data_exports(status);

-- Function to archive a profile before deletion
CREATE OR REPLACE FUNCTION archive_deleted_profile(
    p_user_id UUID,
    p_reason TEXT DEFAULT 'user_requested',
    p_feedback TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_profile RECORD;
    v_stats RECORD;
    v_existing_count INTEGER;
    v_archive_id UUID;
BEGIN
    -- Get the profile data
    SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found for user_id: %', p_user_id;
    END IF;
    
    -- Get stats
    SELECT 
        COALESCE((SELECT COUNT(*) FROM simulations WHERE user_id = p_user_id), 0) as simulations,
        COALESCE((SELECT COUNT(*) FROM saved_aides WHERE user_id = p_user_id), 0) as saved_aides,
        COALESCE((SELECT COUNT(*) FROM user_procedures WHERE user_id = p_user_id), 0) as procedures,
        COALESCE((SELECT COUNT(*) FROM chat_conversations WHERE user_id = p_user_id), 0) as conversations
    INTO v_stats;
    
    -- Check how many times this email was deleted before
    SELECT COALESCE(MAX(deletion_count), 0) INTO v_existing_count
    FROM deleted_profiles WHERE email = v_profile.email;
    
    -- Insert into deleted_profiles
    INSERT INTO deleted_profiles (
        original_user_id,
        email,
        full_name,
        phone,
        status,
        nationality,
        country_of_origin,
        date_of_birth,
        region,
        department,
        city,
        postal_code,
        subscription_tier,
        original_created_at,
        original_last_seen_at,
        deletion_reason,
        deletion_feedback,
        total_simulations,
        total_saved_aides,
        total_procedures,
        total_ai_conversations,
        deletion_count
    ) VALUES (
        p_user_id,
        v_profile.email,
        v_profile.full_name,
        v_profile.phone,
        v_profile.status,
        v_profile.nationality,
        v_profile.country_of_origin,
        v_profile.date_of_birth,
        v_profile.region,
        v_profile.department,
        v_profile.city,
        v_profile.postal_code,
        v_profile.subscription_tier,
        v_profile.created_at,
        v_profile.last_seen_at,
        p_reason,
        p_feedback,
        v_stats.simulations,
        v_stats.saved_aides,
        v_stats.procedures,
        v_stats.conversations,
        v_existing_count + 1
    ) RETURNING id INTO v_archive_id;
    
    -- Soft delete the profile (set deleted_at and is_active)
    UPDATE profiles
    SET 
        deleted_at = NOW(),
        is_active = FALSE
    WHERE id = p_user_id;
    
    RETURN v_archive_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if recreating a deleted account
CREATE OR REPLACE FUNCTION check_recreated_account()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new profile is created, check if this email was previously deleted
    UPDATE deleted_profiles
    SET 
        recreated_at = NOW(),
        new_user_id = NEW.id
    WHERE email = NEW.email
    AND recreated_at IS NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tracking recreated accounts
DROP TRIGGER IF EXISTS track_recreated_accounts ON profiles;
CREATE TRIGGER track_recreated_accounts
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION check_recreated_account();

-- RLS Policies for deleted_profiles (admin only)
ALTER TABLE deleted_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view deleted profiles"
    ON deleted_profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for data_exports
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exports"
    ON data_exports
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own exports"
    ON data_exports
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Grant service role access
GRANT ALL ON deleted_profiles TO service_role;
GRANT ALL ON data_exports TO service_role;
