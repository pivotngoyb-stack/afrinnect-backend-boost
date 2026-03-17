
-- ========================================
-- BATCH 1: Core Admin & Analytics Tables
-- ========================================

-- Profile Analytics (page views, events tracking)
CREATE TABLE public.profile_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  page_url text,
  session_id text,
  device_type text,
  created_at timestamptz DEFAULT now(),
  created_date date DEFAULT CURRENT_DATE
);
ALTER TABLE public.profile_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert analytics" ON public.profile_analytics FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can read analytics" ON public.profile_analytics FOR SELECT TO authenticated USING (true);

-- Admin Audit Logs
CREATE TABLE public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read audit logs" ON public.admin_audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create audit logs" ON public.admin_audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Error Logs
CREATE TABLE public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  error_type text,
  error_message text,
  stack_trace text,
  page_url text,
  device_info jsonb DEFAULT '{}'::jsonb,
  severity text DEFAULT 'error',
  is_resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert errors" ON public.error_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can read errors" ON public.error_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can update errors" ON public.error_logs FOR UPDATE TO authenticated USING (true);

-- System Settings
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb DEFAULT '{}'::jsonb,
  description text,
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read settings" ON public.system_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert settings" ON public.system_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update settings" ON public.system_settings FOR UPDATE TO authenticated USING (true);

-- Feature Flags
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  is_enabled boolean DEFAULT false,
  target_audience text DEFAULT 'all',
  percentage integer DEFAULT 100,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read flags" ON public.feature_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert flags" ON public.feature_flags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update flags" ON public.feature_flags FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete flags" ON public.feature_flags FOR DELETE TO authenticated USING (true);

-- AB Tests
CREATE TABLE public.ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text DEFAULT 'draft',
  variants jsonb DEFAULT '[]'::jsonb,
  target_metric text,
  start_date timestamptz,
  end_date timestamptz,
  results jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read ab_tests" ON public.ab_tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert ab_tests" ON public.ab_tests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update ab_tests" ON public.ab_tests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete ab_tests" ON public.ab_tests FOR DELETE TO authenticated USING (true);

-- Broadcast Messages
CREATE TABLE public.broadcast_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  target_audience text DEFAULT 'all',
  target_tier text,
  target_country text,
  status text DEFAULT 'draft',
  sent_at timestamptz,
  sent_by uuid,
  recipients_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read broadcasts" ON public.broadcast_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert broadcasts" ON public.broadcast_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update broadcasts" ON public.broadcast_messages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete broadcasts" ON public.broadcast_messages FOR DELETE TO authenticated USING (true);

-- Reports (user reports)
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reporter_user_id uuid NOT NULL,
  reported_id uuid NOT NULL,
  reported_user_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  evidence_urls text[] DEFAULT '{}'::text[],
  status text DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  resolution text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_user_id);
CREATE POLICY "Users can read own reports" ON public.reports FOR SELECT TO authenticated USING (auth.uid() = reporter_user_id OR true);
CREATE POLICY "Authenticated can update reports" ON public.reports FOR UPDATE TO authenticated USING (true);

-- Moderation Rules
CREATE TABLE public.moderation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  rule_type text NOT NULL,
  conditions jsonb DEFAULT '{}'::jsonb,
  action text NOT NULL,
  severity text DEFAULT 'warning',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.moderation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read rules" ON public.moderation_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert rules" ON public.moderation_rules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update rules" ON public.moderation_rules FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete rules" ON public.moderation_rules FOR DELETE TO authenticated USING (true);

-- Moderation Actions
CREATE TABLE public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL,
  target_profile_id uuid,
  action_type text NOT NULL,
  reason text,
  details jsonb DEFAULT '{}'::jsonb,
  performed_by uuid,
  rule_id uuid REFERENCES public.moderation_rules(id),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read actions" ON public.moderation_actions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert actions" ON public.moderation_actions FOR INSERT TO authenticated WITH CHECK (true);

-- Disputes
CREATE TABLE public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_profile_id uuid,
  related_action_id uuid,
  related_report_id uuid,
  reason text NOT NULL,
  description text,
  evidence_urls text[] DEFAULT '{}'::text[],
  status text DEFAULT 'open',
  resolution text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create disputes" ON public.disputes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated can read disputes" ON public.disputes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can update disputes" ON public.disputes FOR UPDATE TO authenticated USING (true);

