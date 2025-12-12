-- ============================================
-- AIDE+ DATABASE SCHEMA
-- Supabase SQL Script
-- Version: 1.0.0
-- Last Updated: 2025-12-09
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";  -- For RAG/AI embeddings

-- ============================================
-- ENUMS
-- ============================================

-- User status enum
CREATE TYPE user_status AS ENUM (
    'student',
    'worker', 
    'job_seeker',
    'retiree',
    'tourist',
    'other'
);

-- User nationality type
CREATE TYPE nationality_type AS ENUM (
    'french',
    'eu_eea',
    'non_eu',
    'other'
);

-- Subscription status
CREATE TYPE subscription_status AS ENUM (
    'active',
    'canceled',
    'past_due',
    'unpaid',
    'trialing',
    'incomplete',
    'incomplete_expired',
    'paused'
);

-- Subscription tier
CREATE TYPE subscription_tier AS ENUM (
    'free',
    'basic',
    'premium',
    'enterprise'
);

-- Content type enum
CREATE TYPE content_type AS ENUM (
    'video',
    'image',
    'article',
    'guide',
    'infographic'
);

-- Admin role enum
CREATE TYPE admin_role AS ENUM (
    'super_admin',
    'admin',
    'moderator',
    'support'
);

-- Payout status
CREATE TYPE payout_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled'
);

-- Chat message role
CREATE TYPE chat_role AS ENUM (
    'user',
    'assistant',
    'system'
);

-- ============================================
-- TABLE: profiles
-- User profiles linked to Supabase auth
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    
    -- User demographics
    status user_status DEFAULT 'other',
    nationality nationality_type DEFAULT 'other',
    country_of_origin TEXT,
    date_of_birth DATE,
    
    -- Location in France
    region TEXT,
    department TEXT,
    city TEXT,
    postal_code TEXT,
    
    -- Preferences
    language TEXT DEFAULT 'fr' CHECK (language IN ('fr', 'en', 'es', 'de', 'it', 'pt', 'ar', 'zh', 'ja', 'ko')),
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
    
    -- Subscription
    subscription_tier subscription_tier DEFAULT 'free',
    
    -- Referral tracking
    referred_by UUID REFERENCES profiles(id),
    referral_code TEXT UNIQUE,
    
    -- Device/Analytics
    device_id TEXT,
    last_ip TEXT,
    last_user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    email_verified_at TIMESTAMPTZ,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- Index for common queries
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX idx_profiles_referred_by ON profiles(referred_by);
CREATE INDEX idx_profiles_region ON profiles(region);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_subscription ON profiles(subscription_tier);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);

-- ============================================
-- TABLE: admins
-- Admin users with special privileges
-- ============================================
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role admin_role NOT NULL DEFAULT 'moderator',
    
    -- Admin-created promo codes
    can_create_promo_codes BOOLEAN DEFAULT FALSE,
    max_discount_percentage INTEGER DEFAULT 20 CHECK (max_discount_percentage >= 0 AND max_discount_percentage <= 100),
    
    -- Permissions
    permissions JSONB DEFAULT '{
        "manage_users": false,
        "manage_content": true,
        "manage_affiliates": false,
        "manage_subscriptions": false,
        "view_analytics": true,
        "manage_admins": false
    }'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES admins(id),
    
    UNIQUE(user_id)
);

CREATE INDEX idx_admins_user_id ON admins(user_id);
CREATE INDEX idx_admins_role ON admins(role);

-- ============================================
-- TABLE: affiliates
-- Affiliate program for referrals
-- ============================================
CREATE TABLE affiliates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Referral code (separate from profile referral for tracking)
    affiliate_code TEXT UNIQUE NOT NULL,
    
    -- Commission settings
    commission_rate DECIMAL(5,2) DEFAULT 10.00 CHECK (commission_rate >= 0 AND commission_rate <= 100),
    
    -- Stats
    total_referrals INTEGER DEFAULT 0,
    successful_conversions INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    pending_earnings DECIMAL(10,2) DEFAULT 0.00,
    paid_earnings DECIMAL(10,2) DEFAULT 0.00,
    
    -- Payout info
    payout_method TEXT CHECK (payout_method IN ('stripe', 'paypal', 'bank_transfer')),
    payout_details JSONB,
    minimum_payout DECIMAL(10,2) DEFAULT 50.00,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    verified_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

