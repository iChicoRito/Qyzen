-- ==================== ADD RETAKE FIELDS TO TBL_ASSESSMENTS ====================
-- File: database/sql/migrations/add_retake_fields_to_tbl_assessments.sql
-- Created: 2026-04-01
-- Purpose: Add educator retake configuration fields to assessment rows.

ALTER TABLE public.tbl_assessments
ADD COLUMN IF NOT EXISTS allow_retake BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS retake_count INTEGER NOT NULL DEFAULT 0;

