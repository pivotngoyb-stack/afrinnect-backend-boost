-- Prevent duplicate matches between the same user pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_unique_pair
  ON public.matches (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id))
  WHERE status != 'blocked' AND status != 'unmatched';

-- Helper function to insert notifications bypassing RLS SELECT issues
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_profile_id uuid,
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_from_profile_id uuid DEFAULT NULL,
  p_link_to text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_profile_id, user_id, type, title, message, from_profile_id, link_to, is_read)
  VALUES (p_user_profile_id, p_user_id, p_type::notification_type, p_title, p_message, p_from_profile_id, p_link_to, false);
END;
$$;