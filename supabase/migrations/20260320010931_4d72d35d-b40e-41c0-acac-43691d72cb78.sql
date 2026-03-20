
-- Add trial_days column to founder_invite_codes
ALTER TABLE public.founder_invite_codes ADD COLUMN IF NOT EXISTS trial_days integer DEFAULT 183;

-- Change updated_by in system_settings from UUID to TEXT to support email strings
ALTER TABLE public.system_settings ALTER COLUMN updated_by TYPE text USING updated_by::text;
