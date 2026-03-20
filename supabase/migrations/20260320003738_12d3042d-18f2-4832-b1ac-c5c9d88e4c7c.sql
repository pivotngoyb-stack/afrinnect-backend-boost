
-- Daily matches
CREATE TABLE public.daily_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL,
  suggested_profile_id uuid NOT NULL,
  match_score integer DEFAULT 0,
  match_reasons text[] DEFAULT '{}',
  date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'pending',
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.daily_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own daily matches" ON public.daily_matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert daily matches" ON public.daily_matches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update daily matches" ON public.daily_matches FOR UPDATE TO authenticated USING (true);

-- Profile views
CREATE TABLE public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_profile_id uuid NOT NULL,
  viewed_profile_id uuid NOT NULL,
  viewer_user_id uuid NOT NULL,
  viewed_user_id uuid,
  view_duration integer DEFAULT 0,
  source text DEFAULT 'discovery',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own views" ON public.profile_views FOR SELECT TO authenticated USING (viewer_user_id = auth.uid() OR viewed_user_id = auth.uid());
CREATE POLICY "Users can insert views" ON public.profile_views FOR INSERT TO authenticated WITH CHECK (viewer_user_id = auth.uid());

-- Date plans
CREATE TABLE public.date_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid,
  proposer_profile_id uuid,
  date_type text DEFAULT 'in_person',
  location jsonb DEFAULT '{}',
  proposed_time timestamptz,
  status text DEFAULT 'proposed',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.date_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage date plans" ON public.date_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Communities
CREATE TABLE public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  category text DEFAULT 'general',
  member_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read communities" ON public.communities FOR SELECT USING (true);
CREATE POLICY "Auth can create communities" ON public.communities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update communities" ON public.communities FOR UPDATE TO authenticated USING (true);

-- Compatibility quizzes
CREATE TABLE public.compatibility_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  questions jsonb DEFAULT '[]',
  compatibility_types jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.compatibility_quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read quizzes" ON public.compatibility_quizzes FOR SELECT USING (true);
CREATE POLICY "Auth can insert quizzes" ON public.compatibility_quizzes FOR INSERT TO authenticated WITH CHECK (true);

-- Quiz results
CREATE TABLE public.quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL,
  quiz_id uuid,
  answers jsonb DEFAULT '[]',
  result_type text,
  score integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own results" ON public.quiz_results FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Story comments
CREATE TABLE public.story_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL,
  user_profile_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can manage story comments" ON public.story_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Referrals
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL,
  referred_email text,
  referred_user_id uuid,
  status text DEFAULT 'pending',
  reward_given boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own referrals" ON public.referrals FOR ALL TO authenticated USING (referrer_user_id = auth.uid()) WITH CHECK (referrer_user_id = auth.uid());

-- Virtual gifts
CREATE TABLE public.virtual_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_profile_id uuid NOT NULL,
  receiver_profile_id uuid NOT NULL,
  sender_user_id uuid NOT NULL,
  gift_type text NOT NULL,
  gift_name text,
  message text,
  cost integer DEFAULT 0,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.virtual_gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own gifts" ON public.virtual_gifts FOR SELECT TO authenticated USING (sender_user_id = auth.uid() OR receiver_profile_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can send gifts" ON public.virtual_gifts FOR INSERT TO authenticated WITH CHECK (sender_user_id = auth.uid());

-- Waitlist entries
CREATE TABLE public.waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  referral_code text,
  status text DEFAULT 'waiting',
  position integer,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can join waitlist" ON public.waitlist_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth can read waitlist" ON public.waitlist_entries FOR SELECT TO authenticated USING (true);

-- Phone verifications
CREATE TABLE public.phone_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone_number text NOT NULL,
  status text DEFAULT 'pending',
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own phone verifications" ON public.phone_verifications FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Message translations
CREATE TABLE public.message_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  source_language text,
  target_language text,
  translated_content text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.message_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can manage translations" ON public.message_translations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Profile suggestions
CREATE TABLE public.profile_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL,
  suggested_profile_id uuid NOT NULL,
  score integer DEFAULT 0,
  reasons text[] DEFAULT '{}',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.profile_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can manage suggestions" ON public.profile_suggestions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Photo engagements
CREATE TABLE public.photo_engagements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_url text NOT NULL,
  user_profile_id uuid NOT NULL,
  viewer_profile_id uuid,
  engagement_type text DEFAULT 'view',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.photo_engagements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can manage photo engagements" ON public.photo_engagements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Chat games
CREATE TABLE public.chat_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid,
  game_type text NOT NULL,
  status text DEFAULT 'active',
  game_data jsonb DEFAULT '{}',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.chat_games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can manage chat games" ON public.chat_games FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ice breakers
CREATE TABLE public.ice_breakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  category text DEFAULT 'general',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ice_breakers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read ice breakers" ON public.ice_breakers FOR SELECT USING (true);
CREATE POLICY "Auth can insert ice breakers" ON public.ice_breakers FOR INSERT TO authenticated WITH CHECK (true);

-- Live locations
CREATE TABLE public.live_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL,
  match_id uuid,
  latitude numeric,
  longitude numeric,
  is_sharing boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.live_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can manage live locations" ON public.live_locations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Video calls
CREATE TABLE public.video_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid,
  caller_profile_id uuid NOT NULL,
  receiver_profile_id uuid NOT NULL,
  status text DEFAULT 'ringing',
  started_at timestamptz,
  ended_at timestamptz,
  duration integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.video_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can manage video calls" ON public.video_calls FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Vendors / Wedding vendors
CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  description text,
  location text,
  contact_info jsonb DEFAULT '{}',
  rating numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read vendors" ON public.vendors FOR SELECT USING (true);
CREATE POLICY "Auth can manage vendors" ON public.vendors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update vendors" ON public.vendors FOR UPDATE TO authenticated USING (true);

CREATE TABLE public.wedding_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES public.vendors(id),
  service_type text,
  price_range text,
  portfolio_urls text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.wedding_vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read wedding vendors" ON public.wedding_vendors FOR SELECT USING (true);
CREATE POLICY "Auth can manage wedding vendors" ON public.wedding_vendors FOR INSERT TO authenticated WITH CHECK (true);

-- Language exchanges
CREATE TABLE public.language_exchanges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL,
  native_language text,
  learning_language text,
  proficiency_level text DEFAULT 'beginner',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.language_exchanges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can manage language exchanges" ON public.language_exchanges FOR ALL TO authenticated USING (true) WITH CHECK (true);
