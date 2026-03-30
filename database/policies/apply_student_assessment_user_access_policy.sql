-- ==================== ALLOW STUDENTS TO READ ASSESSMENT EDUCATORS ====================
-- File: database/policies/apply_student_assessment_user_access_policy.sql
-- Created: 2026-03-30
-- Purpose: Allow students to read educator profiles linked to their active assessment enrollments.

DROP POLICY IF EXISTS "Students can read assessment educators" ON public.tbl_users;

CREATE POLICY "Students can read assessment educators" ON public.tbl_users
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  public.has_role('student'::text)
  AND user_type = 'educator'::text
  AND deleted_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.tbl_enrolled AS enrolled
    WHERE enrolled.student_id = public.get_current_tbl_user_id()
      AND enrolled.educator_id = public.tbl_users.id
      AND enrolled.is_active = true
  )
);
