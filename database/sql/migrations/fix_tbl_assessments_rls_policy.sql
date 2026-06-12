-- ==================== FIX TBL_ASSESSMENTS RLS POLICY ====================
-- File: database/sql/migrations/fix_tbl_assessments_rls_policy.sql
-- Created: 2026-03-29
-- Purpose: Allow educator-owned assessment rows without requiring missing assessments permission records

DROP POLICY IF EXISTS "Educator assessment view access" ON public.tbl_assessments;
DROP POLICY IF EXISTS "Educator assessment create access" ON public.tbl_assessments;
DROP POLICY IF EXISTS "Educator assessment update access" ON public.tbl_assessments;
DROP POLICY IF EXISTS "Educator assessment delete access" ON public.tbl_assessments;

CREATE POLICY "Educator assessment view access" ON public.tbl_assessments
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
);

CREATE POLICY "Educator assessment create access" ON public.tbl_assessments
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
);

CREATE POLICY "Educator assessment update access" ON public.tbl_assessments
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
)
WITH CHECK (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
);

CREATE POLICY "Educator assessment delete access" ON public.tbl_assessments
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
);

