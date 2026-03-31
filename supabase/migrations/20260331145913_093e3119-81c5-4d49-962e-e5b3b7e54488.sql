-- Add composite index for unread count performance
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread ON public.messages (receiver_id, is_read) WHERE is_read = false;

-- Chat pagination index
CREATE INDEX IF NOT EXISTS idx_messages_match_created ON public.messages (match_id, created_at DESC);

-- Likes dedup check index
CREATE INDEX IF NOT EXISTS idx_likes_liker_liked ON public.likes (liker_id, liked_id);

-- Passes exclusion index
CREATE INDEX IF NOT EXISTS idx_passes_passer ON public.passes (passer_id);