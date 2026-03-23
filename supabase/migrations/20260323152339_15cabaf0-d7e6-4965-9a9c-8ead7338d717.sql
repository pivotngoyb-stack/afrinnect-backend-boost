
-- Junction table for community membership
CREATE TABLE public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_profile_id)
);

-- Enable RLS
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read community members
CREATE POLICY "Authenticated users can view community members"
  ON public.community_members FOR SELECT TO authenticated USING (true);

-- Users can join communities (insert their own row)
CREATE POLICY "Users can join communities"
  ON public.community_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can leave communities (delete their own row)
CREATE POLICY "Users can leave communities"
  ON public.community_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Communities: anyone authenticated can read active communities
CREATE POLICY "Authenticated users can view communities"
  ON public.communities FOR SELECT TO authenticated USING (true);

-- Admins can manage communities
CREATE POLICY "Admins can insert communities"
  ON public.communities FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update communities"
  ON public.communities FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete communities"
  ON public.communities FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable RLS on communities if not already
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
