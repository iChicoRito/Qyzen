-- ==================== REMOVE MODULE ID DEFAULT FROM TBL_MODULES ====================
-- File: database/sql/migrations/remove_module_id_default_from_tbl_modules.sql
-- Created: 2026-05-06
-- Purpose: Remove the legacy module_id column from tbl_modules

ALTER TABLE public.tbl_modules
DROP COLUMN IF EXISTS module_id;
