
CREATE OR REPLACE FUNCTION public.get_unread_counts(p_profile_id uuid)
RETURNS TABLE(match_id uuid, unread_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT m.match_id, COUNT(*) as unread_count
  FROM public.messages m
  WHERE m.receiver_id = p_profile_id
    AND m.is_read = false
  GROUP BY m.match_id;
$$;
