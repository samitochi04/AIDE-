-- ============================================
-- AIDE+ DATABASE FUNCTIONS & TRIGGERS
-- Supabase SQL Script
-- Version: 1.0.0
-- Last Updated: 2025-12-09
-- ============================================

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function: Calculate age group from date of birth
CREATE OR REPLACE FUNCTION get_age_group(dob DATE)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    age_years INTEGER;
BEGIN
    IF dob IS NULL THEN
        RETURN NULL;
    END IF;
    
    age_years := EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob));
    
    RETURN CASE 
        WHEN age_years < 4 THEN 'infant'
        WHEN age_years < 12 THEN 'child'
        WHEN age_years < 18 THEN 'adolescent'
        WHEN age_years < 26 THEN 'young_adult'
        WHEN age_years < 60 THEN 'adult'
        ELSE 'senior'
    END;
END;
$$;

-- Function: Generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(length INTEGER DEFAULT 8)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Removed confusing chars (0, O, 1, I)
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$;

-- Function: Generate unique affiliate code
CREATE OR REPLACE FUNCTION generate_affiliate_code(user_name TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    prefix TEXT;
    suffix TEXT;
    code TEXT;
    attempts INTEGER := 0;
BEGIN
    -- Create prefix from name or random
    IF user_name IS NOT NULL AND length(user_name) >= 3 THEN
        prefix := upper(substring(user_name FROM 1 FOR 3));
    ELSE
        prefix := generate_referral_code(3);
    END IF;
    
    -- Generate unique code
    LOOP
        suffix := generate_referral_code(5);
        code := prefix || suffix;
        
        -- Check if exists
        IF NOT EXISTS (SELECT 1 FROM affiliates WHERE affiliate_code = code) THEN
            RETURN code;
        END IF;
        
        attempts := attempts + 1;
        IF attempts > 100 THEN
            RAISE EXCEPTION 'Could not generate unique affiliate code';
        END IF;
    END LOOP;
END;
$$;

-- Function: Update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================
-- AUTO-CREATE PROFILE FROM AUTH
-- This is the main function to sync auth.users to profiles
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    referral_code TEXT;
    referred_by_id UUID;
BEGIN
    -- Generate unique referral code
    LOOP
        referral_code := generate_referral_code(8);
        EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.referral_code = referral_code);
    END LOOP;
    
    -- Check if user signed up with a referral code (from metadata)
    IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
        SELECT id INTO referred_by_id
        FROM profiles
        WHERE profiles.referral_code = NEW.raw_user_meta_data->>'referral_code';
    END IF;
    
    -- Insert new profile
    INSERT INTO profiles (
        id,
        email,
        full_name,
        avatar_url,
        referred_by,
        referral_code,
        language,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        referred_by_id,
        referral_code,
        COALESCE(NEW.raw_user_meta_data->>'language', 'fr'),
        NOW(),
        NOW()
    );
    
    -- If user was referred by an affiliate, track it
    IF referred_by_id IS NOT NULL THEN
        UPDATE affiliates
        SET total_referrals = total_referrals + 1,
            updated_at = NOW()
        WHERE user_id = referred_by_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger: Create profile on new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================
-- PROFILE UPDATE HANDLERS
-- ============================================

-- Function: Update subscription tier in profile when subscription changes
CREATE OR REPLACE FUNCTION sync_subscription_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update profile subscription tier
    UPDATE profiles
    SET subscription_tier = NEW.tier,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$;

-- Trigger: Sync subscription tier
CREATE OR REPLACE TRIGGER on_subscription_change
    AFTER INSERT OR UPDATE ON stripe_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION sync_subscription_to_profile();

-- ============================================
-- CONTENT LIKE HANDLERS
-- ============================================

