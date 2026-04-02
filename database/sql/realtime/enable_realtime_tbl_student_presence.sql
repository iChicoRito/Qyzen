-- ==================== ENABLE REAL-TIME ON TBL_STUDENT_PRESENCE ====================
-- File: database/sql/realtime/enable_realtime_tbl_student_presence.sql
-- Created: 2026-04-02
-- Purpose: Add tbl_student_presence to the Supabase realtime publication.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'tbl_student_presence'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tbl_student_presence;
  END IF;
END $$;
