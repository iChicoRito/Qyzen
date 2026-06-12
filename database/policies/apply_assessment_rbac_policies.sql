-- ==================== APPLY ASSESSMENT RBAC POLICIES ====================
-- File: database/policies/apply_assessment_rbac_policies.sql
-- Created: 2026-03-29
-- Purpose: Enforce assessment access through educator ownership

-- ==================== TBL_ASSESSMENTS POLICIES ====================
DROP POLICY IF EXISTS "Educator assessment view access" ON public.tbl_assessments;
DROP POLICY IF EXISTS "Educator assessment create access" ON public.tbl_assessments;
DROP POLICY IF EXISTS "Educator assessment update access" ON public.tbl_assessments;
DROP POLICY IF EXISTS "Educator assessment delete access" ON public.tbl_assessments;
DROP POLICY IF EXISTS "Student assessment view access" ON public.tbl_assessments;

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

CREATE POLICY "Student assessment view access" ON public.tbl_assessments
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  public.has_role('student')
  AND EXISTS (
    SELECT 1
    FROM public.tbl_enrolled AS enrolled
    WHERE enrolled.student_id = public.get_current_tbl_user_id()
      AND enrolled.educator_id = public.tbl_assessments.educator_id
      AND enrolled.subject_id = public.tbl_assessments.subject_id
      AND enrolled.is_active = true
  )
);

