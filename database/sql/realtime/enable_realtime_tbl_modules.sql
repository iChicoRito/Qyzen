-- ==================== ENABLE REAL-TIME ON TBL_MODULES ====================
-- File: database/sql/realtime/enable_realtime_tbl_modules.sql
-- Created: 2026-03-29
-- Purpose: Add tbl_modules to the Supabase real-time publication

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'tbl_modules'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tbl_modules;
  END IF;
END;
$$;
