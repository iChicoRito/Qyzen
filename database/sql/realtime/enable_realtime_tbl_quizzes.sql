-- ==================== ENABLE REAL-TIME ON TBL_QUIZZES ====================
-- File: database/sql/realtime/enable_realtime_tbl_quizzes.sql
-- Created: 2026-03-30
-- Purpose: Add tbl_quizzes to the Supabase real-time publication

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'tbl_quizzes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tbl_quizzes;
  END IF;
END;
$$;
