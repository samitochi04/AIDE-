-- ============================================
-- ADMIN ENHANCEMENTS
-- Migration for admin dashboard features
-- Version: 1.0.0
-- Last Updated: 2025-01-XX
-- ============================================

-- ============================================
-- TABLE: contents (Blog & Tutorials)
-- Extending content table for blog & tutorials
-- ============================================

-- Add blog-specific fields if not exists
DO $$ 
BEGIN
    -- Add body field for blog content
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contents' AND column_name = 'body') THEN
        ALTER TABLE contents ADD COLUMN body TEXT;
    END IF;
    
    -- Add reading time estimate
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contents' AND column_name = 'reading_time_minutes') THEN
        ALTER TABLE contents ADD COLUMN reading_time_minutes INTEGER;
    END IF;
    
    -- Add video URL for tutorials
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contents' AND column_name = 'video_url') THEN
        ALTER TABLE contents ADD COLUMN video_url TEXT;
    END IF;
    
    -- Add category for better organization
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contents' AND column_name = 'category') THEN
        ALTER TABLE contents ADD COLUMN category TEXT DEFAULT 'general';
    END IF;
    
    -- Add author name for display
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contents' AND column_name = 'author_name') THEN
        ALTER TABLE contents ADD COLUMN author_name TEXT;
    END IF;
    
    -- Add translations for multi-language support
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contents' AND column_name = 'translations') THEN
        ALTER TABLE contents ADD COLUMN translations JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Add index for category search
CREATE INDEX IF NOT EXISTS idx_contents_category ON contents(category);

-- ============================================
-- TABLE: blog_posts (alias view for contents)
-- Easy access to blog content
-- ============================================
CREATE OR REPLACE VIEW blog_posts AS
SELECT 
    id,
    title,
    slug,
    description,
    body,
    thumbnail_url AS cover_image,
    meta_title,
    meta_description,
    tags,
    category,
    author_name,
    reading_time_minutes,
    language,
    translations,
    view_count,
    like_count,
    is_published,
    is_featured,
    published_at,
    created_at,
    updated_at,
    created_by
FROM contents
WHERE content_type = 'article';

-- ============================================
-- TABLE: tutorials (alias view for contents)
-- Easy access to tutorial content
-- ============================================
CREATE OR REPLACE VIEW tutorials AS
SELECT 
    id,
    title,
    slug,
    description,
    body,
    media_url,
    video_url,
    thumbnail_url,
    duration_seconds,
    tags,
    category,
    target_profiles,
    target_nationalities,
    language,
    translations,
    view_count,
    like_count,
    is_published,
    is_featured,
    display_order,
    published_at,
    created_at,
    updated_at,
    created_by
FROM contents
WHERE content_type IN ('video', 'guide');

-- ============================================
-- TABLE: admin_activity_logs
-- Track admin actions for audit
-- ============================================
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    
    -- Action details
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'export', 'email_send'
    resource_type TEXT NOT NULL, -- 'user', 'content', 'aide', 'procedure', 'affiliate', 'email'
    resource_id UUID,
    
    -- Additional context
    details JSONB DEFAULT '{}'::jsonb, -- Store before/after values, filters used, etc.
    
    -- Request metadata
    ip_address TEXT,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_admin ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_action ON admin_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_resource ON admin_activity_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created ON admin_activity_logs(created_at);

-- ============================================
-- TABLE: bulk_emails
-- Track bulk email campaigns from admin
-- ============================================
CREATE TABLE IF NOT EXISTS bulk_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES admins(id),
    
    -- Email content
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    
    -- Targeting filters
    filters JSONB DEFAULT '{}'::jsonb, -- {"status": ["student"], "nationality": ["non_eu"], "has_aide": "aide_uuid"}
    
    -- Stats
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bulk_emails_admin ON bulk_emails(admin_id);
CREATE INDEX IF NOT EXISTS idx_bulk_emails_status ON bulk_emails(status);
CREATE INDEX IF NOT EXISTS idx_bulk_emails_scheduled ON bulk_emails(scheduled_at);

