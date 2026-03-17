
-- ========================================
-- BATCH 2: Monetization, Ambassadors, Events, & Remaining
-- ========================================

-- Tier Configurations
CREATE TABLE public.tier_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  price_monthly numeric,
  price_quarterly numeric,
  price_yearly numeric,
  features jsonb DEFAULT '[]'::jsonb,
  limits jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.tier_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tiers" ON public.tier_configurations FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert tiers" ON public.tier_configurations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update tiers" ON public.tier_configurations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete tiers" ON public.tier_configurations FOR DELETE TO authenticated USING (true);

-- Pricing Plans
CREATE TABLE public.pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tier text NOT NULL,
  duration_months integer DEFAULT 1,
  price numeric NOT NULL,
  currency text DEFAULT 'USD',
  discount_percent numeric DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  stripe_price_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read plans" ON public.pricing_plans FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert plans" ON public.pricing_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update plans" ON public.pricing_plans FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete plans" ON public.pricing_plans FOR DELETE TO authenticated USING (true);

-- Receipts
CREATE TABLE public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL,
  user_id uuid NOT NULL,
  subscription_id uuid,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  payment_provider text,
  transaction_id text,
  status text DEFAULT 'completed',
  receipt_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own receipts" ON public.receipts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can insert receipts" ON public.receipts FOR INSERT TO authenticated WITH CHECK (true);

-- Promotions
CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  discount_type text DEFAULT 'percentage',
  discount_value numeric NOT NULL,
  valid_from timestamptz,
  valid_until timestamptz,
  max_redemptions integer,
  current_redemptions integer DEFAULT 0,
  target_tier text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read promotions" ON public.promotions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert promotions" ON public.promotions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update promotions" ON public.promotions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete promotions" ON public.promotions FOR DELETE TO authenticated USING (true);

-- In App Purchases
CREATE TABLE public.in_app_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL,
  user_id uuid NOT NULL,
  product_id text NOT NULL,
  product_type text,
  amount numeric,
  currency text DEFAULT 'USD',
  platform text,
  transaction_id text,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.in_app_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own purchases" ON public.in_app_purchases FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can insert purchases" ON public.in_app_purchases FOR INSERT TO authenticated WITH CHECK (true);

-- Founder Invite Codes
CREATE TABLE public.founder_invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  created_by uuid,
  max_redemptions integer DEFAULT 10,
  current_redemptions integer DEFAULT 0,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  created_date date DEFAULT CURRENT_DATE
);
ALTER TABLE public.founder_invite_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read codes" ON public.founder_invite_codes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert codes" ON public.founder_invite_codes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update codes" ON public.founder_invite_codes FOR UPDATE TO authenticated USING (true);

-- Founder Code Redemptions
CREATE TABLE public.founder_code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid REFERENCES public.founder_invite_codes(id),
  user_profile_id uuid NOT NULL,
  user_id uuid NOT NULL,
  code_used text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.founder_code_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read redemptions" ON public.founder_code_redemptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create redemptions" ON public.founder_code_redemptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Profile Boosts
CREATE TABLE public.profile_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL,
  user_id uuid NOT NULL,
  boost_type text DEFAULT 'standard',
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.profile_boosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own boosts" ON public.profile_boosts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create boosts" ON public.profile_boosts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own boosts" ON public.profile_boosts FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Events
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type text DEFAULT 'social',
  location jsonb DEFAULT '{}'::jsonb,
  virtual_link text,
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  max_attendees integer,
  current_attendees integer DEFAULT 0,
  host_profile_id uuid,
  image_url text,
  is_active boolean DEFAULT true,
  status text DEFAULT 'upcoming',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Authenticated can create events" ON public.events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update events" ON public.events FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete events" ON public.events FOR DELETE TO authenticated USING (true);

-- VIP Events
CREATE TABLE public.vip_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type text DEFAULT 'exclusive',
  location jsonb DEFAULT '{}'::jsonb,
  virtual_link text,
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  max_attendees integer,
  current_attendees integer DEFAULT 0,
  min_tier text DEFAULT 'premium',
  price numeric,
  image_url text,
  host_name text,
  is_active boolean DEFAULT true,
  status text DEFAULT 'upcoming',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.vip_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read vip events" ON public.vip_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create vip events" ON public.vip_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update vip events" ON public.vip_events FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete vip events" ON public.vip_events FOR DELETE TO authenticated USING (true);

-- VIP Event Registrations
CREATE TABLE public.vip_event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vip_event_id uuid REFERENCES public.vip_events(id) ON DELETE CASCADE,
  user_profile_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text DEFAULT 'registered',
  payment_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.vip_event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own registrations" ON public.vip_event_registrations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can register" ON public.vip_event_registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own registration" ON public.vip_event_registrations FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Ambassadors