CREATE INDEX idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX idx_affiliates_active ON affiliates(is_active);

-- ============================================
-- TABLE: promo_codes
-- Promotional codes (admin-created)
-- ============================================
CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    
    -- Discount details
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
    
    -- Validity
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    
    -- Restrictions
    applicable_tiers subscription_tier[] DEFAULT '{basic, premium, enterprise}',
    first_time_only BOOLEAN DEFAULT FALSE,
    minimum_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Tracking
    created_by UUID REFERENCES admins(id),
    affiliate_id UUID REFERENCES affiliates(id),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX idx_promo_codes_valid ON promo_codes(valid_from, valid_until);

-- ============================================
-- TABLE: gov_aides
-- Government aides knowledge base (RAG-enabled)
-- ============================================
CREATE TABLE gov_aides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Region info
    region_id TEXT NOT NULL,
    region_name TEXT NOT NULL,
    region_code TEXT,
    departments TEXT[],
    
    -- Profile targeting
    profile_type TEXT NOT NULL, -- 'french', 'eu', 'non_eu', 'all'
    profile_subtype TEXT, -- 'student', 'worker', etc.
    
    -- Aide details
    aide_id TEXT NOT NULL,
    aide_name TEXT NOT NULL,
    aide_description TEXT,
    aide_category TEXT,
    
    -- Full data as JSONB
    aide_data JSONB NOT NULL,
    
    -- For RAG/AI search
    content_text TEXT, -- Flattened searchable text
    embedding vector(1536), -- OpenAI embeddings dimension
    
    -- Metadata
    source_url TEXT,
    last_verified TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(region_id, profile_type, aide_id)
);

-- Indexes for search and RAG
CREATE INDEX idx_gov_aides_region ON gov_aides(region_id);
CREATE INDEX idx_gov_aides_profile ON gov_aides(profile_type, profile_subtype);
CREATE INDEX idx_gov_aides_category ON gov_aides(aide_category);
CREATE INDEX idx_gov_aides_content_search ON gov_aides USING gin(to_tsvector('french', content_text));
CREATE INDEX idx_gov_aides_embedding ON gov_aides USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- TABLE: procedures
-- Administrative procedures (RAG-enabled)
-- ============================================
CREATE TABLE procedures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Category
    category TEXT NOT NULL, -- 'students' or 'workers'
    subcategory TEXT NOT NULL, -- 'erasmus', 'eu', 'nonEu'
    
    -- Procedure identification
    procedure_id TEXT NOT NULL,
    procedure_name TEXT NOT NULL,
    procedure_description TEXT,
    
    -- Section info
    section TEXT NOT NULL, -- 'preArrival', 'arrival', 'banking', etc.
    subsection TEXT, -- More specific section
    
    -- Full data as JSONB
    procedure_data JSONB NOT NULL,
    
    -- For RAG/AI search
    content_text TEXT, -- Flattened searchable text
    embedding vector(1536),
    
    -- Metadata
    source_url TEXT,
    last_verified TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(category, subcategory, section, procedure_id)
);

-- Indexes for search and RAG
CREATE INDEX idx_procedures_category ON procedures(category, subcategory);
CREATE INDEX idx_procedures_section ON procedures(section);
CREATE INDEX idx_procedures_content_search ON procedures USING gin(to_tsvector('french', content_text));
CREATE INDEX idx_procedures_embedding ON procedures USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- TABLE: renting
-- Rental platforms and resources (RAG-enabled)
-- ============================================
CREATE TABLE renting (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Category
    category TEXT NOT NULL, -- 'majorPortals', 'studentHousing', etc.
    
    -- Platform identification
    platform_id TEXT NOT NULL,
    platform_name TEXT NOT NULL,
    platform_url TEXT,
    platform_description TEXT,
    
    -- Full data as JSONB
    platform_data JSONB NOT NULL,
    
    -- For RAG/AI search
    content_text TEXT, -- Flattened searchable text
    embedding vector(1536),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(category, platform_id)
);

