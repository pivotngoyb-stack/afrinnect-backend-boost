
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM public.user_profiles WHERE user_id = auth.uid() LIMIT 1 $$;

-- admin_audit_logs
DROP POLICY IF EXISTS "Authenticated can create audit logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Admins can create audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can create audit logs" ON public.admin_audit_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ambassador_referral_events
DROP POLICY IF EXISTS "Authenticated can insert events" ON public.ambassador_referral_events;
DROP POLICY IF EXISTS "Ambassadors can insert own events" ON public.ambassador_referral_events;
CREATE POLICY "Ambassadors can insert own events" ON public.ambassador_referral_events FOR INSERT TO authenticated WITH CHECK (ambassador_id IN (SELECT id FROM public.ambassadors WHERE user_id = auth.uid()));

-- ambassador_referrals
DROP POLICY IF EXISTS "Authenticated can insert referrals" ON public.ambassador_referrals;
DROP POLICY IF EXISTS "Ambassadors can insert own referrals" ON public.ambassador_referrals;
CREATE POLICY "Ambassadors can insert own referrals" ON public.ambassador_referrals FOR INSERT TO authenticated WITH CHECK (ambassador_id IN (SELECT id FROM public.ambassadors WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated can update referrals" ON public.ambassador_referrals;
DROP POLICY IF EXISTS "Ambassadors can update own referrals" ON public.ambassador_referrals;
CREATE POLICY "Ambassadors can update own referrals" ON public.ambassador_referrals FOR UPDATE TO authenticated USING (ambassador_id IN (SELECT id FROM public.ambassadors WHERE user_id = auth.uid()));

-- ambassadors
DROP POLICY IF EXISTS "Authenticated can update ambassadors" ON public.ambassadors;
DROP POLICY IF EXISTS "Users can update own ambassador record" ON public.ambassadors;
CREATE POLICY "Users can update own ambassador record" ON public.ambassadors FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- background_checks
DROP POLICY IF EXISTS "Authenticated can update checks" ON public.background_checks;
DROP POLICY IF EXISTS "Users can update own background checks" ON public.background_checks;
CREATE POLICY "Users can update own background checks" ON public.background_checks FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- communities
DROP POLICY IF EXISTS "Auth can create communities" ON public.communities;
DROP POLICY IF EXISTS "Authenticated can create communities" ON public.communities;
CREATE POLICY "Authenticated can create communities" ON public.communities FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth can update communities" ON public.communities;
DROP POLICY IF EXISTS "Creator can update communities" ON public.communities;
CREATE POLICY "Creator can update communities" ON public.communities FOR UPDATE TO authenticated USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- compatibility_quizzes
DROP POLICY IF EXISTS "Auth can insert quizzes" ON public.compatibility_quizzes;
DROP POLICY IF EXISTS "Admins can insert quizzes" ON public.compatibility_quizzes;
CREATE POLICY "Admins can insert quizzes" ON public.compatibility_quizzes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- contest_periods
DROP POLICY IF EXISTS "Authenticated can insert periods" ON public.contest_periods;
DROP POLICY IF EXISTS "Admins can insert contest periods" ON public.contest_periods;
CREATE POLICY "Admins can insert contest periods" ON public.contest_periods FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- daily_matches
DROP POLICY IF EXISTS "Users can insert daily matches" ON public.daily_matches;
DROP POLICY IF EXISTS "Users can insert own daily matches" ON public.daily_matches;
CREATE POLICY "Users can insert own daily matches" ON public.daily_matches FOR INSERT TO authenticated WITH CHECK (user_profile_id = public.get_my_profile_id());

DROP POLICY IF EXISTS "Auth update daily_matches" ON public.daily_matches;
DROP POLICY IF EXISTS "Users can update daily matches" ON public.daily_matches;
DROP POLICY IF EXISTS "Users can update own daily matches" ON public.daily_matches;
CREATE POLICY "Users can update own daily matches" ON public.daily_matches FOR UPDATE TO authenticated USING (user_profile_id = public.get_my_profile_id());

-- date_feedbacks
DROP POLICY IF EXISTS "Users can create date feedback" ON public.date_feedbacks;
DROP POLICY IF EXISTS "Users can create own date feedback" ON public.date_feedbacks;
CREATE POLICY "Users can create own date feedback" ON public.date_feedbacks FOR INSERT TO authenticated WITH CHECK (user_profile_id = public.get_my_profile_id());

-- error_logs
DROP POLICY IF EXISTS "Anyone can insert errors" ON public.error_logs;
DROP POLICY IF EXISTS "Authenticated can insert errors" ON public.error_logs;
CREATE POLICY "Authenticated can insert errors" ON public.error_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- events
DROP POLICY IF EXISTS "Authenticated can create events" ON public.events;
CREATE POLICY "Authenticated can create events" ON public.events FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- ice_breakers
DROP POLICY IF EXISTS "Auth can insert ice breakers" ON public.ice_breakers;
DROP POLICY IF EXISTS "Admins can insert ice breakers" ON public.ice_breakers;
CREATE POLICY "Admins can insert ice breakers" ON public.ice_breakers FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- in_app_purchases
DROP POLICY IF EXISTS "Authenticated can insert purchases" ON public.in_app_purchases;
DROP POLICY IF EXISTS "Users can insert own purchases" ON public.in_app_purchases;
CREATE POLICY "Users can insert own purchases" ON public.in_app_purchases FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- match_feedbacks
DROP POLICY IF EXISTS "Users can create feedback" ON public.match_feedbacks;
DROP POLICY IF EXISTS "Users can create own feedback" ON public.match_feedbacks;
CREATE POLICY "Users can create own feedback" ON public.match_feedbacks FOR INSERT TO authenticated WITH CHECK (user_profile_id = public.get_my_profile_id());

-- moderation_actions
DROP POLICY IF EXISTS "Authenticated can insert actions" ON public.moderation_actions;
DROP POLICY IF EXISTS "Admins can insert moderation actions" ON public.moderation_actions;
CREATE POLICY "Admins can insert moderation actions" ON public.moderation_actions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- photo_moderations
DROP POLICY IF EXISTS "Authenticated can insert photo mods" ON public.photo_moderations;
DROP POLICY IF EXISTS "Admins can insert photo moderations" ON public.photo_moderations;
CREATE POLICY "Admins can insert photo moderations" ON public.photo_moderations FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can update photo mods" ON public.photo_moderations;
DROP POLICY IF EXISTS "Admins can update photo moderations" ON public.photo_moderations;
CREATE POLICY "Admins can update photo moderations" ON public.photo_moderations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- profile_analytics
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.profile_analytics;
DROP POLICY IF EXISTS "Authenticated can insert analytics" ON public.profile_analytics;
CREATE POLICY "Authenticated can insert analytics" ON public.profile_analytics FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- receipts
DROP POLICY IF EXISTS "Authenticated can insert receipts" ON public.receipts;
DROP POLICY IF EXISTS "Users can insert own receipts" ON public.receipts;
CREATE POLICY "Users can insert own receipts" ON public.receipts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- scam_analyses
DROP POLICY IF EXISTS "Authenticated can insert scam analyses" ON public.scam_analyses;
DROP POLICY IF EXISTS "Admins can insert scam analyses" ON public.scam_analyses;
CREATE POLICY "Admins can insert scam analyses" ON public.scam_analyses FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can update scam analyses" ON public.scam_analyses;
DROP POLICY IF EXISTS "Admins can update scam analyses" ON public.scam_analyses;
CREATE POLICY "Admins can update scam analyses" ON public.scam_analyses FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- screenshot_alerts
DROP POLICY IF EXISTS "Authenticated can insert alerts" ON public.screenshot_alerts;
DROP POLICY IF EXISTS "Users can insert own alerts" ON public.screenshot_alerts;
CREATE POLICY "Users can insert own alerts" ON public.screenshot_alerts FOR INSERT TO authenticated WITH CHECK (user_profile_id = public.get_my_profile_id());

-- speed_dating_sessions
DROP POLICY IF EXISTS "Authenticated can create sessions" ON public.speed_dating_sessions;
DROP POLICY IF EXISTS "Admins can create speed dating sessions" ON public.speed_dating_sessions;
CREATE POLICY "Admins can create speed dating sessions" ON public.speed_dating_sessions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- success_stories
DROP POLICY IF EXISTS "Authenticated can create stories" ON public.success_stories;
DROP POLICY IF EXISTS "Users can create own stories" ON public.success_stories;
CREATE POLICY "Users can create own stories" ON public.success_stories FOR INSERT TO authenticated WITH CHECK (user_profile_id = public.get_my_profile_id());

-- vendors
DROP POLICY IF EXISTS "Auth can manage vendors" ON public.vendors;
DROP POLICY IF EXISTS "Admins can insert vendors" ON public.vendors;
CREATE POLICY "Admins can insert vendors" ON public.vendors FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Auth can update vendors" ON public.vendors;
DROP POLICY IF EXISTS "Admins can update vendors" ON public.vendors;
CREATE POLICY "Admins can update vendors" ON public.vendors FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- vip_events
DROP POLICY IF EXISTS "Authenticated can create vip events" ON public.vip_events;
DROP POLICY IF EXISTS "Admins can create vip events" ON public.vip_events;
CREATE POLICY "Admins can create vip events" ON public.vip_events FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can update vip events" ON public.vip_events;
DROP POLICY IF EXISTS "Admins can update vip events" ON public.vip_events;
CREATE POLICY "Admins can update vip events" ON public.vip_events FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can delete vip events" ON public.vip_events;
DROP POLICY IF EXISTS "Admins can delete vip events" ON public.vip_events;
CREATE POLICY "Admins can delete vip events" ON public.vip_events FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- waitlist_entries (keep open for public)
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist_entries;
CREATE POLICY "Anyone can join waitlist" ON public.waitlist_entries FOR INSERT TO anon, authenticated WITH CHECK (true);

-- wedding_vendors
DROP POLICY IF EXISTS "Auth can manage wedding vendors" ON public.wedding_vendors;
DROP POLICY IF EXISTS "Admins can manage wedding vendors" ON public.wedding_vendors;
CREATE POLICY "Admins can manage wedding vendors" ON public.wedding_vendors FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
