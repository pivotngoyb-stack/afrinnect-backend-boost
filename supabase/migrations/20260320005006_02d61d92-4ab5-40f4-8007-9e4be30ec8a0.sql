-- Photo verifications table
CREATE TABLE IF NOT EXISTS public.photo_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_profile_id uuid NOT NULL,
  selfie_url text NOT NULL,
  profile_photo_url text,
  status text DEFAULT 'pending',
  verification_type text DEFAULT 'selfie_match',
  ai_result jsonb DEFAULT '{}'::jsonb,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.photo_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own photo verifications" ON public.photo_verifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own photo verifications" ON public.photo_verifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update photo verifications" ON public.photo_verifications
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ID verifications table
CREATE TABLE IF NOT EXISTS public.id_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_profile_id uuid NOT NULL,
  id_front_url text NOT NULL,
  id_back_url text,
  id_type text NOT NULL DEFAULT 'national_id',
  status text DEFAULT 'pending',
  ai_result jsonb DEFAULT '{}'::jsonb,
  reviewed_at timestamptz,
  reviewed_by uuid,
  rejection_reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.id_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own id verifications" ON public.id_verifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own id verifications" ON public.id_verifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update id verifications" ON public.id_verifications
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Add verification columns to user_profiles if missing
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_photo_verified boolean DEFAULT false;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_id_verified boolean DEFAULT false;