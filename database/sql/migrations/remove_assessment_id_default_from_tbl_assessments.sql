-- ==================== REMOVE ASSESSMENT ID DEFAULT FROM TBL_ASSESSMENTS ====================
-- File: database/sql/migrations/remove_assessment_id_default_from_tbl_assessments.sql
-- Created: 2026-05-06
-- Purpose: Remove the legacy assessment_id column from tbl_assessments

ALTER TABLE public.tbl_assessments
DROP COLUMN IF EXISTS assessment_id;

