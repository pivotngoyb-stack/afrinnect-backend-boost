
-- date_feedbacks
DROP POLICY IF EXISTS "Authenticated can read date feedback" ON public.date_feedbacks;
CREATE POLICY "Owner can read date feedback" ON public.date_feedbacks
  FOR SELECT TO authenticated USING (
    user_profile_id = public.get_my_profile_id() OR public.has_role(auth.uid(), 'admin')
  );

-- match_feedbacks
DROP POLICY IF EXISTS "Authenticated can read feedback" ON public.match_feedbacks;
CREATE POLICY "Owner can read match feedback" ON public.match_feedbacks
  FOR SELECT TO authenticated USING (
    user_profile_id = public.get_my_profile_id() OR public.has_role(auth.uid(), 'admin')
  );

-- ambassador_commissions
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'ambassador_commissions' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.ambassador_commissions', pol.policyname); END LOOP;
END$$;
CREATE POLICY "Owner ambassador can read commissions" ON public.ambassador_commissions
  FOR SELECT TO authenticated USING (
    ambassador_id IN (SELECT id FROM public.ambassadors WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin')
  );

-- ambassador_payouts
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'ambassador_payouts' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.ambassador_payouts', pol.policyname); END LOOP;
END$$;
CREATE POLICY "Owner ambassador can read payouts" ON public.ambassador_payouts
  FOR SELECT TO authenticated USING (
    ambassador_id IN (SELECT id FROM public.ambassadors WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin')
  );

-- ambassador_referrals
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'ambassador_referrals' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.ambassador_referrals', pol.policyname); END LOOP;
END$$;
CREATE POLICY "Owner ambassador can read referrals" ON public.ambassador_referrals
  FOR SELECT TO authenticated USING (
    ambassador_id IN (SELECT id FROM public.ambassadors WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin')
  );

-- ambassador_referral_events
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'ambassador_referral_events' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.ambassador_referral_events', pol.policyname); END LOOP;
END$$;
CREATE POLICY "Owner ambassador can read referral events" ON public.ambassador_referral_events
  FOR SELECT TO authenticated USING (
    ambassador_id IN (SELECT id FROM public.ambassadors WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin')
  );

-- ambassadors
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'ambassadors' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.ambassadors', pol.policyname); END LOOP;
END$$;
CREATE POLICY "Owner or admin can read ambassadors" ON public.ambassadors
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
  );

-- live_locations
DROP POLICY IF EXISTS "Auth can read live locations" ON public.live_locations;
CREATE POLICY "Match participants can read live locations" ON public.live_locations
  FOR SELECT TO authenticated USING (
    user_profile_id = public.get_my_profile_id()
    OR match_id IN (SELECT id FROM public.matches WHERE user1_id = public.get_my_profile_id() OR user2_id = public.get_my_profile_id())
    OR public.has_role(auth.uid(), 'admin')
  );

-- screenshot_alerts
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'screenshot_alerts' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.screenshot_alerts', pol.policyname); END LOOP;
END$$;
CREATE POLICY "Owner can read screenshot alerts" ON public.screenshot_alerts
  FOR SELECT TO authenticated USING (
    user_profile_id = public.get_my_profile_id() OR public.has_role(auth.uid(), 'admin')
  );

-- verification_requests
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'verification_requests' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.verification_requests', pol.policyname); END LOOP;
END$$;
CREATE POLICY "Owner or admin can read verifications" ON public.verification_requests
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')
  );

-- founder_code_redemptions
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'founder_code_redemptions' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.founder_code_redemptions', pol.policyname); END LOOP;
END$$;
CREATE POLICY "Owner can read own redemptions" ON public.founder_code_redemptions
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
  );

-- profile_analytics - admin only
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profile_analytics' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.profile_analytics', pol.policyname); END LOOP;
END$$;
CREATE POLICY "Admin can read profile analytics" ON public.profile_analytics
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- photo_engagements
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'photo_engagements' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.photo_engagements', pol.policyname); END LOOP;
END$$;
CREATE POLICY "Owner can read photo engagements" ON public.photo_engagements
  FOR SELECT TO authenticated USING (
    user_profile_id = public.get_my_profile_id() OR public.has_role(auth.uid(), 'admin')
  );

-- date_plans
DROP POLICY IF EXISTS "Auth can read date plans" ON public.date_plans;
CREATE POLICY "Match participants can read date plans" ON public.date_plans
  FOR SELECT TO authenticated USING (
    proposer_profile_id = public.get_my_profile_id()
    OR match_id IN (SELECT id FROM public.matches WHERE user1_id = public.get_my_profile_id() OR user2_id = public.get_my_profile_id())
    OR public.has_role(auth.uid(), 'admin')
  );

-- message_translations - participants only
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'message_translations' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.message_translations', pol.policyname); END LOOP;
END$$;
CREATE POLICY "Participant can read translations" ON public.message_translations
  FOR SELECT TO authenticated USING (
    message_id IN (SELECT id FROM public.messages WHERE sender_id = public.get_my_profile_id() OR receiver_id = public.get_my_profile_id())
    OR public.has_role(auth.uid(), 'admin')
  );

-- system_settings - admin only
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'system_settings' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.system_settings', pol.policyname); END LOOP;
END$$;
CREATE POLICY "Admin can read system settings" ON public.system_settings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- waitlist_entries - admin only for reading
DROP POLICY IF EXISTS "Auth can read waitlist" ON public.waitlist_entries;
CREATE POLICY "Admin can read waitlist" ON public.waitlist_entries
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- daily_matches - owner only
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'daily_matches' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.daily_matches', pol.policyname); END LOOP;
END$$;
CREATE POLICY "Owner can read daily matches" ON public.daily_matches
  FOR SELECT TO authenticated USING (
    user_profile_id = public.get_my_profile_id() OR public.has_role(auth.uid(), 'admin')
  );

-- quiz_results - owner only
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'quiz_results' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.quiz_results', pol.policyname); END LOOP;
END$$;
CREATE POLICY "Owner can read quiz results" ON public.quiz_results
  FOR SELECT TO authenticated USING (
    user_profile_id = public.get_my_profile_id() OR public.has_role(auth.uid(), 'admin')
  );
