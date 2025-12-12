-- ============================================
-- Migration: Add avatar_url column to profiles
-- Version: 4
-- ============================================

-- Add avatar_url column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.avatar_url IS 'URL to user avatar image stored in Supabase Storage';
