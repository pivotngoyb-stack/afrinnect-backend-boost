
CREATE OR REPLACE FUNCTION public.add_story_view(p_story_id uuid, p_viewer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.stories
  SET views = array_append(views, p_viewer_id)
  WHERE id = p_story_id
    AND (views IS NULL OR NOT (p_viewer_id = ANY(views)));
END;
$$;