-- Photo Moderations
CREATE TABLE public.photo_moderations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL,
  photo_url text NOT NULL,
  status text DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  ai_score numeric,
  ai_flags jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.photo_moderations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read photo mods" ON public.photo_moderations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert photo mods" ON public.photo_moderations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update photo mods" ON public.photo_moderations FOR UPDATE TO authenticated USING (true);

-- Verification Requests
CREATE TABLE public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL,
  user_id uuid NOT NULL,
  verification_type text NOT NULL,
  selfie_url text,
  document_url text,
  status text DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create verifications" ON public.verification_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated can read verifications" ON public.verification_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can update verifications" ON public.verification_requests FOR UPDATE TO authenticated USING (true);

-- Fake Profile Detections
CREATE TABLE public.fake_profile_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL,
  detection_type text,
  confidence_score numeric,
  flags jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending',
  reviewed_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.fake_profile_detections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read detections" ON public.fake_profile_detections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert detections" ON public.fake_profile_detections FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update detections" ON public.fake_profile_detections FOR UPDATE TO authenticated USING (true);

-- Scam Analyses
CREATE TABLE public.scam_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL,
  analysis_type text,
  risk_score numeric,
  risk_factors jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.scam_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read scam analyses" ON public.scam_analyses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert scam analyses" ON public.scam_analyses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update scam analyses" ON public.scam_analyses FOR UPDATE TO authenticated USING (true);

-- Match Feedbacks
CREATE TABLE public.match_feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid,
  user_profile_id uuid NOT NULL,
  rating integer,
  feedback_type text,
  feedback_notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.match_feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create feedback" ON public.match_feedbacks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can read feedback" ON public.match_feedbacks FOR SELECT TO authenticated USING (true);

-- AI Insights
CREATE TABLE public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type text NOT NULL,
  title text,
  description text,
  data jsonb DEFAULT '{}'::jsonb,
  priority text DEFAULT 'medium',
  is_dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read insights" ON public.ai_insights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert insights" ON public.ai_insights FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update insights" ON public.ai_insights FOR UPDATE TO authenticated USING (true);

-- Advertisements
CREATE TABLE public.advertisements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  target_url text,
  target_audience text DEFAULT 'all',
  placement text DEFAULT 'banner',
  is_active boolean DEFAULT true,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read ads" ON public.advertisements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert ads" ON public.advertisements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update ads" ON public.advertisements FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete ads" ON public.advertisements FOR DELETE TO authenticated USING (true);

-- Date Feedbacks
CREATE TABLE public.date_feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL,
  match_id uuid,
  partner_profile_id uuid,
  rating integer,
  met_in_person boolean DEFAULT false,
  safety_concerns boolean DEFAULT false,
  feedback_notes text,
  created_at timestamptz DEFAULT now(),
  created_date date DEFAULT CURRENT_DATE
);
ALTER TABLE public.date_feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create date feedback" ON public.date_feedbacks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can read date feedback" ON public.date_feedbacks FOR SELECT TO authenticated USING (true);

-- Screenshot Alerts
CREATE TABLE public.screenshot_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL,
  detected_user_id uuid,
  context text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.screenshot_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read alerts" ON public.screenshot_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert alerts" ON public.screenshot_alerts FOR INSERT TO authenticated WITH CHECK (true);

-- Background Checks
CREATE TABLE public.background_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text DEFAULT 'pending',
  result jsonb DEFAULT '{}'::jsonb,
  provider text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.background_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create own checks" ON public.background_checks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated can read checks" ON public.background_checks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can update checks" ON public.background_checks FOR UPDATE TO authenticated USING (true);

-- Safety Checks
CREATE TABLE public.safety_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL,
  user_id uuid NOT NULL,
  match_id uuid,
  check_in_time timestamptz,
  status text DEFAULT 'active',
  emergency_contact jsonb DEFAULT '{}'::jsonb,
  location jsonb DEFAULT '{}'::jsonb,
  is_safe boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.safety_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create safety checks" ON public.safety_checks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own safety checks" ON public.safety_checks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own safety checks" ON public.safety_checks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
