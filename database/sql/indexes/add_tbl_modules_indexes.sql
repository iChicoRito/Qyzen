-- ==================== ADD TBL_MODULES INDEXES ====================
-- File: database/sql/indexes/add_tbl_modules_indexes.sql
-- Created: 2026-03-29
-- Purpose: Add supporting indexes for educator module lookups

CREATE INDEX IF NOT EXISTS idx_tbl_modules_educator_id ON public.tbl_modules(educator_id);
CREATE INDEX IF NOT EXISTS idx_tbl_modules_subject_id ON public.tbl_modules(subject_id);
CREATE INDEX IF NOT EXISTS idx_tbl_modules_section_id ON public.tbl_modules(section_id);
CREATE INDEX IF NOT EXISTS idx_tbl_modules_module_code ON public.tbl_modules(module_code);
CREATE INDEX IF NOT EXISTS idx_tbl_modules_start_date ON public.tbl_modules(start_date);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tbl_modules'
      AND column_name = 'term'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tbl_modules_term ON public.tbl_modules(term);
  END IF;
END $$;
