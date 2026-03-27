
-- Add soft-delete columns to deleted_accounts for 30-day grace period (Tinder-style)
ALTER TABLE public.deleted_accounts 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending_deletion',
  ADD COLUMN IF NOT EXISTS scheduled_deletion_at timestamptz,
  ADD COLUMN IF NOT EXISTS reactivated_at timestamptz,
  ADD COLUMN IF NOT EXISTS profile_snapshot jsonb;

-- Add index for scheduled deletion cron jobs
CREATE INDEX IF NOT EXISTS idx_deleted_accounts_status ON public.deleted_accounts(status);
CREATE INDEX IF NOT EXISTS idx_deleted_accounts_scheduled ON public.deleted_accounts(scheduled_deletion_at) WHERE status = 'pending_deletion';
