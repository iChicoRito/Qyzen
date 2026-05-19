-- ==================== DROP EXPORT PUBLIC SCHEMA DATA FUNCTION ====================
-- File: database/sql/migrations/drop_export_public_schema_data_function.sql
-- Created: 2026-05-15
-- Purpose: Remove the unsafe public export function from the exposed schema.

DROP FUNCTION IF EXISTS public.export_public_schema_data();
