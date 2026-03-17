
DROP POLICY "Users can create their own stories" ON public.stories;

CREATE POLICY "Users can create their own stories"
  ON public.stories FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = stories.user_profile_id
    AND user_profiles.user_id = auth.uid()
  ));
