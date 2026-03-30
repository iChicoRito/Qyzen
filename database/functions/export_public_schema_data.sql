-- ==================== EXPORT PUBLIC SCHEMA DATA ====================
-- File: database/functions/export_public_schema_data.sql
-- Created: 2026-03-30
-- Purpose: Export all rows from every table in the public schema as JSON blocks.

CREATE OR REPLACE FUNCTION public.export_public_schema_data()
RETURNS TABLE(table_name text, rows jsonb)
LANGUAGE plpgsql
AS $$
DECLARE
  current_table record;
  current_rows jsonb;
BEGIN
  FOR current_table IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    EXECUTE format(
      'SELECT COALESCE(jsonb_agg(to_jsonb(source_rows)), ''[]''::jsonb) FROM public.%I AS source_rows',
      current_table.tablename
    )
    INTO current_rows;

    table_name := current_table.tablename;
    rows := current_rows;
    RETURN NEXT;
  END LOOP;
END;
$$;

SELECT *
FROM public.export_public_schema_data();