-- Indexes for search and RAG
CREATE INDEX idx_renting_category ON renting(category);
CREATE INDEX idx_renting_content_search ON renting USING gin(to_tsvector('french', content_text));
CREATE INDEX idx_renting_embedding ON renting USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- TABLE: contents
-- Admin-posted educational content
-- ============================================
CREATE TABLE contents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Content details
    title TEXT NOT NULL,
    description TEXT,
    content_type content_type NOT NULL,
    
    -- Media
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INTEGER, -- For videos
    
    -- Tags for filtering (stored as array)
    tags TEXT[] DEFAULT '{}',
    
    -- Targeting
    target_profiles user_status[] DEFAULT '{student, worker, job_seeker, retiree, tourist, other}',
    target_nationalities nationality_type[] DEFAULT '{french, eu_eea, non_eu, other}',
    target_regions TEXT[], -- NULL means all regions
    
    -- Language
    language TEXT DEFAULT 'fr',
    
    -- Engagement stats
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    
    -- SEO
    slug TEXT UNIQUE,
    meta_title TEXT,
    meta_description TEXT,
    
    -- Publishing
    published_at TIMESTAMPTZ,
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    
    -- Author
    created_by UUID REFERENCES admins(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_contents_type ON contents(content_type);
CREATE INDEX idx_contents_tags ON contents USING gin(tags);
CREATE INDEX idx_contents_published ON contents(is_published, published_at);
CREATE INDEX idx_contents_featured ON contents(is_featured);
CREATE INDEX idx_contents_language ON contents(language);
CREATE INDEX idx_contents_slug ON contents(slug);

-- ============================================
-- TABLE: content_likes
-- User likes on content
-- ============================================
CREATE TABLE content_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate likes
    UNIQUE(content_id, user_id)
);

CREATE INDEX idx_content_likes_content ON content_likes(content_id);
CREATE INDEX idx_content_likes_user ON content_likes(user_id);

-- ============================================
-- TABLE: email_templates
-- Email templates for automated emails
-- ============================================
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Template identification
    template_key TEXT UNIQUE NOT NULL, -- 'welcome', 'password_reset', etc.
    template_name TEXT NOT NULL,
    description TEXT,
    
    -- Content
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT, -- Plain text fallback
    
    -- Variables available (documentation)
    available_variables JSONB DEFAULT '["{{name}}", "{{email}}", "{{date}}"]'::jsonb,
    
    -- Multi-language support
    language TEXT DEFAULT 'fr',
    translations JSONB DEFAULT '{}'::jsonb, -- {"en": {"subject": "...", "body_html": "..."}}
    
    -- Settings
    is_active BOOLEAN DEFAULT TRUE,
    category TEXT DEFAULT 'transactional', -- 'transactional', 'marketing', 'notification'
    
    -- Tracking
    last_used_at TIMESTAMPTZ,
    send_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES admins(id)
);

CREATE INDEX idx_email_templates_key ON email_templates(template_key);
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_active ON email_templates(is_active);