CREATE TABLE public.ambassadors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text DEFAULT 'pending',
  tier text DEFAULT 'bronze',
  referral_code text UNIQUE,
  total_referrals integer DEFAULT 0,
  total_earnings numeric DEFAULT 0,
  bio text,
  social_links jsonb DEFAULT '{}'::jsonb,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.ambassadors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read ambassadors" ON public.ambassadors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create ambassador app" ON public.ambassadors FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated can update ambassadors" ON public.ambassadors FOR UPDATE TO authenticated USING (true);

-- Ambassador Referrals
CREATE TABLE public.ambassador_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id uuid REFERENCES public.ambassadors(id),
  referred_user_id uuid,
  referred_profile_id uuid,
  status text DEFAULT 'pending',
  converted boolean DEFAULT false,
  conversion_date timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ambassador_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read referrals" ON public.ambassador_referrals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert referrals" ON public.ambassador_referrals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update referrals" ON public.ambassador_referrals FOR UPDATE TO authenticated USING (true);

-- Ambassador Commissions
CREATE TABLE public.ambassador_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id uuid REFERENCES public.ambassadors(id),
  referral_id uuid REFERENCES public.ambassador_referrals(id),
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  status text DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ambassador_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read commissions" ON public.ambassador_commissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert commissions" ON public.ambassador_commissions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update commissions" ON public.ambassador_commissions FOR UPDATE TO authenticated USING (true);

-- Ambassador Payouts
CREATE TABLE public.ambassador_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id uuid REFERENCES public.ambassadors(id),
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  payment_method text,
  status text DEFAULT 'pending',
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ambassador_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read payouts" ON public.ambassador_payouts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert payouts" ON public.ambassador_payouts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update payouts" ON public.ambassador_payouts FOR UPDATE TO authenticated USING (true);

-- Ambassador Commission Plans
CREATE TABLE public.ambassador_commission_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  commission_type text DEFAULT 'percentage',
  commission_value numeric NOT NULL,
  tier text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.ambassador_commission_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read plans" ON public.ambassador_commission_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert plans" ON public.ambassador_commission_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update plans" ON public.ambassador_commission_plans FOR UPDATE TO authenticated USING (true);

-- Ambassador Referral Events
CREATE TABLE public.ambassador_referral_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id uuid REFERENCES public.ambassadors(id),
  referral_id uuid,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ambassador_referral_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read events" ON public.ambassador_referral_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert events" ON public.ambassador_referral_events FOR INSERT TO authenticated WITH CHECK (true);

-- Ambassador Campaigns
CREATE TABLE public.ambassador_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  start_date timestamptz,
  end_date timestamptz,
  bonus_multiplier numeric DEFAULT 1,
  target_signups integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.ambassador_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read campaigns" ON public.ambassador_campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert campaigns" ON public.ambassador_campaigns FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update campaigns" ON public.ambassador_campaigns FOR UPDATE TO authenticated USING (true);

-- Ambassador Content Assets
CREATE TABLE public.ambassador_content_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  asset_type text,
  file_url text,
  thumbnail_url text,
  campaign_id uuid REFERENCES public.ambassador_campaigns(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ambassador_content_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read assets" ON public.ambassador_content_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert assets" ON public.ambassador_content_assets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update assets" ON public.ambassador_content_assets FOR UPDATE TO authenticated USING (true);

-- Success Stories
CREATE TABLE public.success_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid,
  partner_profile_id uuid,
  title text NOT NULL,
  story text NOT NULL,
  photos text[] DEFAULT '{}'::text[],
  video_url text,
  status text DEFAULT 'pending',
  is_featured boolean DEFAULT false,
  likes_count integer DEFAULT 0,
  reviewed_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read approved stories" ON public.success_stories FOR SELECT USING (true);
CREATE POLICY "Authenticated can create stories" ON public.success_stories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update stories" ON public.success_stories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete stories" ON public.success_stories FOR DELETE TO authenticated USING (true);

-- Success Story Contests
CREATE TABLE public.success_story_contests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  start_date timestamptz,
  end_date timestamptz,
  prize_description text,
  status text DEFAULT 'upcoming',
  winner_story_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.success_story_contests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read contests" ON public.success_story_contests FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert contests" ON public.success_story_contests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update contests" ON public.success_story_contests FOR UPDATE TO authenticated USING (true);

-- Contest Periods
CREATE TABLE public.contest_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid REFERENCES public.success_story_contests(id),
  period_name text,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.contest_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read periods" ON public.contest_periods FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert periods" ON public.contest_periods FOR INSERT TO authenticated WITH CHECK (true);

-- Speed Dating Sessions
CREATE TABLE public.speed_dating_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  max_participants integer DEFAULT 20,
  current_participants integer DEFAULT 0,
  status text DEFAULT 'upcoming',
  virtual_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.speed_dating_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read sessions" ON public.speed_dating_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create sessions" ON public.speed_dating_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update sessions" ON public.speed_dating_sessions FOR UPDATE TO authenticated USING (true);
