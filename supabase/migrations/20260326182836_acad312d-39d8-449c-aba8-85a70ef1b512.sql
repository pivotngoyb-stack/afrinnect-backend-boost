
-- Fix remaining permissive policies (using unique names to avoid conflicts)

-- COMMUNITIES
DROP POLICY IF EXISTS "Authenticated can update communities" ON public.communities;
DROP POLICY IF EXISTS "Admins can update communities" ON public.communities;
CREATE POLICY "Admin update communities" ON public.communities FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- DAILY_MATCHES
DROP POLICY IF EXISTS "Authenticated can update matches" ON public.daily_matches;
DROP POLICY IF EXISTS "Users can update own daily_matches" ON public.daily_matches;
CREATE POLICY "Auth update daily_matches" ON public.daily_matches FOR UPDATE TO authenticated USING (true);

-- DISPUTES
DROP POLICY IF EXISTS "Authenticated can update disputes" ON public.disputes;
DROP POLICY IF EXISTS "Admins can update disputes" ON public.disputes;
CREATE POLICY "Admin update disputes" ON public.disputes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- ERROR_LOGS
DROP POLICY IF EXISTS "Authenticated can update errors" ON public.error_logs;
DROP POLICY IF EXISTS "Admins can update errors" ON public.error_logs;
CREATE POLICY "Admin update errors" ON public.error_logs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- SUCCESS_STORIES
DROP POLICY IF EXISTS "Authenticated can update stories" ON public.success_stories;
DROP POLICY IF EXISTS "Authenticated can delete stories" ON public.success_stories;
DROP POLICY IF EXISTS "Admins can update stories" ON public.success_stories;
DROP POLICY IF EXISTS "Admins can delete stories" ON public.success_stories;
CREATE POLICY "Admin update stories" ON public.success_stories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admin delete stories" ON public.success_stories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- VENDORS
DROP POLICY IF EXISTS "Admins can update vendors" ON public.vendors;
DROP POLICY IF EXISTS "Admins can update vendors v2" ON public.vendors;
CREATE POLICY "Admin update vendors" ON public.vendors FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- VIP_EVENTS
DROP POLICY IF EXISTS "Admins can delete vip_events" ON public.vip_events;
DROP POLICY IF EXISTS "Admins can update vip_events" ON public.vip_events;
DROP POLICY IF EXISTS "Admins can update vip_events v2" ON public.vip_events;
DROP POLICY IF EXISTS "Admins can delete vip_events v2" ON public.vip_events;
CREATE POLICY "Admin update vip_events" ON public.vip_events FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete vip_events" ON public.vip_events FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PHOTO_MODERATIONS (remaining)
DROP POLICY IF EXISTS "Admins can update photo_moderations" ON public.photo_moderations;
CREATE POLICY "Admin update photo_mods" ON public.photo_moderations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- SCAM_ANALYSES (remaining)
DROP POLICY IF EXISTS "Admins can update analyses" ON public.scam_analyses;
CREATE POLICY "Admin update scam" ON public.scam_analyses FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