-- ============================================
-- TABLE: email_logs
-- Track sent emails
-- ============================================
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES email_templates(id),
    user_id UUID REFERENCES profiles(id),
    
    -- Email details
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'bounced', 'failed')),
    error_message TEXT,
    
    -- Tracking
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_logs_user ON email_logs(user_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent ON email_logs(sent_at);

-- ============================================
-- STRIPE INTEGRATION TABLES
-- ============================================

-- TABLE: stripe_customers
-- Link profiles to Stripe customers
CREATE TABLE stripe_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stripe_customer_id TEXT UNIQUE NOT NULL,
    
    -- Customer details from Stripe
    default_payment_method TEXT,
    currency TEXT DEFAULT 'eur',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

CREATE INDEX idx_stripe_customers_user ON stripe_customers(user_id);
CREATE INDEX idx_stripe_customers_stripe ON stripe_customers(stripe_customer_id);

-- TABLE: stripe_products
-- Subscription products/plans
CREATE TABLE stripe_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_product_id TEXT UNIQUE NOT NULL,
    stripe_price_id TEXT UNIQUE NOT NULL,
    
    -- Product details
    name TEXT NOT NULL,
    description TEXT,
    tier subscription_tier NOT NULL,
    
    -- Pricing
    price_amount INTEGER NOT NULL, -- In cents
    currency TEXT DEFAULT 'eur',
    interval TEXT CHECK (interval IN ('month', 'year')),
    interval_count INTEGER DEFAULT 1,
    
    -- Features
    features JSONB DEFAULT '[]'::jsonb,
    
    -- Limits
    ai_messages_limit INTEGER, -- NULL = unlimited
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stripe_products_tier ON stripe_products(tier);
CREATE INDEX idx_stripe_products_active ON stripe_products(is_active);

-- TABLE: stripe_subscriptions
-- User subscriptions
CREATE TABLE stripe_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stripe_customer_id TEXT NOT NULL REFERENCES stripe_customers(stripe_customer_id),
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_price_id TEXT NOT NULL,
    
    -- Subscription details
    status subscription_status NOT NULL,
    tier subscription_tier NOT NULL,
    
    -- Billing
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    
    -- Trial
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    
    -- Promo/Referral tracking
    promo_code_id UUID REFERENCES promo_codes(id),
    affiliate_id UUID REFERENCES affiliates(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stripe_subscriptions_user ON stripe_subscriptions(user_id);
CREATE INDEX idx_stripe_subscriptions_status ON stripe_subscriptions(status);
CREATE INDEX idx_stripe_subscriptions_tier ON stripe_subscriptions(tier);
CREATE INDEX idx_stripe_subscriptions_stripe ON stripe_subscriptions(stripe_subscription_id);

-- TABLE: stripe_invoices
-- Invoice history
CREATE TABLE stripe_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT UNIQUE NOT NULL,
    stripe_subscription_id TEXT REFERENCES stripe_subscriptions(stripe_subscription_id),
    
    -- Invoice details
    amount_due INTEGER NOT NULL,
    amount_paid INTEGER NOT NULL,
    currency TEXT DEFAULT 'eur',
    status TEXT,
    
    -- URLs
    hosted_invoice_url TEXT,
    invoice_pdf TEXT,
    
    -- Dates
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stripe_invoices_user ON stripe_invoices(user_id);
CREATE INDEX idx_stripe_invoices_status ON stripe_invoices(status);

-- TABLE: affiliate_transactions
-- Track affiliate earnings
CREATE TABLE affiliate_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    
    -- Related subscription
    subscription_id UUID REFERENCES stripe_subscriptions(id),
    referred_user_id UUID REFERENCES profiles(id),
    
    -- Transaction details
    transaction_type TEXT CHECK (transaction_type IN ('commission', 'payout', 'adjustment')),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'eur',
    
    -- Commission calculation
    subscription_amount DECIMAL(10,2),
    commission_rate DECIMAL(5,2),
    
    -- Status
    status payout_status DEFAULT 'pending',
    
    -- Payout reference
    payout_id TEXT,
    payout_date TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_affiliate_transactions_affiliate ON affiliate_transactions(affiliate_id);
CREATE INDEX idx_affiliate_transactions_status ON affiliate_transactions(status);
CREATE INDEX idx_affiliate_transactions_type ON affiliate_transactions(transaction_type);

-- ============================================
-- AI CHAT TABLES
-- ============================================

-- TABLE: chat_conversations
-- Chat sessions with AI
CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Anonymous user tracking
    anonymous_id TEXT, -- For non-logged users
    device_id TEXT,
    
    -- Conversation metadata
    title TEXT,
    summary TEXT,
    
    -- Context
    context JSONB DEFAULT '{}'::jsonb, -- User profile snapshot, preferences
    
    -- Stats
    message_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_conversations_user ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_anonymous ON chat_conversations(anonymous_id);
CREATE INDEX idx_chat_conversations_active ON chat_conversations(is_active);
CREATE INDEX idx_chat_conversations_last_message ON chat_conversations(last_message_at);

-- TABLE: chat_messages
-- Individual messages in conversations
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    
    -- Message content
    role chat_role NOT NULL,
    content TEXT NOT NULL,
    
    -- AI metadata
    model TEXT, -- 'gpt-4', 'claude-3', etc.
    tokens_used INTEGER,
    
    -- RAG context used
    rag_sources JSONB, -- References to gov_aides, procedures, renting used
    
    -- Feedback
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    feedback_text TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_role ON chat_messages(role);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);

-- TABLE: chat_usage
-- Track AI usage for rate limiting
CREATE TABLE chat_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Usage
    messages_count INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    
    -- Limits
    messages_limit INTEGER, -- From subscription tier
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, period_start)
);

CREATE INDEX idx_chat_usage_user ON chat_usage(user_id);
CREATE INDEX idx_chat_usage_period ON chat_usage(period_start, period_end);

