
-- Fix chat_games — use correct matches column names
DROP POLICY IF EXISTS "Match participants can view chat games" ON public.chat_games;

CREATE POLICY "Match participants can view chat games"
  ON public.chat_games FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND (m.user1_id = public.get_my_profile_id() OR m.user2_id = public.get_my_profile_id())
    )
  );

-- Fix community_messages (may have already failed)
DROP POLICY IF EXISTS "Community members can read messages" ON public.community_messages;

CREATE POLICY "Community members can read messages"
  ON public.community_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_messages.community_id
        AND cm.user_id = auth.uid()
    )
  );
