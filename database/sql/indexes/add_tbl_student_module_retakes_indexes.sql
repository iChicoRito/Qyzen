-- ==================== ADD TBL_STUDENT_MODULE_RETAKES INDEXES ====================
-- File: database/sql/indexes/add_tbl_student_module_retakes_indexes.sql
-- Created: 2026-04-01
-- Purpose: Add indexes for educator-managed student retake grants.

CREATE UNIQUE INDEX IF NOT EXISTS idx_tbl_student_module_retakes_unique_pair
  ON public.tbl_student_module_retakes(educator_id, student_id, module_id);

CREATE INDEX IF NOT EXISTS idx_tbl_student_module_retakes_student_module
  ON public.tbl_student_module_retakes(student_id, module_id);

CREATE INDEX IF NOT EXISTS idx_tbl_student_module_retakes_educator_id
  ON public.tbl_student_module_retakes(educator_id);

CREATE INDEX IF NOT EXISTS idx_tbl_student_module_retakes_module_id
  ON public.tbl_student_module_retakes(module_id);
