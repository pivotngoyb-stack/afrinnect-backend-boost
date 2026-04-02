-- Add is_priority column to messages for VIP Priority DMs
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_priority boolean DEFAULT false;

-- Add incognito_mode column if missing
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS incognito_mode boolean DEFAULT false;