-- Add email notification preferences and tracking to profiles
-- Migration: 5_add_email_preferences.sql

-- Add email preference columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_digest_enabled BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS new_aides_notification_enabled BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_procedure_reminder TIMESTAMPTZ;

-- Add deadline column to user_procedures
ALTER TABLE user_procedures ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;

-- Create index for efficient reminder queries
CREATE INDEX IF NOT EXISTS idx_user_procedures_status_deadline 
  ON user_procedures (status, deadline) 
  WHERE status = 'in_progress';

-- Create index for email preferences
CREATE INDEX IF NOT EXISTS idx_profiles_weekly_digest 
  ON profiles (weekly_digest_enabled) 
  WHERE weekly_digest_enabled = true;

CREATE INDEX IF NOT EXISTS idx_profiles_aides_notification 
  ON profiles (new_aides_notification_enabled) 
  WHERE new_aides_notification_enabled = true;

-- Comment on columns
COMMENT ON COLUMN profiles.weekly_digest_enabled IS 'Whether user wants to receive weekly digest emails';
COMMENT ON COLUMN profiles.new_aides_notification_enabled IS 'Whether user wants notifications about new aides';
COMMENT ON COLUMN profiles.last_procedure_reminder IS 'Last time user received a procedure reminder email';
COMMENT ON COLUMN user_procedures.deadline IS 'Optional deadline for this procedure';
