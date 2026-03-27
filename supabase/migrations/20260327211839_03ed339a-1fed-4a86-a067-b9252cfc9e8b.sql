
-- Add unique constraints to prevent duplicate swipe records
-- Use ON CONFLICT DO NOTHING pattern by adding unique indexes

-- Unique constraint on likes: one like per liker-liked pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_unique_pair ON public.likes (liker_id, liked_id);

-- Unique constraint on passes: one pass per passer-passed pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_passes_unique_pair ON public.passes (passer_id, passed_id);
