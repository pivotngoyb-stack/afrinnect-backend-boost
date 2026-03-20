CREATE TABLE IF NOT EXISTS public.content_moderations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_profile_id uuid,
  content_type text DEFAULT 'photo',
  content_url text,
  text_content text,
  ai_result jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending',
  confidence integer DEFAULT 0,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.content_moderations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own moderations" ON public.content_moderations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all moderations" ON public.content_moderations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update moderations" ON public.content_moderations
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));