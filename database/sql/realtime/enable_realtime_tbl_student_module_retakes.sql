-- ==================== ENABLE REAL-TIME ON TBL_STUDENT_MODULE_RETAKES ====================
-- File: database/sql/realtime/enable_realtime_tbl_student_module_retakes.sql
-- Created: 2026-04-01
-- Purpose: Add tbl_student_module_retakes to Supabase realtime publication.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'tbl_student_module_retakes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tbl_student_module_retakes;
  END IF;
END $$;
