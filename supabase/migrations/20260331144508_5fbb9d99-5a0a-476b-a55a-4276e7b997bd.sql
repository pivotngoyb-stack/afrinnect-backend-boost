
-- Atomic daily-like increment function using row-level locking
-- Replaces the fragile optimistic-lock pattern in the like-profile edge function
CREATE OR REPLACE FUNCTION public.increment_daily_likes(
  p_profile_id uuid,
  p_tier_limit integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_today text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
  v_current_count integer;
  v_reset_date text;
  v_new_count integer;
BEGIN
  -- Lock the row to prevent concurrent increments
  SELECT daily_likes_count, daily_likes_reset_date
  INTO v_current_count, v_reset_date
  FROM public.user_profiles
  WHERE id = p_profile_id
  FOR UPDATE;

  -- Reset count if it's a new day
  IF v_reset_date IS DISTINCT FROM v_today THEN
    v_current_count := 0;
  END IF;

  -- Check limit (-1 means unlimited)
  IF p_tier_limit > 0 AND v_current_count >= p_tier_limit THEN
    RETURN jsonb_build_object('allowed', false, 'count', v_current_count, 'limit', p_tier_limit);
  END IF;

  v_new_count := v_current_count + 1;

  UPDATE public.user_profiles
  SET daily_likes_count = v_new_count,
      daily_likes_reset_date = v_today
  WHERE id = p_profile_id;

  RETURN jsonb_build_object('allowed', true, 'count', v_new_count, 'limit', p_tier_limit);
END;
$$;

-- Atomic daily-like decrement for rewinds
CREATE OR REPLACE FUNCTION public.decrement_daily_likes(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_today text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
BEGIN
  UPDATE public.user_profiles
  SET daily_likes_count = GREATEST(0, daily_likes_count - 1)
  WHERE id = p_profile_id
    AND daily_likes_reset_date = v_today
    AND daily_likes_count > 0;
END;
$$;
