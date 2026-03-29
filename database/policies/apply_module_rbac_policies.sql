-- ==================== APPLY MODULE RBAC POLICIES ====================
-- File: database/policies/apply_module_rbac_policies.sql
-- Created: 2026-03-29
-- Purpose: Enforce module access through educator ownership

-- ==================== TBL_MODULES POLICIES ====================
DROP POLICY IF EXISTS "Educator module view access" ON public.tbl_modules;
DROP POLICY IF EXISTS "Educator module create access" ON public.tbl_modules;
DROP POLICY IF EXISTS "Educator module update access" ON public.tbl_modules;
DROP POLICY IF EXISTS "Educator module delete access" ON public.tbl_modules;

CREATE POLICY "Educator module view access" ON public.tbl_modules
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
);

CREATE POLICY "Educator module create access" ON public.tbl_modules
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
);

CREATE POLICY "Educator module update access" ON public.tbl_modules
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

CREATE POLICY "Educator module delete access" ON public.tbl_modules
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
);