-- Function: Update like count on content
CREATE OR REPLACE FUNCTION update_content_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE contents
        SET like_count = like_count + 1,
            updated_at = NOW()
        WHERE id = NEW.content_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE contents
        SET like_count = GREATEST(like_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.content_id;
        RETURN OLD;
    END IF;
END;
$$;

-- Trigger: Update like counts
CREATE OR REPLACE TRIGGER on_content_like_change
    AFTER INSERT OR DELETE ON content_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_content_like_count();

-- ============================================
-- CHAT MESSAGE HANDLERS
-- ============================================

-- Function: Update conversation on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE chat_conversations
    SET message_count = message_count + 1,
        last_message_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$;

-- Trigger: Update conversation stats
CREATE OR REPLACE TRIGGER on_chat_message_insert
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_message();

-- Function: Track AI usage
CREATE OR REPLACE FUNCTION track_ai_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    conv_user_id UUID;
    period_start_date TIMESTAMPTZ;
    period_end_date TIMESTAMPTZ;
BEGIN
    -- Only track assistant messages (AI responses)
    IF NEW.role != 'assistant' THEN
        RETURN NEW;
    END IF;
    
    -- Get user from conversation
    SELECT user_id INTO conv_user_id
    FROM chat_conversations
    WHERE id = NEW.conversation_id;
    
    -- Only track for logged-in users
    IF conv_user_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Calculate current period (daily)
    period_start_date := date_trunc('day', NOW());
    period_end_date := period_start_date + interval '1 day';
    
    -- Insert or update usage record
    INSERT INTO chat_usage (user_id, period_start, period_end, messages_count, tokens_used)
    VALUES (conv_user_id, period_start_date, period_end_date, 1, COALESCE(NEW.tokens_used, 0))
    ON CONFLICT (user_id, period_start) DO UPDATE
    SET messages_count = chat_usage.messages_count + 1,
        tokens_used = chat_usage.tokens_used + COALESCE(NEW.tokens_used, 0),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$;

-- Trigger: Track AI usage
CREATE OR REPLACE TRIGGER on_ai_response
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION track_ai_usage();

-- ============================================
-- AFFILIATE & REFERRAL HANDLERS
-- ============================================

-- Function: Process affiliate commission on subscription
CREATE OR REPLACE FUNCTION process_affiliate_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    affiliate_record RECORD;
    commission_amount DECIMAL(10,2);
    subscription_amount DECIMAL(10,2);
BEGIN
    -- Only process new active subscriptions
    IF NEW.status != 'active' OR NEW.affiliate_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Get affiliate info
    SELECT * INTO affiliate_record
    FROM affiliates
    WHERE id = NEW.affiliate_id AND is_active = TRUE;
    
    IF affiliate_record IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Get subscription price (from stripe_products)
    SELECT price_amount / 100.0 INTO subscription_amount
    FROM stripe_products
    WHERE stripe_price_id = NEW.stripe_price_id;
    
    IF subscription_amount IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Calculate commission
    commission_amount := subscription_amount * (affiliate_record.commission_rate / 100);
    
    -- Create commission transaction
    INSERT INTO affiliate_transactions (
        affiliate_id,
        subscription_id,
        referred_user_id,
        transaction_type,
        amount,
        subscription_amount,
        commission_rate,
        status
    )
    VALUES (
        affiliate_record.id,
        NEW.id,
        NEW.user_id,
        'commission',
        commission_amount,
        subscription_amount,
        affiliate_record.commission_rate,
        'pending'
    );
    
    -- Update affiliate stats
    UPDATE affiliates
    SET successful_conversions = successful_conversions + 1,
        total_earnings = total_earnings + commission_amount,
        pending_earnings = pending_earnings + commission_amount,
        updated_at = NOW()
    WHERE id = affiliate_record.id;
    
    RETURN NEW;
END;
$$;

-- Trigger: Process affiliate commission
CREATE OR REPLACE TRIGGER on_new_subscription
    AFTER INSERT ON stripe_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION process_affiliate_commission();

-- ============================================
-- ANONYMOUS VISITOR TRACKING
-- ============================================

-- Function: Get or create anonymous visitor
CREATE OR REPLACE FUNCTION get_or_create_anonymous_visitor(
    p_device_fingerprint TEXT,
    p_ip TEXT,
    p_user_agent TEXT,
    p_source TEXT DEFAULT NULL,
    p_medium TEXT DEFAULT NULL,
    p_campaign TEXT DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL,
    p_landing_page TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    visitor_id UUID;
    device_info RECORD;
BEGIN
    -- Try to find existing visitor
    SELECT id INTO visitor_id
    FROM anonymous_visitors
    WHERE device_fingerprint = p_device_fingerprint;
    
    IF visitor_id IS NOT NULL THEN
        -- Update existing visitor
        UPDATE anonymous_visitors
        SET current_ip = p_ip,
            last_seen_at = NOW(),
            total_sessions = total_sessions + 1
        WHERE id = visitor_id;
        
        RETURN visitor_id;
    END IF;
    
    -- Parse device info from user agent
    -- (simplified - in production use a proper parser)
    SELECT
        CASE 
            WHEN p_user_agent ILIKE '%mobile%' THEN 'mobile'
            WHEN p_user_agent ILIKE '%tablet%' THEN 'tablet'
            ELSE 'desktop'
        END as device_type,
        CASE
            WHEN p_user_agent ILIKE '%chrome%' THEN 'Chrome'
            WHEN p_user_agent ILIKE '%firefox%' THEN 'Firefox'
            WHEN p_user_agent ILIKE '%safari%' THEN 'Safari'
            WHEN p_user_agent ILIKE '%edge%' THEN 'Edge'
            ELSE 'Other'
        END as browser,
        CASE
            WHEN p_user_agent ILIKE '%windows%' THEN 'Windows'
            WHEN p_user_agent ILIKE '%mac%' THEN 'macOS'
            WHEN p_user_agent ILIKE '%linux%' THEN 'Linux'
            WHEN p_user_agent ILIKE '%android%' THEN 'Android'
            WHEN p_user_agent ILIKE '%iphone%' OR p_user_agent ILIKE '%ipad%' THEN 'iOS'
            ELSE 'Other'
        END as os
    INTO device_info;
    
    -- Create new visitor
    INSERT INTO anonymous_visitors (
        device_fingerprint,
        first_ip,
        current_ip,
        user_agent,
        device_type,
        browser,
        os,
        first_source,
        first_medium,
        first_campaign,
        first_referrer,
        landing_page
    )
    VALUES (
        p_device_fingerprint,
        p_ip,
        p_ip,
        p_user_agent,
        device_info.device_type,
        device_info.browser,
        device_info.os,
        p_source,
        p_medium,
        p_campaign,
        p_referrer,
        p_landing_page
    )
    RETURNING id INTO visitor_id;
    
    RETURN visitor_id;
END;
$$;

-- Function: Link anonymous visitor to user on signup
CREATE OR REPLACE FUNCTION link_anonymous_visitor_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    visitor_fingerprint TEXT;
BEGIN
    -- Get device fingerprint from metadata
    visitor_fingerprint := NEW.raw_user_meta_data->>'device_fingerprint';
    
    IF visitor_fingerprint IS NOT NULL THEN
        -- Update anonymous visitor
        UPDATE anonymous_visitors
        SET converted_to_user_id = NEW.id,
            converted_at = NOW()
        WHERE device_fingerprint = visitor_fingerprint
        AND converted_to_user_id IS NULL;
        
        -- Update view records
        UPDATE view_records
        SET user_id = NEW.id
        WHERE device_fingerprint = visitor_fingerprint
        AND user_id IS NULL;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger: Link anonymous visitor on signup
CREATE OR REPLACE TRIGGER on_user_signup_link_visitor
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION link_anonymous_visitor_to_user();

-- ============================================
-- VIEW RECORD TRACKING
-- ============================================

-- Function: Record page view or API call
CREATE OR REPLACE FUNCTION record_view(
    p_user_id UUID DEFAULT NULL,
    p_anonymous_visitor_id UUID DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_device_fingerprint TEXT DEFAULT NULL,
    p_page_url TEXT DEFAULT NULL,
    p_page_title TEXT DEFAULT NULL,
    p_action_type TEXT DEFAULT 'page_view',
    p_action_details JSONB DEFAULT NULL,
    p_api_endpoint TEXT DEFAULT NULL,
    p_api_method TEXT DEFAULT NULL,
    p_api_params JSONB DEFAULT NULL,
    p_api_response_status INTEGER DEFAULT NULL,
    p_api_response_time_ms INTEGER DEFAULT NULL,
    p_search_query TEXT DEFAULT NULL,
    p_search_results_count INTEGER DEFAULT NULL,
    p_search_filters JSONB DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL,
    p_utm_source TEXT DEFAULT NULL,
    p_utm_medium TEXT DEFAULT NULL,
    p_utm_campaign TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    record_id UUID;
BEGIN
    INSERT INTO view_records (
        user_id,
        anonymous_visitor_id,
        session_id,
        ip_address,
        user_agent,
        device_fingerprint,
        page_url,
        page_title,
        action_type,
        action_details,
        api_endpoint,
        api_method,
        api_params,
        api_response_status,
        api_response_time_ms,
        search_query,
        search_results_count,
        search_filters,
        referrer,
        utm_source,
        utm_medium,
        utm_campaign
    )
    VALUES (
        p_user_id,
        p_anonymous_visitor_id,
        COALESCE(p_session_id, gen_random_uuid()::TEXT),
        p_ip_address,
        p_user_agent,
        p_device_fingerprint,
        p_page_url,
        p_page_title,
        p_action_type,
        p_action_details,
        p_api_endpoint,
        p_api_method,
        p_api_params,
        p_api_response_status,
        p_api_response_time_ms,
        p_search_query,
        p_search_results_count,
        p_search_filters,
        p_referrer,
        p_utm_source,
        p_utm_medium,
        p_utm_campaign
    )
    RETURNING id INTO record_id;
    
    -- Update visitor stats if anonymous
    IF p_anonymous_visitor_id IS NOT NULL THEN
        UPDATE anonymous_visitors
        SET total_page_views = total_page_views + 1,
            last_seen_at = NOW()
        WHERE id = p_anonymous_visitor_id;
    END IF;
    
    RETURN record_id;
END;
$$;

-- ============================================
-- EMAIL TEMPLATE FUNCTIONS
-- ============================================

-- Function: Get email template with substitutions
CREATE OR REPLACE FUNCTION get_email_template(
    p_template_key TEXT,
    p_language TEXT DEFAULT 'fr',
    p_variables JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (subject TEXT, body_html TEXT, body_text TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    template_record RECORD;
    result_subject TEXT;
    result_body_html TEXT;
    result_body_text TEXT;
    var_key TEXT;
    var_value TEXT;
BEGIN
    -- Get template
    SELECT * INTO template_record
    FROM email_templates et
    WHERE et.template_key = p_template_key
    AND et.is_active = TRUE;
    
    IF template_record IS NULL THEN
        RAISE EXCEPTION 'Template not found: %', p_template_key;
    END IF;
    
    -- Get translations if not default language
    IF p_language != 'fr' AND template_record.translations ? p_language THEN
        result_subject := template_record.translations->p_language->>'subject';
        result_body_html := template_record.translations->p_language->>'body_html';
        result_body_text := template_record.translations->p_language->>'body_text';
    ELSE
        result_subject := template_record.subject;
        result_body_html := template_record.body_html;
        result_body_text := template_record.body_text;
    END IF;
    
    -- Replace variables
    FOR var_key, var_value IN SELECT * FROM jsonb_each_text(p_variables)
    LOOP
        result_subject := replace(result_subject, '{{' || var_key || '}}', var_value);
        result_body_html := replace(result_body_html, '{{' || var_key || '}}', var_value);
        IF result_body_text IS NOT NULL THEN
            result_body_text := replace(result_body_text, '{{' || var_key || '}}', var_value);
        END IF;
    END LOOP;
    
    -- Update usage stats
    UPDATE email_templates
    SET last_used_at = NOW(),
        send_count = send_count + 1
    WHERE id = template_record.id;
    
    RETURN QUERY SELECT result_subject, result_body_html, result_body_text;
END;
$$;

-- ============================================
-- RAG SEARCH FUNCTIONS
-- ============================================

-- Function: Search gov_aides with semantic similarity
CREATE OR REPLACE FUNCTION search_gov_aides(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10,
    filter_region TEXT DEFAULT NULL,
    filter_profile TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    aide_name TEXT,
    aide_description TEXT,
    region_name TEXT,
    profile_type TEXT,
    aide_data JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ga.id,
        ga.aide_name,
        ga.aide_description,
        ga.region_name,
        ga.profile_type,
        ga.aide_data,
        1 - (ga.embedding <=> query_embedding) AS similarity
    FROM gov_aides ga
    WHERE 1 - (ga.embedding <=> query_embedding) > match_threshold
    AND (filter_region IS NULL OR ga.region_id = filter_region)
    AND (filter_profile IS NULL OR ga.profile_type = filter_profile OR ga.profile_type = 'all')
    ORDER BY ga.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function: Search procedures with semantic similarity
CREATE OR REPLACE FUNCTION search_procedures(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10,
    filter_category TEXT DEFAULT NULL,
    filter_subcategory TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    procedure_name TEXT,
    procedure_description TEXT,
    category TEXT,
    subcategory TEXT,
    section TEXT,
    procedure_data JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.procedure_name,
        p.procedure_description,
        p.category,
        p.subcategory,
        p.section,
        p.procedure_data,
        1 - (p.embedding <=> query_embedding) AS similarity
    FROM procedures p
    WHERE 1 - (p.embedding <=> query_embedding) > match_threshold
    AND (filter_category IS NULL OR p.category = filter_category)
    AND (filter_subcategory IS NULL OR p.subcategory = filter_subcategory)
    ORDER BY p.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function: Search renting with semantic similarity
CREATE OR REPLACE FUNCTION search_renting(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10,
    filter_category TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    platform_name TEXT,
    platform_description TEXT,
    category TEXT,
    platform_data JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.platform_name,
        r.platform_description,
        r.category,
        r.platform_data,
        1 - (r.embedding <=> query_embedding) AS similarity
    FROM renting r
    WHERE 1 - (r.embedding <=> query_embedding) > match_threshold
    AND (filter_category IS NULL OR r.category = filter_category)
    ORDER BY r.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function: Combined RAG search across all knowledge bases
CREATE OR REPLACE FUNCTION search_all_knowledge(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    source_type TEXT,
    source_id UUID,
    title TEXT,
    description TEXT,
    category TEXT,
    data JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    (
        SELECT 
            'gov_aides'::TEXT as source_type,
            ga.id as source_id,
            ga.aide_name as title,
            ga.aide_description as description,
            ga.region_name as category,
            ga.aide_data as data,
            1 - (ga.embedding <=> query_embedding) AS similarity
        FROM gov_aides ga
        WHERE 1 - (ga.embedding <=> query_embedding) > match_threshold
    )
    UNION ALL
    (
        SELECT 
            'procedures'::TEXT as source_type,
            p.id as source_id,
            p.procedure_name as title,
            p.procedure_description as description,
            p.category || '/' || p.subcategory as category,
            p.procedure_data as data,
            1 - (p.embedding <=> query_embedding) AS similarity
        FROM procedures p
        WHERE 1 - (p.embedding <=> query_embedding) > match_threshold
    )
    UNION ALL
    (
        SELECT 
            'renting'::TEXT as source_type,
            r.id as source_id,
            r.platform_name as title,
            r.platform_description as description,
            r.category as category,
            r.platform_data as data,
            1 - (r.embedding <=> query_embedding) AS similarity
        FROM renting r
        WHERE 1 - (r.embedding <=> query_embedding) > match_threshold
    )
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;

-- ============================================
-- FULL-TEXT SEARCH FUNCTIONS
-- ============================================

-- Function: Full-text search across all knowledge
CREATE OR REPLACE FUNCTION fulltext_search_knowledge(
    search_query TEXT,
    max_results INT DEFAULT 20
)
RETURNS TABLE (
    source_type TEXT,
    source_id UUID,
    title TEXT,
    description TEXT,
    category TEXT,
    rank REAL
)
LANGUAGE plpgsql
AS $$
DECLARE
    ts_query tsquery;
BEGIN
    -- Parse search query
    ts_query := websearch_to_tsquery('french', search_query);
    
    RETURN QUERY
    (
        SELECT 
            'gov_aides'::TEXT,
            ga.id,
            ga.aide_name,
            ga.aide_description,
            ga.region_name,
            ts_rank(to_tsvector('french', ga.content_text), ts_query)
        FROM gov_aides ga
        WHERE to_tsvector('french', ga.content_text) @@ ts_query
    )
    UNION ALL
    (
        SELECT 
            'procedures'::TEXT,
            p.id,
            p.procedure_name,
            p.procedure_description,
            p.category || '/' || p.subcategory,
            ts_rank(to_tsvector('french', p.content_text), ts_query)
        FROM procedures p
        WHERE to_tsvector('french', p.content_text) @@ ts_query
    )
    UNION ALL
    (
        SELECT 
            'renting'::TEXT,
            r.id,
            r.platform_name,
            r.platform_description,
            r.category,
            ts_rank(to_tsvector('french', r.content_text), ts_query)
        FROM renting r
        WHERE to_tsvector('french', r.content_text) @@ ts_query
    )
    ORDER BY rank DESC
    LIMIT max_results;
END;
$$;

-- ============================================
-- PROMO CODE FUNCTIONS
-- ============================================

-- Function: Validate and apply promo code
CREATE OR REPLACE FUNCTION validate_promo_code(
    p_code TEXT,
    p_user_id UUID,
    p_tier subscription_tier,
    p_amount DECIMAL(10,2)
)
RETURNS TABLE (
    is_valid BOOLEAN,
    discount_type TEXT,
    discount_value DECIMAL(10,2),
    final_amount DECIMAL(10,2),
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    promo RECORD;
    user_has_used BOOLEAN;
    discounted_amount DECIMAL(10,2);
BEGIN
    -- Get promo code
    SELECT * INTO promo
    FROM promo_codes pc
    WHERE pc.code = upper(p_code)
    AND pc.is_active = TRUE;
    
    -- Check if exists
    IF promo IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL, 'Invalid promo code'::TEXT;
        RETURN;
    END IF;
    
    -- Check validity period
    IF promo.valid_from > NOW() THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL, 'Promo code not yet active'::TEXT;
        RETURN;
    END IF;
    
    IF promo.valid_until IS NOT NULL AND promo.valid_until < NOW() THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL, 'Promo code expired'::TEXT;
        RETURN;
    END IF;
    
    -- Check max uses
    IF promo.max_uses IS NOT NULL AND promo.current_uses >= promo.max_uses THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL, 'Promo code usage limit reached'::TEXT;
        RETURN;
    END IF;
    
    -- Check tier eligibility
    IF NOT (p_tier = ANY(promo.applicable_tiers)) THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL, 'Promo code not valid for this plan'::TEXT;
        RETURN;
    END IF;
    
    -- Check minimum amount
    IF p_amount < promo.minimum_amount THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL, 
            format('Minimum purchase of €%s required', promo.minimum_amount)::TEXT;
        RETURN;
    END IF;
    
    -- Check first-time only
    IF promo.first_time_only THEN
        SELECT EXISTS (
            SELECT 1 FROM stripe_subscriptions ss
            WHERE ss.user_id = p_user_id
        ) INTO user_has_used;
        
        IF user_has_used THEN
            RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL, 'Promo code only for first-time subscribers'::TEXT;
            RETURN;
        END IF;
    END IF;
    
    -- Calculate discount
    IF promo.discount_type = 'percentage' THEN
        discounted_amount := p_amount * (1 - promo.discount_value / 100);
    ELSE
        discounted_amount := GREATEST(p_amount - promo.discount_value, 0);
    END IF;
    
    -- Return success
    RETURN QUERY SELECT TRUE, promo.discount_type, promo.discount_value, discounted_amount, NULL::TEXT;
END;
$$;

-- Function: Increment promo code usage
CREATE OR REPLACE FUNCTION use_promo_code(p_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE promo_codes
    SET current_uses = current_uses + 1,
        updated_at = NOW()
    WHERE code = upper(p_code);
END;
$$;

-- ============================================
-- CHAT RATE LIMITING
-- ============================================

-- Function: Check if user can send message
CREATE OR REPLACE FUNCTION can_send_chat_message(p_user_id UUID)
RETURNS TABLE (
    allowed BOOLEAN,
    remaining_messages INTEGER,
    reset_at TIMESTAMPTZ,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_tier subscription_tier;
    messages_limit INTEGER;
    current_usage INTEGER;
    period_start_date TIMESTAMPTZ;
BEGIN
    -- Get user tier
    SELECT subscription_tier INTO user_tier
    FROM profiles
    WHERE id = p_user_id;
    
    IF user_tier IS NULL THEN
        user_tier := 'free';
    END IF;
    
    -- Get limit based on tier
    SELECT 
        CASE user_tier
            WHEN 'free' THEN (SELECT value::INTEGER FROM system_settings WHERE key = 'free_tier_messages')
            WHEN 'basic' THEN (SELECT value::INTEGER FROM system_settings WHERE key = 'basic_tier_messages')
            WHEN 'premium' THEN (SELECT value::INTEGER FROM system_settings WHERE key = 'premium_tier_messages')
            ELSE 999999  -- Enterprise = unlimited
        END
    INTO messages_limit;
    
    -- Get current usage
    period_start_date := date_trunc('day', NOW());
    
    SELECT COALESCE(cu.messages_count, 0) INTO current_usage
    FROM chat_usage cu
    WHERE cu.user_id = p_user_id
    AND cu.period_start = period_start_date;
    
    -- Check limit
    IF current_usage >= messages_limit THEN
        RETURN QUERY SELECT 
            FALSE, 
            0, 
            period_start_date + interval '1 day',
            'Daily message limit reached. Upgrade your plan for more messages.'::TEXT;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT 
        TRUE, 
        messages_limit - current_usage, 
        period_start_date + interval '1 day',
        NULL::TEXT;
END;
$$;

-- ============================================
-- ADMIN FUNCTIONS
-- ============================================

-- Function: Make user an admin
CREATE OR REPLACE FUNCTION make_admin(
    p_user_id UUID,
    p_role admin_role DEFAULT 'moderator',
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_id UUID;
BEGIN
    INSERT INTO admins (user_id, role, created_by)
    VALUES (p_user_id, p_role, p_created_by)
    ON CONFLICT (user_id) DO UPDATE
    SET role = p_role,
        updated_at = NOW()
    RETURNING id INTO admin_id;
    
    RETURN admin_id;
END;
$$;

-- Function: Create first super admin (run once)
CREATE OR REPLACE FUNCTION create_first_super_admin(p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    admin_id UUID;
BEGIN
    -- Check if any admin exists
    IF EXISTS (SELECT 1 FROM admins WHERE role = 'super_admin') THEN
        RAISE EXCEPTION 'Super admin already exists';
    END IF;
    
    -- Get user by email
    SELECT id INTO user_id
    FROM profiles
    WHERE email = p_email;
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User not found with email: %', p_email;
    END IF;
    
    -- Create super admin
    INSERT INTO admins (user_id, role, can_create_promo_codes, permissions)
    VALUES (
        user_id, 
        'super_admin', 
        TRUE,
        '{
            "manage_users": true,
            "manage_content": true,
            "manage_affiliates": true,
            "manage_subscriptions": true,
            "view_analytics": true,
            "manage_admins": true
        }'::jsonb
    )
    RETURNING id INTO admin_id;
    
    RETURN admin_id;
END;
$$;

-- ============================================
-- UPDATE TRIGGERS FOR ALL TABLES
-- ============================================

-- Apply updated_at triggers to relevant tables
CREATE OR REPLACE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER update_affiliates_updated_at
    BEFORE UPDATE ON affiliates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER update_promo_codes_updated_at
    BEFORE UPDATE ON promo_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER update_gov_aides_updated_at
    BEFORE UPDATE ON gov_aides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER update_procedures_updated_at
    BEFORE UPDATE ON procedures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER update_renting_updated_at
    BEFORE UPDATE ON renting
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER update_contents_updated_at
    BEFORE UPDATE ON contents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER update_stripe_customers_updated_at
    BEFORE UPDATE ON stripe_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER update_stripe_products_updated_at
    BEFORE UPDATE ON stripe_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER update_stripe_subscriptions_updated_at
    BEFORE UPDATE ON stripe_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER update_chat_conversations_updated_at
    BEFORE UPDATE ON chat_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER update_chat_usage_updated_at
    BEFORE UPDATE ON chat_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ANALYTICS HELPER FUNCTIONS
-- ============================================

-- Function: Get conversion funnel stats
CREATE OR REPLACE FUNCTION get_conversion_funnel(
    p_start_date TIMESTAMPTZ DEFAULT NOW() - interval '30 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    total_visitors BIGINT,
    visitors_with_search BIGINT,
    visitors_with_chat BIGINT,
    registered_users BIGINT,
    subscribed_users BIGINT,
    conversion_rate DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM anonymous_visitors WHERE first_seen_at BETWEEN p_start_date AND p_end_date),
        (SELECT COUNT(DISTINCT anonymous_visitor_id) FROM view_records WHERE action_type = 'search' AND created_at BETWEEN p_start_date AND p_end_date),
        (SELECT COUNT(DISTINCT anonymous_visitor_id) FROM chat_conversations WHERE user_id IS NULL AND created_at BETWEEN p_start_date AND p_end_date),
        (SELECT COUNT(*) FROM profiles WHERE created_at BETWEEN p_start_date AND p_end_date),
        (SELECT COUNT(DISTINCT user_id) FROM stripe_subscriptions WHERE status = 'active' AND created_at BETWEEN p_start_date AND p_end_date),
        ROUND(
            (SELECT COUNT(*) FROM profiles WHERE created_at BETWEEN p_start_date AND p_end_date)::DECIMAL /
            NULLIF((SELECT COUNT(*) FROM anonymous_visitors WHERE first_seen_at BETWEEN p_start_date AND p_end_date), 0) * 100,
            2
        );
END;
$$;

-- Function: Get popular searches
CREATE OR REPLACE FUNCTION get_popular_searches(
    p_limit INT DEFAULT 20,
    p_days INT DEFAULT 30
)
RETURNS TABLE (
    query TEXT,
    search_count BIGINT,
    avg_results DECIMAL(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        us.query,
        COUNT(*) as search_count,
        ROUND(AVG(us.results_count)::DECIMAL, 2) as avg_results
    FROM user_searches us
    WHERE us.created_at > NOW() - (p_days || ' days')::interval
    GROUP BY us.query
    ORDER BY search_count DESC
    LIMIT p_limit;
END;
$$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ AIDE+ Functions & Triggers created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Functions created:';
    RAISE NOTICE '   - handle_new_user (auto-create profile)';
    RAISE NOTICE '   - sync_subscription_to_profile';
    RAISE NOTICE '   - update_content_like_count';
    RAISE NOTICE '   - process_affiliate_commission';
    RAISE NOTICE '   - get_or_create_anonymous_visitor';
    RAISE NOTICE '   - record_view';
    RAISE NOTICE '   - get_email_template';
    RAISE NOTICE '   - search_gov_aides (RAG)';
    RAISE NOTICE '   - search_procedures (RAG)';
    RAISE NOTICE '   - search_renting (RAG)';
    RAISE NOTICE '   - search_all_knowledge (RAG)';
    RAISE NOTICE '   - fulltext_search_knowledge';
    RAISE NOTICE '   - validate_promo_code';
    RAISE NOTICE '   - can_send_chat_message';
    RAISE NOTICE '   - make_admin';
    RAISE NOTICE '   - create_first_super_admin';
    RAISE NOTICE '   - get_conversion_funnel';
    RAISE NOTICE '   - get_popular_searches';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ Triggers configured for all tables';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next steps:';
    RAISE NOTICE '1. Create first super admin: SELECT create_first_super_admin(''your-email@example.com'');';
    RAISE NOTICE '2. Import knowledge base data with embeddings';
END $$;
