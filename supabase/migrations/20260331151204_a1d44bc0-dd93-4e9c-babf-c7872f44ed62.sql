
-- PART 1: user_profiles - restrict to authenticated
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.user_profiles;
CREATE POLICY "Authenticated can read profiles" ON public.user_profiles
  FOR SELECT TO authenticated USING (true);

-- PART 2: deleted_accounts - block all
DROP POLICY IF EXISTS "Service role only for deleted_accounts" ON public.deleted_accounts;
CREATE POLICY "Block all access to deleted_accounts" ON public.deleted_accounts
  FOR ALL USING (false);

-- PART 3: background_checks - owner + admin
DROP POLICY IF EXISTS "Authenticated can read checks" ON public.background_checks;
CREATE POLICY "Owner or admin can read checks" ON public.background_checks
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
  );

-- PART 4: admin_audit_logs - admin only
DROP POLICY IF EXISTS "Authenticated can read audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admin can read audit logs" ON public.admin_audit_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PART 5: scam_analyses - admin/moderator
DROP POLICY IF EXISTS "Authenticated can read scam analyses" ON public.scam_analyses;
CREATE POLICY "Admin or moderator can read scam analyses" ON public.scam_analyses
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')
  );

-- PART 6: fake_profile_detections - admin/moderator
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'fake_profile_detections' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.fake_profile_detections', pol.policyname); END LOOP;
END$$;
CREATE POLICY "Admin or moderator can read fake detections" ON public.fake_profile_detections
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')
  );

-- PART 7: photo_moderations - owner + admin/moderator
DROP POLICY IF EXISTS "Authenticated can read photo mods" ON public.photo_moderations;
CREATE POLICY "Owner or admin can read photo mods" ON public.photo_moderations
  FOR SELECT TO authenticated USING (
    user_profile_id = public.get_my_profile_id() 
    OR public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'moderator')
  );

-- PART 8: moderation_actions - admin/moderator + affected user
DROP POLICY IF EXISTS "Authenticated can read actions" ON public.moderation_actions;
CREATE POLICY "Admin or affected user can read actions" ON public.moderation_actions
  FOR SELECT TO authenticated USING (
    target_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'moderator')
  );

-- PART 9: disputes - owner + admin/moderator
DROP POLICY IF EXISTS "Authenticated can read disputes" ON public.disputes;
CREATE POLICY "Owner or admin can read disputes" ON public.disputes
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'moderator')
  );

-- PART 10: reports - fix broken OR true
DROP POLICY IF EXISTS "Users can read own reports" ON public.reports;
CREATE POLICY "Users can read own reports" ON public.reports
  FOR SELECT TO authenticated USING (
    reporter_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'moderator')
  );

-- PART 11: error_logs - admin only
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'error_logs' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.error_logs', pol.policyname); END LOOP;
END$$;
CREATE POLICY "Admin can read error logs" ON public.error_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
