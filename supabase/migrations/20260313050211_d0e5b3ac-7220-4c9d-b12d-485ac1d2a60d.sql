ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS video_profile_url TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS voice_intro_url TEXT;