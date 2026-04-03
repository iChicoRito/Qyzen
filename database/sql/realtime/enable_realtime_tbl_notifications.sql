-- ==================== ENABLE REAL-TIME ON TBL_NOTIFICATIONS ====================
-- File: database/sql/realtime/enable_realtime_tbl_notifications.sql
-- Created: 2026-04-03
-- Purpose: Add tbl_notifications to the Supabase realtime publication.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'tbl_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tbl_notifications;
  END IF;
END $$;
