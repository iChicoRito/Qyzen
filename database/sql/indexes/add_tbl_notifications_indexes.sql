-- ==================== ADD TBL_NOTIFICATIONS INDEXES ====================
-- File: database/sql/indexes/add_tbl_notifications_indexes.sql
-- Created: 2026-04-03
-- Purpose: Speed up unread badge counts and recent notification lookups.

CREATE INDEX IF NOT EXISTS idx_tbl_notifications_recipient_unread_created_at
  ON public.tbl_notifications USING btree (recipient_user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tbl_notifications_recipient_created_at
  ON public.tbl_notifications USING btree (recipient_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tbl_notifications_actor_user_id
  ON public.tbl_notifications USING btree (actor_user_id);

CREATE INDEX IF NOT EXISTS idx_tbl_notifications_module_id
  ON public.tbl_notifications USING btree (module_id);
