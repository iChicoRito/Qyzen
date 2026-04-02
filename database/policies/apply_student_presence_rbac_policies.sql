-- ==================== APPLY STUDENT PRESENCE RBAC POLICIES ====================
-- File: database/policies/apply_student_presence_rbac_policies.sql
-- Created: 2026-04-02
-- Purpose: Allow students to manage their own presence rows and educators to read enrolled student presence.

DROP POLICY IF EXISTS "Admin full access on tbl_student_presence" ON public.tbl_student_presence;
DROP POLICY IF EXISTS "Educator student presence view access" ON public.tbl_student_presence;
DROP POLICY IF EXISTS "Student own presence view access" ON public.tbl_student_presence;
DROP POLICY IF EXISTS "Student own presence create access" ON public.tbl_student_presence;
DROP POLICY IF EXISTS "Student own presence update access" ON public.tbl_student_presence;
DROP POLICY IF EXISTS "Student own presence delete access" ON public.tbl_student_presence;

CREATE POLICY "Admin full access on tbl_student_presence" ON public.tbl_student_presence
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  public.has_role('admin')
)
WITH CHECK (
  public.has_role('admin')
);

CREATE POLICY "Educator student presence view access" ON public.tbl_student_presence
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  public.has_role('educator')
  AND EXISTS (
    SELECT 1
    FROM public.tbl_enrolled AS enrolled
    WHERE enrolled.student_id = public.tbl_student_presence.student_id
      AND enrolled.educator_id = public.get_current_tbl_user_id()
      AND enrolled.is_active = true
  )
);

CREATE POLICY "Student own presence view access" ON public.tbl_student_presence
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  public.has_role('student')
  AND student_id = public.get_current_tbl_user_id()
);

CREATE POLICY "Student own presence create access" ON public.tbl_student_presence
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role('student')
  AND student_id = public.get_current_tbl_user_id()
);

CREATE POLICY "Student own presence update access" ON public.tbl_student_presence
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  public.has_role('student')
  AND student_id = public.get_current_tbl_user_id()
)
WITH CHECK (
  public.has_role('student')
  AND student_id = public.get_current_tbl_user_id()
);

CREATE POLICY "Student own presence delete access" ON public.tbl_student_presence
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  public.has_role('student')
  AND student_id = public.get_current_tbl_user_id()
);
