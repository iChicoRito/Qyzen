-- ==================== ENABLE REAL-TIME ON TBL_LEARNING_MATERIALS ====================
-- File: database/sql/realtime/enable_realtime_tbl_learning_materials.sql
-- Created: 2026-04-07
-- Purpose: Add tbl_learning_materials to the Supabase real-time publication.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'tbl_learning_materials'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tbl_learning_materials;
  END IF;
END;
$$;