-- ============================================
-- TABLE: simulations
-- User's aide eligibility simulation results
-- ============================================
CREATE TABLE simulations (
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

CREATE INDEX idx_simulations_user ON simulations(user_id);
CREATE INDEX idx_simulations_created ON simulations(created_at);

-- ============================================
-- ANALYTICS & TRACKING TABLES
-- ============================================

-- TABLE: anonymous_visitors
-- Track anonymous visitors before signup
CREATE TABLE anonymous_visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identification
    device_fingerprint TEXT NOT NULL, -- Browser fingerprint
    first_ip TEXT,
    current_ip TEXT,
    
    -- Device info
    user_agent TEXT,
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'
    browser TEXT,
    os TEXT,
    
    -- Acquisition
    first_source TEXT, -- UTM source
    first_medium TEXT, -- UTM medium
    first_campaign TEXT, -- UTM campaign
    first_referrer TEXT,
    landing_page TEXT,
    
    -- Conversion tracking
    converted_to_user_id UUID REFERENCES profiles(id),
    converted_at TIMESTAMPTZ,
    
    -- Timestamps
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Stats
    total_page_views INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 1,
    total_time_seconds INTEGER DEFAULT 0
);

CREATE INDEX idx_anonymous_visitors_fingerprint ON anonymous_visitors(device_fingerprint);
CREATE INDEX idx_anonymous_visitors_first_seen ON anonymous_visitors(first_seen_at);
CREATE INDEX idx_anonymous_visitors_converted ON anonymous_visitors(converted_to_user_id);

-- TABLE: view_records
-- Detailed activity tracking for all users (anonymous + registered)
CREATE TABLE view_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User identification (one must be present)
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    anonymous_visitor_id UUID REFERENCES anonymous_visitors(id) ON DELETE SET NULL,
    
    -- Session
    session_id TEXT NOT NULL,
    
    -- Request info
    ip_address TEXT,
    user_agent TEXT,
    device_fingerprint TEXT,
    
    -- Page/Action details
    page_url TEXT NOT NULL,
    page_title TEXT,
    action_type TEXT NOT NULL, -- 'page_view', 'api_call', 'search', 'click', 'form_submit'
    action_details JSONB, -- Specific action data
    
    -- API tracking
    api_endpoint TEXT,
    api_method TEXT,
    api_params JSONB,
    api_response_status INTEGER,
    api_response_time_ms INTEGER,
    
    -- Search tracking
    search_query TEXT,
    search_results_count INTEGER,
    search_filters JSONB,
    
    -- Engagement
    time_on_page_seconds INTEGER,
    scroll_depth_percent INTEGER,
    
    -- Context
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    
    -- Geographic (from IP)
    country TEXT,
    region TEXT,
    city TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partition by month for better performance
-- CREATE TABLE view_records_y2025m01 PARTITION OF view_records 
--     FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE INDEX idx_view_records_user ON view_records(user_id);
CREATE INDEX idx_view_records_anonymous ON view_records(anonymous_visitor_id);
CREATE INDEX idx_view_records_session ON view_records(session_id);
CREATE INDEX idx_view_records_action ON view_records(action_type);
CREATE INDEX idx_view_records_created ON view_records(created_at);
CREATE INDEX idx_view_records_fingerprint ON view_records(device_fingerprint);
CREATE INDEX idx_view_records_page ON view_records(page_url);

-- ============================================
-- TABLE: user_searches
-- Track what users search for (analytics)
-- ============================================
CREATE TABLE user_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    anonymous_visitor_id UUID REFERENCES anonymous_visitors(id) ON DELETE SET NULL,
    
    -- Search details
    query TEXT NOT NULL,
    search_type TEXT, -- 'aides', 'procedures', 'renting', 'general'
    filters JSONB,
    
    -- Results
    results_count INTEGER,
    clicked_result_id TEXT,
    clicked_result_type TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_searches_query ON user_searches USING gin(to_tsvector('french', query));
CREATE INDEX idx_user_searches_type ON user_searches(search_type);
CREATE INDEX idx_user_searches_created ON user_searches(created_at);

-- ============================================
-- TABLE: user_favorites
-- Saved aides/procedures/rentals
-- ============================================
CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Reference to item
    item_type TEXT NOT NULL CHECK (item_type IN ('aide', 'procedure', 'renting', 'content')),
    item_id UUID NOT NULL,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, item_type, item_id)
);

CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_item ON user_favorites(item_type, item_id);

-- ============================================
-- TABLE: notifications
-- User notifications
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Notification content
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    notification_type TEXT NOT NULL, -- 'aide_update', 'subscription', 'content', 'system'
    
    -- Related item
    related_type TEXT,
    related_id UUID,
    
    -- Action
    action_url TEXT,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- ============================================
