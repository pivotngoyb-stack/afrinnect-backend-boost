
-- Add heat_score to user_profiles for discovery ranking
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS heat_score float DEFAULT 0;

-- Add opening_move to user_profiles for match conversation starters
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS opening_move text DEFAULT null;

-- Add index for heat_score ordering in discovery
CREATE INDEX IF NOT EXISTS idx_user_profiles_heat_score ON public.user_profiles (heat_score DESC);

-- Add swipe_right_rate and response_rate to user_ml_profiles for ELO calculation
ALTER TABLE public.user_ml_profiles ADD COLUMN IF NOT EXISTS swipe_right_rate float DEFAULT 0;
ALTER TABLE public.user_ml_profiles ADD COLUMN IF NOT EXISTS response_rate float DEFAULT 0;
ALTER TABLE public.user_ml_profiles ADD COLUMN IF NOT EXISTS heat_score float DEFAULT 0;
ALTER TABLE public.user_ml_profiles ADD COLUMN IF NOT EXISTS profile_completeness float DEFAULT 0;
