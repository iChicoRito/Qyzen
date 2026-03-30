-- ==================== APPLY SCORES RBAC POLICIES ====================
-- File: database/policies/apply_scores_rbac_policies.sql
-- Created: 2026-03-30
-- Purpose: Allow students to manage their own quiz attempts and educators to review related scores.

DROP POLICY IF EXISTS "Admin full access on tbl_scores" ON public.tbl_scores;
DROP POLICY IF EXISTS "Educator score view access" ON public.tbl_scores;
DROP POLICY IF EXISTS "Student score view access" ON public.tbl_scores;
DROP POLICY IF EXISTS "Student score create access" ON public.tbl_scores;
DROP POLICY IF EXISTS "Student score update access" ON public.tbl_scores;

CREATE POLICY "Admin full access on tbl_scores" ON public.tbl_scores
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  public.has_role('admin')
)
WITH CHECK (
  public.has_role('admin')
);

CREATE POLICY "Educator score view access" ON public.tbl_scores
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
);

CREATE POLICY "Student score view access" ON public.tbl_scores
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  public.has_role('student')
  AND student_id = public.get_current_tbl_user_id()
);

CREATE POLICY "Student score create access" ON public.tbl_scores
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role('student')
  AND student_id = public.get_current_tbl_user_id()
  AND EXISTS (
    SELECT 1
    FROM public.tbl_enrolled AS enrolled
    WHERE enrolled.student_id = public.tbl_scores.student_id
      AND enrolled.educator_id = public.tbl_scores.educator_id
      AND enrolled.subject_id = public.tbl_scores.subject_id
      AND enrolled.is_active = true
  )
);

CREATE POLICY "Student score update access" ON public.tbl_scores
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
  AND EXISTS (
    SELECT 1
    FROM public.tbl_enrolled AS enrolled
    WHERE enrolled.student_id = public.tbl_scores.student_id
      AND enrolled.educator_id = public.tbl_scores.educator_id
      AND enrolled.subject_id = public.tbl_scores.subject_id
      AND enrolled.is_active = true
  )
);
