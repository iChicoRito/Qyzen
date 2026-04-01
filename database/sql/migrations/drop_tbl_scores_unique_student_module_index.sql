-- ==================== DROP UNIQUE SCORE ATTEMPT INDEX ====================
-- File: database/sql/migrations/drop_tbl_scores_unique_student_module_index.sql
-- Created: 2026-04-01
-- Purpose: Allow multiple score attempts per student and module.

DROP INDEX IF EXISTS public.tbl_scores_unique_student_module;
