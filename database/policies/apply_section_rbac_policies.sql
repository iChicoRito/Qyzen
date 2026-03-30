-- ==================== APPLY SECTION RBAC POLICIES ====================
-- File: sql/policies/apply_section_rbac_policies.sql
-- Created: 2026-03-29
-- Purpose: Enforces section and section term access through educator ownership plus rbac permissions

-- ==================== TBL_SECTIONS POLICIES ====================
DROP POLICY IF EXISTS "Educator own access on tbl_sections" ON public.tbl_sections;
DROP POLICY IF EXISTS "Educator section view access" ON public.tbl_sections;
DROP POLICY IF EXISTS "Educator section create access" ON public.tbl_sections;
DROP POLICY IF EXISTS "Educator section update access" ON public.tbl_sections;
DROP POLICY IF EXISTS "Educator section delete access" ON public.tbl_sections;
DROP POLICY IF EXISTS "Student section view access" ON public.tbl_sections;

CREATE POLICY "Educator section view access" ON public.tbl_sections
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
  AND public.user_has_permission('sections:view')
);

CREATE POLICY "Educator section create access" ON public.tbl_sections
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
  AND public.user_has_permission('sections:create')
);

CREATE POLICY "Educator section update access" ON public.tbl_sections
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
  AND public.user_has_permission('sections:update')
)
WITH CHECK (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
  AND public.user_has_permission('sections:update')
);

CREATE POLICY "Educator section delete access" ON public.tbl_sections
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
  AND public.user_has_permission('sections:delete')
);

CREATE POLICY "Student section view access" ON public.tbl_sections
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  public.has_role('student')
  AND EXISTS (
    SELECT 1
    FROM public.tbl_enrolled AS enrolled
    INNER JOIN public.tbl_subjects AS subject
      ON subject.id = enrolled.subject_id
    WHERE enrolled.student_id = public.get_current_tbl_user_id()
      AND enrolled.educator_id = public.tbl_sections.educator_id
      AND subject.sections_id = public.tbl_sections.id
      AND enrolled.is_active = true
  )
);

-- ==================== TBL_SECTIONS_TERM POLICIES ====================
DROP POLICY IF EXISTS "Educator own access on tbl_sections_term" ON public.tbl_sections_term;
DROP POLICY IF EXISTS "Educator section term view access" ON public.tbl_sections_term;
DROP POLICY IF EXISTS "Educator section term create access" ON public.tbl_sections_term;
DROP POLICY IF EXISTS "Educator section term update access" ON public.tbl_sections_term;
DROP POLICY IF EXISTS "Educator section term delete access" ON public.tbl_sections_term;

CREATE POLICY "Educator section term view access" ON public.tbl_sections_term
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  public.has_role('educator')
  AND public.user_has_permission('sections:view')
  AND EXISTS (
    SELECT 1
    FROM public.tbl_sections
    WHERE tbl_sections.id = tbl_sections_term.section_id
      AND tbl_sections.educator_id = public.get_current_tbl_user_id()
  )
);

CREATE POLICY "Educator section term create access" ON public.tbl_sections_term
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role('educator')
  AND public.user_has_permission('sections:create')
  AND EXISTS (
    SELECT 1
    FROM public.tbl_sections
    WHERE tbl_sections.id = tbl_sections_term.section_id
      AND tbl_sections.educator_id = public.get_current_tbl_user_id()
  )
);

CREATE POLICY "Educator section term update access" ON public.tbl_sections_term
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  public.has_role('educator')
  AND public.user_has_permission('sections:update')
  AND EXISTS (
    SELECT 1
    FROM public.tbl_sections
    WHERE tbl_sections.id = tbl_sections_term.section_id
      AND tbl_sections.educator_id = public.get_current_tbl_user_id()
  )
)
WITH CHECK (
  public.has_role('educator')
  AND public.user_has_permission('sections:update')
  AND EXISTS (
    SELECT 1
    FROM public.tbl_sections
    WHERE tbl_sections.id = tbl_sections_term.section_id
      AND tbl_sections.educator_id = public.get_current_tbl_user_id()
  )
);

CREATE POLICY "Educator section term delete access" ON public.tbl_sections_term
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  public.has_role('educator')
  AND public.user_has_permission('sections:delete')
  AND EXISTS (
    SELECT 1
    FROM public.tbl_sections
    WHERE tbl_sections.id = tbl_sections_term.section_id
      AND tbl_sections.educator_id = public.get_current_tbl_user_id()
  )
);
