
-- Add seed personality and interaction tracking columns
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS seed_personality text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS seed_interaction_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seed_last_action_at timestamptz DEFAULT NULL;

-- Create seed interaction log to track and limit seed behavior
CREATE TABLE IF NOT EXISTS public.seed_interaction_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_profile_id uuid NOT NULL,
  target_profile_id uuid NOT NULL,
  interaction_type text NOT NULL, -- 'like', 'match', 'message'
  delay_minutes integer DEFAULT 0,
  personality text,
  message_content text,
  created_at timestamptz DEFAULT now(),
  executed_at timestamptz DEFAULT NULL,
  status text DEFAULT 'pending' -- 'pending', 'executed', 'skipped'
);

ALTER TABLE public.seed_interaction_log ENABLE ROW LEVEL SECURITY;

-- Allow service role full access, users can read their own interactions
CREATE POLICY "Users can read seed interactions targeting them"
  ON public.seed_interaction_log FOR SELECT
  TO authenticated
  USING (target_profile_id IN (
    SELECT id FROM public.user_profiles WHERE user_id = auth.uid()
  ));
