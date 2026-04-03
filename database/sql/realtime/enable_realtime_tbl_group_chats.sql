-- ==================== ENABLE REAL-TIME ON TBL_GROUP_CHATS ====================
-- File: database/sql/realtime/enable_realtime_tbl_group_chats.sql
-- Created: 2026-04-03
-- Purpose: Add tbl_group_chats to the Supabase realtime publication.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'tbl_group_chats'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tbl_group_chats;
  END IF;
END $$;
