
-- 1. Fix founder_invite_codes: restrict to admins only
DROP POLICY IF EXISTS "Anyone can read founder invite codes" ON public.founder_invite_codes;
DROP POLICY IF EXISTS "Authenticated can read founder codes" ON public.founder_invite_codes;
DROP POLICY IF EXISTS "Public can read active codes" ON public.founder_invite_codes;

CREATE POLICY "Only admins can read founder invite codes"
ON public.founder_invite_codes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Fix marketplace_businesses: restrict to authenticated + active only
DROP POLICY IF EXISTS "Anyone can view active businesses" ON public.marketplace_businesses;
DROP POLICY IF EXISTS "Public can view businesses" ON public.marketplace_businesses;

CREATE POLICY "Authenticated can view active businesses"
ON public.marketplace_businesses
FOR SELECT
TO authenticated
USING (is_active = true);

-- 3. Fix moderation_rules: restrict to admins/moderators only
DROP POLICY IF EXISTS "Anyone can read moderation rules" ON public.moderation_rules;
DROP POLICY IF EXISTS "Authenticated can read moderation rules" ON public.moderation_rules;

CREATE POLICY "Only admins can read moderation rules"
ON public.moderation_rules
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- 4. Fix seed_interaction_log: restrict to admins only
DROP POLICY IF EXISTS "Users can read own seed interactions" ON public.seed_interaction_log;
DROP POLICY IF EXISTS "Target users can read seed interactions" ON public.seed_interaction_log;

CREATE POLICY "Only admins can read seed interactions"
ON public.seed_interaction_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Fix broadcast_messages: restrict to admins only  
DROP POLICY IF EXISTS "Authenticated can read broadcasts" ON public.broadcast_messages;
DROP POLICY IF EXISTS "Anyone can read broadcasts" ON public.broadcast_messages;

CREATE POLICY "Only admins can read broadcast messages"
ON public.broadcast_messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Fix ab_tests: restrict to admins only
DROP POLICY IF EXISTS "Anyone can read ab tests" ON public.ab_tests;
DROP POLICY IF EXISTS "Authenticated can read ab tests" ON public.ab_tests;

CREATE POLICY "Only admins can read ab tests"
ON public.ab_tests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Fix success_stories: only show approved stories publicly
DROP POLICY IF EXISTS "Anyone can read success stories" ON public.success_stories;
DROP POLICY IF EXISTS "Public can read success stories" ON public.success_stories;

CREATE POLICY "Public can read approved success stories"
ON public.success_stories
FOR SELECT
USING (status = 'approved' OR is_featured = true);
