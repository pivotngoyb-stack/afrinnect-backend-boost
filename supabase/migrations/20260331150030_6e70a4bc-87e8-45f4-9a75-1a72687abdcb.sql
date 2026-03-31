-- Recreate granular RLS policies for all 10 tables + waitlist fix

-- chat_games
CREATE POLICY "Auth can read chat games" ON public.chat_games FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert chat games" ON public.chat_games FOR INSERT TO authenticated WITH CHECK (created_by = public.get_my_profile_id());
CREATE POLICY "Auth can update own chat games" ON public.chat_games FOR UPDATE TO authenticated USING (created_by = public.get_my_profile_id());
CREATE POLICY "Auth can delete own chat games" ON public.chat_games FOR DELETE TO authenticated USING (created_by = public.get_my_profile_id());

-- date_plans
CREATE POLICY "Auth can read date plans" ON public.date_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert date plans" ON public.date_plans FOR INSERT TO authenticated WITH CHECK (proposer_profile_id = public.get_my_profile_id());
CREATE POLICY "Auth can update own date plans" ON public.date_plans FOR UPDATE TO authenticated USING (proposer_profile_id = public.get_my_profile_id());
CREATE POLICY "Auth can delete own date plans" ON public.date_plans FOR DELETE TO authenticated USING (proposer_profile_id = public.get_my_profile_id());

-- language_exchanges
CREATE POLICY "Auth can read language exchanges" ON public.language_exchanges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert language exchanges" ON public.language_exchanges FOR INSERT TO authenticated WITH CHECK (user_profile_id = public.get_my_profile_id());
CREATE POLICY "Auth can update own language exchanges" ON public.language_exchanges FOR UPDATE TO authenticated USING (user_profile_id = public.get_my_profile_id());
CREATE POLICY "Auth can delete own language exchanges" ON public.language_exchanges FOR DELETE TO authenticated USING (user_profile_id = public.get_my_profile_id());

-- live_locations
CREATE POLICY "Auth can read live locations" ON public.live_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert live locations" ON public.live_locations FOR INSERT TO authenticated WITH CHECK (user_profile_id = public.get_my_profile_id());
CREATE POLICY "Auth can update own live locations" ON public.live_locations FOR UPDATE TO authenticated USING (user_profile_id = public.get_my_profile_id());
CREATE POLICY "Auth can delete own live locations" ON public.live_locations FOR DELETE TO authenticated USING (user_profile_id = public.get_my_profile_id());

-- message_translations (no owner column — restrict to insert-only)
CREATE POLICY "Auth can read translations" ON public.message_translations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert translations" ON public.message_translations FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- photo_engagements (viewer creates engagement)
CREATE POLICY "Auth can read photo engagements" ON public.photo_engagements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert photo engagements" ON public.photo_engagements FOR INSERT TO authenticated WITH CHECK (viewer_profile_id = public.get_my_profile_id());

-- profile_suggestions (system-generated, user can only read/update own)
CREATE POLICY "Auth can read own suggestions" ON public.profile_suggestions FOR SELECT TO authenticated USING (user_profile_id = public.get_my_profile_id());
CREATE POLICY "Auth can update own suggestions" ON public.profile_suggestions FOR UPDATE TO authenticated USING (user_profile_id = public.get_my_profile_id());
CREATE POLICY "Admin can insert suggestions" ON public.profile_suggestions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- quiz_results
CREATE POLICY "Auth can read quiz results" ON public.quiz_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert quiz results" ON public.quiz_results FOR INSERT TO authenticated WITH CHECK (user_profile_id = public.get_my_profile_id());
CREATE POLICY "Auth can update own quiz results" ON public.quiz_results FOR UPDATE TO authenticated USING (user_profile_id = public.get_my_profile_id());

-- story_comments
CREATE POLICY "Auth can read story comments" ON public.story_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert story comments" ON public.story_comments FOR INSERT TO authenticated WITH CHECK (user_profile_id = public.get_my_profile_id());
CREATE POLICY "Auth can update own story comments" ON public.story_comments FOR UPDATE TO authenticated USING (user_profile_id = public.get_my_profile_id());
CREATE POLICY "Auth can delete own story comments" ON public.story_comments FOR DELETE TO authenticated USING (user_profile_id = public.get_my_profile_id());

-- video_calls (caller or receiver can see/update)
CREATE POLICY "Auth can read own video calls" ON public.video_calls FOR SELECT TO authenticated USING (caller_profile_id = public.get_my_profile_id() OR receiver_profile_id = public.get_my_profile_id());
CREATE POLICY "Auth can insert video calls" ON public.video_calls FOR INSERT TO authenticated WITH CHECK (caller_profile_id = public.get_my_profile_id());
CREATE POLICY "Auth can update own video calls" ON public.video_calls FOR UPDATE TO authenticated USING (caller_profile_id = public.get_my_profile_id() OR receiver_profile_id = public.get_my_profile_id());

-- waitlist_entries: add public insert policy back
CREATE POLICY "Anyone can insert waitlist" ON public.waitlist_entries FOR INSERT WITH CHECK (true);