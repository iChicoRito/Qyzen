-- ==================== EXPORT PUBLIC SCHEMA DATA ====================
-- File: database/functions/export_public_schema_data.sql
-- Created: 2026-03-30
-- Purpose: Remove the unsafe public schema export function from the exposed schema.

DROP FUNCTION IF EXISTS public.export_public_schema_data();
