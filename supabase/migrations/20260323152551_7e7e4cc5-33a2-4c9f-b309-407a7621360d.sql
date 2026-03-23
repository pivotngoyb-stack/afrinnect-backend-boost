
CREATE TABLE public.community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  media_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read community messages"
  ON public.community_messages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can send community messages"
  ON public.community_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_user_id);

CREATE INDEX idx_community_messages_community ON public.community_messages(community_id, created_at);
