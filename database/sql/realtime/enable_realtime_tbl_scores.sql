-- ==================== ENABLE REAL-TIME ON TBL_SCORES ====================
-- File: database/sql/realtime/enable_realtime_tbl_scores.sql
-- Created: 2026-03-30
-- Purpose: Add tbl_scores to the Supabase realtime publication.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'tbl_scores'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tbl_scores;
  END IF;
END $$;
