-- ===========================================
-- Migration: Fix Content Views & Add Likes Function
-- ===========================================
-- This migration adds functions to properly handle content views and likes

-- =============================================
-- 1. Drop existing triggers to prevent conflicts
-- =============================================

DROP TRIGGER IF EXISTS trigger_sync_content_view_count ON content_views;
DROP TRIGGER IF EXISTS trigger_sync_content_like_count ON content_likes;

-- =============================================
-- 2. Function to increment content view count
-- Only updates contents.view_count directly (no trigger needed)
-- =============================================

CREATE OR REPLACE FUNCTION increment_content_views(p_content_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Increment the view_count on contents table
    UPDATE contents 
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = p_content_id;
    
    -- If user is authenticated, track in content_views for daily limits (once per day per content)
    IF p_user_id IS NOT NULL THEN
        INSERT INTO content_views (user_id, content_id, view_date)
        VALUES (p_user_id, p_content_id, CURRENT_DATE)
        ON CONFLICT (user_id, content_id, view_date) DO NOTHING;
    END IF;
END;
$$;

-- =============================================
-- 3. Function to get aggregated view count from content_views
-- Useful for getting accurate counts per content
-- =============================================

CREATE OR REPLACE FUNCTION get_content_view_count(p_content_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM content_views
    WHERE content_id = p_content_id;
    
    RETURN COALESCE(v_count, 0);
END;
$$;

-- =============================================
-- 4. Function to sync like count via trigger
-- =============================================

CREATE OR REPLACE FUNCTION sync_content_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE contents 
        SET like_count = COALESCE(like_count, 0) + 1
        WHERE id = NEW.content_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE contents 
        SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
        WHERE id = OLD.content_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Create like count trigger
CREATE TRIGGER trigger_sync_content_like_count
    AFTER INSERT OR DELETE ON content_likes
    FOR EACH ROW
    EXECUTE FUNCTION sync_content_like_count();

-- =============================================
-- 5. Function to check if user has liked content
-- =============================================

CREATE OR REPLACE FUNCTION check_user_content_like(p_content_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM content_likes 
        WHERE content_id = p_content_id AND user_id = p_user_id
    );
END;
$$;

-- =============================================
-- 6. Add RLS policies for content_likes
-- =============================================

-- Enable RLS
ALTER TABLE content_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view content likes" ON content_likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON content_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON content_likes;

-- Create new policies
CREATE POLICY "Anyone can view content likes"
    ON content_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own likes"
    ON content_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
    ON content_likes FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- 7. Sync existing content_views to contents.view_count
-- =============================================

UPDATE contents c
SET view_count = (
    SELECT COUNT(*) FROM content_views cv WHERE cv.content_id = c.id
);

-- =============================================
-- 8. Sync existing content_likes to contents.like_count
-- =============================================

UPDATE contents c
SET like_count = (
    SELECT COUNT(*) FROM content_likes cl WHERE cl.content_id = c.id
);

-- =============================================
-- Comments
-- =============================================

COMMENT ON FUNCTION increment_content_views IS 'Increments view count for content and optionally tracks user view for daily limits';
COMMENT ON FUNCTION get_content_view_count IS 'Returns aggregated view count from content_views table';
COMMENT ON FUNCTION sync_content_like_count IS 'Trigger function to keep contents.like_count in sync with content_likes';
COMMENT ON FUNCTION check_user_content_like IS 'Checks if a user has liked specific content';