-- TABLE: system_settings
-- Application settings
-- ============================================
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES admins(id)
);

CREATE INDEX idx_system_settings_key ON system_settings(key);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gov_aides ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE renting ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE view_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Service role can do everything (for backend)
CREATE POLICY "Service role full access to profiles"
    ON profiles FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- ADMINS POLICIES
-- ============================================
CREATE POLICY "Admins can view admin table"
    ON admins FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admins a WHERE a.user_id = auth.uid()
        )
    );

CREATE POLICY "Super admins can manage admins"
    ON admins FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admins a 
            WHERE a.user_id = auth.uid() 
            AND a.role = 'super_admin'
        )
    );

-- ============================================
-- KNOWLEDGE BASE POLICIES (Public read)
-- ============================================
CREATE POLICY "Anyone can read gov_aides"
    ON gov_aides FOR SELECT
    USING (true);

CREATE POLICY "Anyone can read procedures"
    ON procedures FOR SELECT
    USING (true);

CREATE POLICY "Anyone can read renting"
    ON renting FOR SELECT
    USING (true);

-- Admins can manage knowledge base
CREATE POLICY "Admins can manage gov_aides"
    ON gov_aides FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admins a WHERE a.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage procedures"
    ON procedures FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admins a WHERE a.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage renting"
    ON renting FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admins a WHERE a.user_id = auth.uid()
        )
    );

-- ============================================
-- CONTENT POLICIES
-- ============================================
CREATE POLICY "Anyone can read published content"
    ON contents FOR SELECT
    USING (is_published = true);

CREATE POLICY "Admins can manage content"
    ON contents FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admins a WHERE a.user_id = auth.uid()
        )
    );

-- ============================================
-- CONTENT LIKES POLICIES
-- ============================================
CREATE POLICY "Users can view likes"
    ON content_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can like content"
    ON content_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
    ON content_likes FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- AFFILIATE POLICIES
-- ============================================
CREATE POLICY "Users can view own affiliate"
    ON affiliates FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage affiliates"
    ON affiliates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admins a WHERE a.user_id = auth.uid()
        )
    );

-- ============================================
-- STRIPE POLICIES
-- ============================================
CREATE POLICY "Users can view own stripe customer"
    ON stripe_customers FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Anyone can view products"
    ON stripe_products FOR SELECT
    USING (is_active = true);

CREATE POLICY "Users can view own subscriptions"
    ON stripe_subscriptions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view own invoices"
    ON stripe_invoices FOR SELECT
    USING (user_id = auth.uid());

-- Service role for backend operations
CREATE POLICY "Service role full access to stripe_customers"
    ON stripe_customers FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to stripe_subscriptions"
    ON stripe_subscriptions FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to stripe_invoices"
    ON stripe_invoices FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- CHAT POLICIES
-- ============================================
CREATE POLICY "Users can view own conversations"
    ON chat_conversations FOR SELECT
    USING (user_id = auth.uid() OR (user_id IS NULL AND anonymous_id IS NOT NULL));

CREATE POLICY "Users can create conversations"
    ON chat_conversations FOR INSERT
    WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can view messages in their conversations"
    ON chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chat_conversations c 
            WHERE c.id = conversation_id 
            AND (c.user_id = auth.uid() OR c.user_id IS NULL)
        )
    );

CREATE POLICY "Users can insert messages"
    ON chat_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_conversations c 
            WHERE c.id = conversation_id 
            AND (c.user_id = auth.uid() OR c.user_id IS NULL)
        )
    );

CREATE POLICY "Users can view own chat usage"
    ON chat_usage FOR SELECT
    USING (user_id = auth.uid());

-- ============================================
-- SIMULATIONS POLICIES
-- ============================================
CREATE POLICY "Users can view own simulations"
    ON simulations FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create simulations"
    ON simulations FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role full access to simulations"
    ON simulations FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

-- ============================================
-- USER FAVORITES POLICIES
-- ============================================
CREATE POLICY "Users can manage own favorites"
    ON user_favorites FOR ALL
    USING (user_id = auth.uid());

-- ============================================
-- VIEW RECORDS POLICIES (Service role only)
-- ============================================
CREATE POLICY "Service role full access to view_records"
    ON view_records FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to anonymous_visitors"
    ON anonymous_visitors FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default email templates
