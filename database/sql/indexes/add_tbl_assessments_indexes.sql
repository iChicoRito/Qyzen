-- ==================== ADD TBL_ASSESSMENTS INDEXES ====================
-- File: database/sql/indexes/add_tbl_assessments_indexes.sql
-- Created: 2026-03-29
-- Purpose: Add supporting indexes for educator assessment lookups

CREATE INDEX IF NOT EXISTS idx_tbl_assessments_educator_id ON public.tbl_assessments(educator_id);
CREATE INDEX IF NOT EXISTS idx_tbl_assessments_subject_id ON public.tbl_assessments(subject_id);
CREATE INDEX IF NOT EXISTS idx_tbl_assessments_section_id ON public.tbl_assessments(section_id);
CREATE INDEX IF NOT EXISTS idx_tbl_assessments_assessment_code ON public.tbl_assessments(assessment_code);
CREATE INDEX IF NOT EXISTS idx_tbl_assessments_start_date ON public.tbl_assessments(start_date);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tbl_assessments'
      AND column_name = 'term'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tbl_assessments_term ON public.tbl_assessments(term);
  END IF;
END $$;

