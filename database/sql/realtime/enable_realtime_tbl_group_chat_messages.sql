-- ==================== ENABLE REAL-TIME ON TBL_GROUP_CHAT_MESSAGES ====================
-- File: database/sql/realtime/enable_realtime_tbl_group_chat_messages.sql
-- Created: 2026-04-03
-- Purpose: Add tbl_group_chat_messages to the Supabase realtime publication.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'tbl_group_chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tbl_group_chat_messages;
  END IF;
END $$;
