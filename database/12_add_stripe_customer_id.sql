-- ============================================
-- Migration: Add stripe_customer_id to profiles
-- Version: 12
-- Description: Add stripe_customer_id column to profiles table
--              for linking users to their Stripe customers
-- ============================================

-- Add stripe_customer_id column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
ON profiles(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID for payment processing';
