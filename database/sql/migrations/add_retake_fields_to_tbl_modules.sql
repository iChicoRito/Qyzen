-- ==================== ADD RETAKE FIELDS TO TBL_MODULES ====================
-- File: database/sql/migrations/add_retake_fields_to_tbl_modules.sql
-- Created: 2026-04-01
-- Purpose: Add educator retake configuration fields to module rows.

ALTER TABLE public.tbl_modules
ADD COLUMN IF NOT EXISTS allow_retake BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS retake_count INTEGER NOT NULL DEFAULT 0;
