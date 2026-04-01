
-- Drop old permissive SELECT policies that conflict with admin-only restrictions
-- These old policies use qual=true which overrides the admin-only policies via PostgreSQL OR logic

DROP POLICY IF EXISTS "Authenticated can read ab_tests" ON public.ab_tests;
DROP POLICY IF EXISTS "Authenticated can read codes" ON public.founder_invite_codes;
DROP POLICY IF EXISTS "Authenticated can read rules" ON public.moderation_rules;

-- Fix likes UPDATE policy: restrict to liker only (liked user should only mark is_seen, handled by edge function)
DROP POLICY IF EXISTS "Users can update their likes" ON public.likes;
CREATE POLICY "Likers can update own likes"
ON public.likes FOR UPDATE TO authenticated
USING (auth.uid() = liker_user_id)
WITH CHECK (auth.uid() = liker_user_id);
