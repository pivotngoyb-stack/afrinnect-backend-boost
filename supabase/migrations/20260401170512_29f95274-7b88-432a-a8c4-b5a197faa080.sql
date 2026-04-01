
-- Daily rewards tracking (server-side streak rewards)
CREATE TABLE public.daily_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reward_day INTEGER NOT NULL CHECK (reward_day BETWEEN 1 AND 7),
  reward_type TEXT NOT NULL,
  reward_value INTEGER NOT NULL DEFAULT 1,
  streak_count INTEGER NOT NULL DEFAULT 1,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  claim_date TEXT NOT NULL,
  UNIQUE(user_profile_id, claim_date)
);

ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rewards"
  ON public.daily_rewards FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own rewards"
  ON public.daily_rewards FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Promo codes (server-validated discounts)
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  max_redemptions INTEGER DEFAULT NULL,
  current_redemptions INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  target_tier TEXT DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active promo codes"
  ON public.promo_codes FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Promo code redemptions
CREATE TABLE public.promo_code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id),
  user_profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(promo_code_id, user_profile_id)
);

ALTER TABLE public.promo_code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions"
  ON public.promo_code_redemptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can redeem codes"
  ON public.promo_code_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Add trial columns to subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_start TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_trial BOOLEAN NOT NULL DEFAULT false;

-- Add onboarding_actions to user_profiles for ProgressToTrial tracking
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS onboarding_actions TEXT[] NOT NULL DEFAULT '{}';

-- Enable realtime on profile_views for LiveViewerNotification
ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_views;
