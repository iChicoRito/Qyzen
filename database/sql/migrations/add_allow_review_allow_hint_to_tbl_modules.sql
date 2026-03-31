-- ==================== ADD REVIEW AND HINT FIELDS TO TBL_MODULES ====================
-- File: database/sql/migrations/add_allow_review_allow_hint_to_tbl_modules.sql
-- Created: 2026-03-31
-- Purpose: Add educator review and hint configuration fields to module rows

ALTER TABLE public.tbl_modules
ADD COLUMN IF NOT EXISTS allow_review BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS allow_hint BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hint_count INTEGER NOT NULL DEFAULT 0;
