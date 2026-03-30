-- ==================== APPLY SUBJECT RBAC POLICIES ====================
-- File: sql/policies/apply_subject_rbac_policies.sql
-- Created: 2026-03-29
-- Purpose: Enforces subject access through educator ownership plus rbac permissions

-- ==================== TBL_SUBJECTS POLICIES ====================
DROP POLICY IF EXISTS "Educator own access on tbl_subjects" ON public.tbl_subjects;
DROP POLICY IF EXISTS "Educator subject view access" ON public.tbl_subjects;
DROP POLICY IF EXISTS "Educator subject create access" ON public.tbl_subjects;
DROP POLICY IF EXISTS "Educator subject update access" ON public.tbl_subjects;
DROP POLICY IF EXISTS "Educator subject delete access" ON public.tbl_subjects;
DROP POLICY IF EXISTS "Student subject view access" ON public.tbl_subjects;

CREATE POLICY "Educator subject view access" ON public.tbl_subjects
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
  AND public.user_has_permission('subjects:view')
);

CREATE POLICY "Educator subject create access" ON public.tbl_subjects
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
  AND public.user_has_permission('subjects:create')
);

CREATE POLICY "Educator subject update access" ON public.tbl_subjects
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
  AND public.user_has_permission('subjects:update')
)
WITH CHECK (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
  AND public.user_has_permission('subjects:update')
);

CREATE POLICY "Educator subject delete access" ON public.tbl_subjects
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
  AND public.user_has_permission('subjects:delete')
);

CREATE POLICY "Student subject view access" ON public.tbl_subjects
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  public.has_role('student')
  AND EXISTS (
    SELECT 1
    FROM public.tbl_enrolled AS enrolled
    WHERE enrolled.student_id = public.get_current_tbl_user_id()
      AND enrolled.educator_id = public.tbl_subjects.educator_id
      AND enrolled.subject_id = public.tbl_subjects.id
      AND enrolled.is_active = true
  )
);
