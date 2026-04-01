-- ==================== ADD TBL_SCORES INDEXES ====================
-- File: database/sql/indexes/add_tbl_scores_indexes.sql
-- Created: 2026-03-30
-- Purpose: Add indexes and uniqueness rules for student quiz scores.

CREATE INDEX IF NOT EXISTS idx_tbl_scores_student_module
  ON public.tbl_scores(student_id, module_id);

CREATE INDEX IF NOT EXISTS idx_tbl_scores_student_id
  ON public.tbl_scores(student_id);

CREATE INDEX IF NOT EXISTS idx_tbl_scores_module_id
  ON public.tbl_scores(module_id);

CREATE INDEX IF NOT EXISTS idx_tbl_scores_subject_id
  ON public.tbl_scores(subject_id);

CREATE INDEX IF NOT EXISTS idx_tbl_scores_section_id
  ON public.tbl_scores(section_id);

CREATE INDEX IF NOT EXISTS idx_tbl_scores_status
  ON public.tbl_scores(status);
