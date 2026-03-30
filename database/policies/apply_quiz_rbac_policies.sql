-- ==================== APPLY QUIZ RBAC POLICIES ====================
-- File: database/policies/apply_quiz_rbac_policies.sql
-- Created: 2026-03-30
-- Purpose: Enforce quiz access through educator ownership

-- ==================== TBL_QUIZZES POLICIES ====================
DROP POLICY IF EXISTS "Educator quiz view access" ON public.tbl_quizzes;
DROP POLICY IF EXISTS "Educator quiz create access" ON public.tbl_quizzes;
DROP POLICY IF EXISTS "Educator quiz update access" ON public.tbl_quizzes;
DROP POLICY IF EXISTS "Educator quiz delete access" ON public.tbl_quizzes;
DROP POLICY IF EXISTS "Student quiz view access" ON public.tbl_quizzes;

CREATE POLICY "Educator quiz view access" ON public.tbl_quizzes
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
);

CREATE POLICY "Educator quiz create access" ON public.tbl_quizzes
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
);

CREATE POLICY "Educator quiz update access" ON public.tbl_quizzes
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

CREATE POLICY "Educator quiz delete access" ON public.tbl_quizzes
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
);

CREATE POLICY "Student quiz view access" ON public.tbl_quizzes
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  public.has_role('student')
  AND EXISTS (
    SELECT 1
    FROM public.tbl_enrolled AS enrolled
    WHERE enrolled.student_id = public.get_current_tbl_user_id()
      AND enrolled.educator_id = public.tbl_quizzes.educator_id
      AND enrolled.subject_id = public.tbl_quizzes.subject_id
      AND enrolled.is_active = true
  )
);
