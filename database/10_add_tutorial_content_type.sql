-- ============================================
-- Migration: Add 'tutorial' to content_type enum
-- ============================================

-- Add 'tutorial' to existing content_type enum
-- PostgreSQL requires ALTER TYPE to add values to existing enums
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'tutorial';

-- Verify the enum values
DO $$
BEGIN
    RAISE NOTICE '✅ Added "tutorial" to content_type enum';
END $$;
