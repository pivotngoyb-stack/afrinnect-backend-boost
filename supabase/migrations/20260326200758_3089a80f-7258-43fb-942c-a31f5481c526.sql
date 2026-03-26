ALTER TABLE public.community_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;

-- Add profile_prompts column to user_profiles for Hinge-style prompts
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS profile_prompts jsonb DEFAULT '{}'::jsonb;