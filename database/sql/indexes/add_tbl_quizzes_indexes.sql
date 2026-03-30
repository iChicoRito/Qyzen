-- ==================== ADD TBL_QUIZZES INDEXES ====================
-- File: database/sql/indexes/add_tbl_quizzes_indexes.sql
-- Created: 2026-03-30
-- Purpose: Add indexes for quiz filtering and joins

CREATE INDEX IF NOT EXISTS idx_tbl_quizzes_module_id
  ON public.tbl_quizzes(module_id);

CREATE INDEX IF NOT EXISTS idx_tbl_quizzes_subject_id
  ON public.tbl_quizzes(subject_id);

CREATE INDEX IF NOT EXISTS idx_tbl_quizzes_section_id
  ON public.tbl_quizzes(section_id);

CREATE INDEX IF NOT EXISTS idx_tbl_quizzes_educator_id
  ON public.tbl_quizzes(educator_id);

CREATE INDEX IF NOT EXISTS idx_tbl_quizzes_quiz_type
  ON public.tbl_quizzes(quiz_type);
