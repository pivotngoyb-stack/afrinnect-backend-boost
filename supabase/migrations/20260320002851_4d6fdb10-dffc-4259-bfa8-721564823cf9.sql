
-- Legal acceptances table
CREATE TABLE public.legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  terms_version text NOT NULL DEFAULT '1.0',
  privacy_version text NOT NULL DEFAULT '1.0',
  guidelines_version text NOT NULL DEFAULT '1.0',
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own acceptances" ON public.legal_acceptances FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own acceptances" ON public.legal_acceptances FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Deleted accounts table
CREATE TABLE public.deleted_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  reason text,
  deleted_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE public.deleted_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only for deleted_accounts" ON public.deleted_accounts FOR ALL TO authenticated USING (false);

-- User ML profiles table for matching engine
CREATE TABLE public.user_ml_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  user_profile_id uuid,
  preferences jsonb DEFAULT '{}'::jsonb,
  interaction_history jsonb DEFAULT '[]'::jsonb,
  compatibility_weights jsonb DEFAULT '{}'::jsonb,
  last_calculated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_ml_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own ml profile" ON public.user_ml_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own ml profile" ON public.user_ml_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ml profile" ON public.user_ml_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
