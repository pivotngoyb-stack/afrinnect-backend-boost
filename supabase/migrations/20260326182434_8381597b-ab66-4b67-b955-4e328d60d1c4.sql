
-- ============================================
-- TIGHTEN RLS: Admin-only tables
-- Drop overly permissive policies and replace with admin-only
-- ============================================

-- Helper: list of admin-only tables that should NOT allow regular user writes
-- ab_tests, advertisements, ai_insights, ambassador_campaigns, ambassador_commission_plans,
-- ambassador_commissions, ambassador_content_assets, ambassador_payouts,
-- broadcast_messages, system_settings, feature_flags, moderation_rules,
-- photo_moderations, pricing_plans, promotions, tier_configurations, vip_events,
-- fake_profile_detections, scam_analyses, verification_requests, success_story_contests

-- AB_TESTS
DROP POLICY IF EXISTS "Authenticated can insert ab_tests" ON public.ab_tests;
DROP POLICY IF EXISTS "Authenticated can update ab_tests" ON public.ab_tests;
DROP POLICY IF EXISTS "Authenticated can delete ab_tests" ON public.ab_tests;
CREATE POLICY "Admins can insert ab_tests" ON public.ab_tests FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update ab_tests" ON public.ab_tests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete ab_tests" ON public.ab_tests FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ADVERTISEMENTS
DROP POLICY IF EXISTS "Authenticated can insert ads" ON public.advertisements;
DROP POLICY IF EXISTS "Authenticated can update ads" ON public.advertisements;
DROP POLICY IF EXISTS "Authenticated can delete ads" ON public.advertisements;
CREATE POLICY "Admins can insert ads" ON public.advertisements FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update ads" ON public.advertisements FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete ads" ON public.advertisements FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- AI_INSIGHTS
DROP POLICY IF EXISTS "Authenticated can insert insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Authenticated can update insights" ON public.ai_insights;
CREATE POLICY "Admins can insert insights" ON public.ai_insights FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update insights" ON public.ai_insights FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- BROADCAST_MESSAGES
DROP POLICY IF EXISTS "Authenticated can insert broadcasts" ON public.broadcast_messages;
DROP POLICY IF EXISTS "Authenticated can update broadcasts" ON public.broadcast_messages;
DROP POLICY IF EXISTS "Authenticated can delete broadcasts" ON public.broadcast_messages;
CREATE POLICY "Admins can insert broadcasts" ON public.broadcast_messages FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update broadcasts" ON public.broadcast_messages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete broadcasts" ON public.broadcast_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- SYSTEM_SETTINGS
DROP POLICY IF EXISTS "Authenticated can insert settings" ON public.system_settings;
DROP POLICY IF EXISTS "Authenticated can update settings" ON public.system_settings;
DROP POLICY IF EXISTS "Authenticated can delete settings" ON public.system_settings;
CREATE POLICY "Admins can insert settings" ON public.system_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update settings" ON public.system_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete settings" ON public.system_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- FEATURE_FLAGS
DROP POLICY IF EXISTS "Authenticated can insert flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Authenticated can update flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Authenticated can delete flags" ON public.feature_flags;
CREATE POLICY "Admins can insert flags" ON public.feature_flags FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update flags" ON public.feature_flags FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete flags" ON public.feature_flags FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- MODERATION_RULES
DROP POLICY IF EXISTS "Authenticated can insert rules" ON public.moderation_rules;
DROP POLICY IF EXISTS "Authenticated can update rules" ON public.moderation_rules;
DROP POLICY IF EXISTS "Authenticated can delete rules" ON public.moderation_rules;
CREATE POLICY "Admins can insert rules" ON public.moderation_rules FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update rules" ON public.moderation_rules FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete rules" ON public.moderation_rules FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PRICING_PLANS
DROP POLICY IF EXISTS "Authenticated can insert plans" ON public.pricing_plans;
DROP POLICY IF EXISTS "Authenticated can update plans" ON public.pricing_plans;
DROP POLICY IF EXISTS "Authenticated can delete plans" ON public.pricing_plans;
CREATE POLICY "Admins can insert pricing" ON public.pricing_plans FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update pricing" ON public.pricing_plans FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete pricing" ON public.pricing_plans FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- TIER_CONFIGURATIONS
DROP POLICY IF EXISTS "Authenticated can insert tiers" ON public.tier_configurations;
DROP POLICY IF EXISTS "Authenticated can update tiers" ON public.tier_configurations;
DROP POLICY IF EXISTS "Authenticated can delete tiers" ON public.tier_configurations;
CREATE POLICY "Admins can insert tiers" ON public.tier_configurations FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update tiers" ON public.tier_configurations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete tiers" ON public.tier_configurations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PROMOTIONS
DROP POLICY IF EXISTS "Authenticated can insert promotions" ON public.promotions;
DROP POLICY IF EXISTS "Authenticated can update promotions" ON public.promotions;
DROP POLICY IF EXISTS "Authenticated can delete promotions" ON public.promotions;
CREATE POLICY "Admins can insert promotions" ON public.promotions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update promotions" ON public.promotions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete promotions" ON public.promotions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- VIP_EVENTS
DROP POLICY IF EXISTS "Authenticated can insert vip_events" ON public.vip_events;
DROP POLICY IF EXISTS "Authenticated can update vip_events" ON public.vip_events;
DROP POLICY IF EXISTS "Authenticated can delete vip_events" ON public.vip_events;
CREATE POLICY "Admins can insert vip_events" ON public.vip_events FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update vip_events" ON public.vip_events FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete vip_events" ON public.vip_events FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PHOTO_MODERATIONS (admin/moderator)
DROP POLICY IF EXISTS "Authenticated can insert moderations" ON public.photo_moderations;
DROP POLICY IF EXISTS "Authenticated can update moderations" ON public.photo_moderations;
DROP POLICY IF EXISTS "Authenticated can delete moderations" ON public.photo_moderations;
CREATE POLICY "Admins can insert photo_moderations" ON public.photo_moderations FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admins can update photo_moderations" ON public.photo_moderations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- FAKE_PROFILE_DETECTIONS (admin/moderator)
DROP POLICY IF EXISTS "Authenticated can insert detections" ON public.fake_profile_detections;
DROP POLICY IF EXISTS "Authenticated can update detections" ON public.fake_profile_detections;
CREATE POLICY "Admins can insert detections" ON public.fake_profile_detections FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admins can update detections" ON public.fake_profile_detections FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- SCAM_ANALYSES (admin/moderator)
DROP POLICY IF EXISTS "Authenticated can insert analyses" ON public.scam_analyses;
DROP POLICY IF EXISTS "Authenticated can update analyses" ON public.scam_analyses;
CREATE POLICY "Admins can insert analyses" ON public.scam_analyses FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admins can update analyses" ON public.scam_analyses FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- VERIFICATION_REQUESTS (admin/moderator for write, users can insert own)
DROP POLICY IF EXISTS "Authenticated can update verifications" ON public.verification_requests;
DROP POLICY IF EXISTS "Authenticated can delete verifications" ON public.verification_requests;
CREATE POLICY "Admins can update verifications" ON public.verification_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- REPORTS: users can insert, but only admins can update/delete
DROP POLICY IF EXISTS "Authenticated can update reports" ON public.reports;
DROP POLICY IF EXISTS "Authenticated can delete reports" ON public.reports;
CREATE POLICY "Admins can update reports" ON public.reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admins can delete reports" ON public.reports FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- SUCCESS_STORY_CONTESTS
DROP POLICY IF EXISTS "Authenticated can insert contests" ON public.success_story_contests;
DROP POLICY IF EXISTS "Authenticated can update contests" ON public.success_story_contests;
DROP POLICY IF EXISTS "Authenticated can delete contests" ON public.success_story_contests;
CREATE POLICY "Admins can insert contests" ON public.success_story_contests FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update contests" ON public.success_story_contests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete contests" ON public.success_story_contests FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- AMBASSADOR tables: admin-only writes
DROP POLICY IF EXISTS "Authenticated can insert campaigns" ON public.ambassador_campaigns;
DROP POLICY IF EXISTS "Authenticated can update campaigns" ON public.ambassador_campaigns;
CREATE POLICY "Admins can insert campaigns" ON public.ambassador_campaigns FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update campaigns" ON public.ambassador_campaigns FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can insert plans" ON public.ambassador_commission_plans;
DROP POLICY IF EXISTS "Authenticated can update plans" ON public.ambassador_commission_plans;
CREATE POLICY "Admins can insert commission_plans" ON public.ambassador_commission_plans FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update commission_plans" ON public.ambassador_commission_plans FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can insert commissions" ON public.ambassador_commissions;
DROP POLICY IF EXISTS "Authenticated can update commissions" ON public.ambassador_commissions;
CREATE POLICY "Admins can insert commissions" ON public.ambassador_commissions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update commissions" ON public.ambassador_commissions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can insert assets" ON public.ambassador_content_assets;
DROP POLICY IF EXISTS "Authenticated can update assets" ON public.ambassador_content_assets;
CREATE POLICY "Admins can insert assets" ON public.ambassador_content_assets FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update assets" ON public.ambassador_content_assets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can insert payouts" ON public.ambassador_payouts;
DROP POLICY IF EXISTS "Authenticated can update payouts" ON public.ambassador_payouts;
CREATE POLICY "Admins can insert payouts" ON public.ambassador_payouts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update payouts" ON public.ambassador_payouts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- EVENTS: anyone can read, but only admins can update/delete
DROP POLICY IF EXISTS "Authenticated can update events" ON public.events;
DROP POLICY IF EXISTS "Authenticated can delete events" ON public.events;
CREATE POLICY "Admins can update events" ON public.events FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- FOUNDER_INVITE_CODES
DROP POLICY IF EXISTS "Authenticated can insert codes" ON public.founder_invite_codes;
DROP POLICY IF EXISTS "Authenticated can update codes" ON public.founder_invite_codes;
DROP POLICY IF EXISTS "Authenticated can delete codes" ON public.founder_invite_codes;
CREATE POLICY "Admins can insert codes" ON public.founder_invite_codes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update codes" ON public.founder_invite_codes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete codes" ON public.founder_invite_codes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- SPEED_DATING_SESSIONS
DROP POLICY IF EXISTS "Authenticated can insert sessions" ON public.speed_dating_sessions;
DROP POLICY IF EXISTS "Authenticated can update sessions" ON public.speed_dating_sessions;
DROP POLICY IF EXISTS "Authenticated can delete sessions" ON public.speed_dating_sessions;
CREATE POLICY "Admins can insert sessions" ON public.speed_dating_sessions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update sessions" ON public.speed_dating_sessions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete sessions" ON public.speed_dating_sessions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- VENDORS
DROP POLICY IF EXISTS "Authenticated can insert vendors" ON public.vendors;
DROP POLICY IF EXISTS "Authenticated can update vendors" ON public.vendors;
DROP POLICY IF EXISTS "Authenticated can delete vendors" ON public.vendors;
CREATE POLICY "Admins can insert vendors" ON public.vendors FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update vendors" ON public.vendors FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete vendors" ON public.vendors FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
