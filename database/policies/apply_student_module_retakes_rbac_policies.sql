-- ==================== APPLY TBL_STUDENT_MODULE_RETAKES POLICIES ====================
-- File: database/policies/apply_student_module_retakes_rbac_policies.sql
-- Created: 2026-04-01
-- Purpose: Restrict student retake grants to the owning educator and the matching student.

DROP POLICY IF EXISTS "Admin full access on tbl_student_module_retakes" ON public.tbl_student_module_retakes;
DROP POLICY IF EXISTS "Educator student retake view access" ON public.tbl_student_module_retakes;
DROP POLICY IF EXISTS "Educator student retake create access" ON public.tbl_student_module_retakes;
DROP POLICY IF EXISTS "Educator student retake update access" ON public.tbl_student_module_retakes;
DROP POLICY IF EXISTS "Educator student retake delete access" ON public.tbl_student_module_retakes;
DROP POLICY IF EXISTS "Student retake grant view access" ON public.tbl_student_module_retakes;

CREATE POLICY "Admin full access on tbl_student_module_retakes" ON public.tbl_student_module_retakes
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

CREATE POLICY "Educator student retake view access" ON public.tbl_student_module_retakes
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    public.has_role('educator')
    AND educator_id = public.get_current_tbl_user_id()
  );

CREATE POLICY "Educator student retake create access" ON public.tbl_student_module_retakes
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('educator')
    AND educator_id = public.get_current_tbl_user_id()
  );

CREATE POLICY "Educator student retake update access" ON public.tbl_student_module_retakes
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    public.has_role('educator')
    AND educator_id = public.get_current_tbl_user_id()
  )
  WITH CHECK (
    public.has_role('educator')
    AND educator_id = public.get_current_tbl_user_id()
  );

CREATE POLICY "Educator student retake delete access" ON public.tbl_student_module_retakes
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (
    public.has_role('educator')
    AND educator_id = public.get_current_tbl_user_id()
  );

CREATE POLICY "Student retake grant view access" ON public.tbl_student_module_retakes
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    public.has_role('student')
    AND student_id = public.get_current_tbl_user_id()
  );
