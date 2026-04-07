-- ==================== ADD TBL_LEARNING_MATERIALS INDEXES ====================
-- File: database/sql/indexes/add_tbl_learning_materials_indexes.sql
-- Created: 2026-04-07
-- Purpose: Add supporting indexes for educator and student learning material lookups.

CREATE INDEX IF NOT EXISTS idx_tbl_learning_materials_educator_id
  ON public.tbl_learning_materials(educator_id);

CREATE INDEX IF NOT EXISTS idx_tbl_learning_materials_subject_id
  ON public.tbl_learning_materials(subject_id);

CREATE INDEX IF NOT EXISTS idx_tbl_learning_materials_section_id
  ON public.tbl_learning_materials(section_id);

CREATE INDEX IF NOT EXISTS idx_tbl_learning_materials_updated_at
  ON public.tbl_learning_materials(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_tbl_learning_materials_storage_path
  ON public.tbl_learning_materials(storage_bucket, storage_path);
