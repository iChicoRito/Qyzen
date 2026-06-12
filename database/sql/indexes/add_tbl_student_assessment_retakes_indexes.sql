-- ==================== ADD TBL_STUDENT_ASSESSMENT_RETAKES INDEXES ====================
-- File: database/sql/indexes/add_tbl_student_assessment_retakes_indexes.sql
-- Created: 2026-04-01
-- Purpose: Add indexes for educator-managed student retake grants.

CREATE UNIQUE INDEX IF NOT EXISTS idx_tbl_student_assessment_retakes_unique_pair
  ON public.tbl_student_assessment_retakes(educator_id, student_id, assessment_id);

CREATE INDEX IF NOT EXISTS idx_tbl_student_assessment_retakes_student_assessment
  ON public.tbl_student_assessment_retakes(student_id, assessment_id);

CREATE INDEX IF NOT EXISTS idx_tbl_student_assessment_retakes_educator_id
  ON public.tbl_student_assessment_retakes(educator_id);

CREATE INDEX IF NOT EXISTS idx_tbl_student_assessment_retakes_assessment_id
  ON public.tbl_student_assessment_retakes(assessment_id);

