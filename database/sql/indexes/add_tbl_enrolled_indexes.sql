-- ==================== ADD TBL_ENROLLED INDEXES ====================
-- File: database/sql/indexes/add_tbl_enrolled_indexes.sql
-- Created: 2026-03-29
-- Purpose: Add lookup and uniqueness indexes for educator enrollment records.

CREATE UNIQUE INDEX IF NOT EXISTS tbl_enrolled_unique_student_subject_per_educator
  ON public.tbl_enrolled USING btree (educator_id, student_id, subject_id);

CREATE INDEX IF NOT EXISTS idx_tbl_enrolled_educator_id
  ON public.tbl_enrolled USING btree (educator_id);

CREATE INDEX IF NOT EXISTS idx_tbl_enrolled_student_id
  ON public.tbl_enrolled USING btree (student_id);

CREATE INDEX IF NOT EXISTS idx_tbl_enrolled_subject_id
  ON public.tbl_enrolled USING btree (subject_id);