INSERT INTO email_templates (template_key, template_name, description, subject, body_html, body_text, category, available_variables)
VALUES 
(
    'welcome',
    'Welcome Email',
    'Sent to new users after registration',
    'Bienvenue sur AIDE+ - {{name}}!',
    '<html><body>
        <h1>Bienvenue sur AIDE+, {{name}}!</h1>
        <p>Nous sommes ravis de vous accueillir.</p>
        <p>AIDE+ vous aide à naviguer les aides gouvernementales et les procédures administratives en France.</p>
        <p>Commencez dès maintenant: <a href="{{app_url}}">Accéder à AIDE+</a></p>
    </body></html>',
    'Bienvenue sur AIDE+, {{name}}! Nous sommes ravis de vous accueillir.',
    'transactional',
    '["{{name}}", "{{email}}", "{{app_url}}"]'
),
(
    'password_reset',
    'Password Reset',
    'Password reset request',
    'Réinitialisez votre mot de passe AIDE+',
    '<html><body>
        <h1>Réinitialisation de mot de passe</h1>
        <p>Bonjour {{name}},</p>
        <p>Cliquez sur le lien suivant pour réinitialiser votre mot de passe:</p>
        <p><a href="{{reset_link}}">Réinitialiser mon mot de passe</a></p>
        <p>Ce lien expire dans 1 heure.</p>
    </body></html>',
    'Cliquez sur ce lien pour réinitialiser votre mot de passe: {{reset_link}}',
    'transactional',
    '["{{name}}", "{{email}}", "{{reset_link}}"]'
),
(
    'subscription_welcome',
    'Subscription Welcome',
    'Sent when user subscribes',
    'Merci pour votre abonnement {{tier}} AIDE+!',
    '<html><body>
        <h1>Merci {{name}}!</h1>
        <p>Votre abonnement {{tier}} est maintenant actif.</p>
        <p>Vous avez accès à:</p>
        <ul>{{features}}</ul>
    </body></html>',
    'Merci {{name}}! Votre abonnement {{tier}} est maintenant actif.',
    'transactional',
    '["{{name}}", "{{tier}}", "{{features}}", "{{amount}}"]'
),
(
    'subscription_canceled',
    'Subscription Canceled',
    'Sent when subscription is canceled',
    'Votre abonnement AIDE+ a été annulé',
    '<html><body>
        <h1>Abonnement annulé</h1>
        <p>Bonjour {{name}},</p>
        <p>Votre abonnement a été annulé et prendra fin le {{end_date}}.</p>
        <p>Vous pouvez vous réabonner à tout moment.</p>
    </body></html>',
    'Votre abonnement AIDE+ a été annulé et prendra fin le {{end_date}}.',
    'transactional',
    '["{{name}}", "{{end_date}}"]'
),
(
    'affiliate_payout',
    'Affiliate Payout',
    'Sent when affiliate receives payout',
    'Votre paiement AIDE+ de {{amount}}€ a été envoyé!',
    '<html><body>
        <h1>Paiement envoyé!</h1>
        <p>Bonjour {{name}},</p>
        <p>Nous avons envoyé votre paiement de {{amount}}€.</p>
        <p>Merci pour votre partenariat!</p>
    </body></html>',
    'Votre paiement de {{amount}}€ a été envoyé!',
    'transactional',
    '["{{name}}", "{{amount}}", "{{payout_method}}"]'
);

-- Insert default system settings
INSERT INTO system_settings (key, value, description)
VALUES
('ai_model', '"gpt-4"', 'Default AI model for chat'),
('free_tier_messages', '10', 'Daily AI messages for free tier'),
('basic_tier_messages', '50', 'Daily AI messages for basic tier'),
('premium_tier_messages', '200', 'Daily AI messages for premium tier'),
('default_commission_rate', '10', 'Default affiliate commission percentage'),
('minimum_payout', '50', 'Minimum affiliate payout amount in EUR');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ AIDE+ Database Schema created successfully!';
    RAISE NOTICE '📊 Tables created: 25+';
    RAISE NOTICE '🔒 RLS policies enabled';
    RAISE NOTICE '📧 Email templates inserted';
    RAISE NOTICE '⚙️ System settings configured';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run functions.sql for triggers and functions';
    RAISE NOTICE '2. Import knowledge base data';
    RAISE NOTICE '3. Create first admin user';
END $$;