-- ============================================
-- TABLE: bulk_email_recipients
-- Track individual recipients of bulk emails
-- ============================================
CREATE TABLE IF NOT EXISTS bulk_email_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bulk_email_id UUID NOT NULL REFERENCES bulk_emails(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
    
    -- Tracking
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(bulk_email_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_bulk_email_recipients_bulk ON bulk_email_recipients(bulk_email_id);
CREATE INDEX IF NOT EXISTS idx_bulk_email_recipients_user ON bulk_email_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_bulk_email_recipients_status ON bulk_email_recipients(status);

-- ============================================
-- TABLE: app_settings
-- Global app settings for admin configuration
-- ============================================
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- Can be read by non-admins
    updated_by UUID REFERENCES admins(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO app_settings (key, value, description, is_public) VALUES
    ('maintenance_mode', 'false'::jsonb, 'Enable maintenance mode', false),
    ('registration_enabled', 'true'::jsonb, 'Allow new user registrations', false),
    ('ai_chat_enabled', 'true'::jsonb, 'Enable AI chat feature', true),
    ('free_tier_message_limit', '10'::jsonb, 'Monthly message limit for free users', false),
    ('basic_tier_message_limit', '100'::jsonb, 'Monthly message limit for basic users', false),
    ('premium_tier_message_limit', '500'::jsonb, 'Monthly message limit for premium users', false)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- FUNCTION: create_super_admin
-- Helper function to create superadmin
-- ============================================
CREATE OR REPLACE FUNCTION create_super_admin(user_email TEXT)
RETURNS UUID AS $$
DECLARE
    user_uuid UUID;
    admin_uuid UUID;
BEGIN
    -- Find the user by email
    SELECT id INTO user_uuid FROM profiles WHERE email = user_email;
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
    
    -- Check if already admin
    SELECT id INTO admin_uuid FROM admins WHERE user_id = user_uuid;
    
    IF admin_uuid IS NOT NULL THEN
        -- Update to super_admin if exists
        UPDATE admins SET 
            role = 'super_admin',
            permissions = '{
                "manage_users": true,
                "manage_content": true,
                "manage_affiliates": true,
                "manage_subscriptions": true,
                "view_analytics": true,
                "manage_admins": true,
                "send_bulk_emails": true,
                "manage_settings": true
            }'::jsonb,
            updated_at = NOW()
        WHERE id = admin_uuid;
        
        RETURN admin_uuid;
    ELSE
        -- Create new admin entry
        INSERT INTO admins (user_id, role, permissions, can_create_promo_codes, max_discount_percentage)
        VALUES (
            user_uuid,
            'super_admin',
            '{
                "manage_users": true,
                "manage_content": true,
                "manage_affiliates": true,
                "manage_subscriptions": true,
                "view_analytics": true,
                "manage_admins": true,
                "send_bulk_emails": true,
                "manage_settings": true
            }'::jsonb,
            true,
            100
        )
        RETURNING id INTO admin_uuid;
        
        RETURN admin_uuid;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================

-- Enable RLS
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_email_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- admin_activity_logs: Only admins can view
CREATE POLICY admin_activity_logs_admin_policy ON admin_activity_logs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
    );

-- bulk_emails: Only admins can manage
CREATE POLICY bulk_emails_admin_policy ON bulk_emails
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
    );

-- bulk_email_recipients: Only admins can manage
CREATE POLICY bulk_email_recipients_admin_policy ON bulk_email_recipients
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
    );

-- app_settings: Admins can manage, public settings readable by all
CREATE POLICY app_settings_admin_policy ON app_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
    );

CREATE POLICY app_settings_public_read ON app_settings
    FOR SELECT USING (is_public = true);

-- ============================================
-- STORAGE BUCKETS FOR ADMIN
-- Run this in Supabase Dashboard or via API
-- ============================================
-- Bucket: blog-images
-- Purpose: Blog post cover images and inline images
-- Policy: Public read, admin write

-- Bucket: tutorial-media  
-- Purpose: Tutorial videos and images
-- Policy: Public read, admin write

-- Bucket: content-assets
-- Purpose: General content assets (PDFs, documents)
-- Policy: Public read, admin write

-- ============================================
-- USAGE: Create superadmin after running migration
-- ============================================
-- SELECT create_super_admin('your-email@example.com');

