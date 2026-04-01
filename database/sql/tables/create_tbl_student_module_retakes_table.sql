-- ==================== CREATE TBL_STUDENT_MODULE_RETAKES TABLE ====================
-- File: database/sql/tables/create_tbl_student_module_retakes_table.sql
-- Created: 2026-04-01
-- Purpose: Store educator-granted extra retake chances per student and module.

CREATE TABLE IF NOT EXISTS public.tbl_student_module_retakes (
  id BIGSERIAL PRIMARY KEY,
  educator_id BIGINT NOT NULL REFERENCES public.tbl_users(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES public.tbl_users(id) ON DELETE CASCADE,
  module_id BIGINT NOT NULL REFERENCES public.tbl_modules(id) ON DELETE CASCADE,
  extra_retake_count INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.tbl_student_module_retakes ENABLE ROW LEVEL SECURITY;
