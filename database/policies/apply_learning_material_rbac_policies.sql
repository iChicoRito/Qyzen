-- ==================== APPLY LEARNING MATERIAL RBAC POLICIES ====================
-- File: database/policies/apply_learning_material_rbac_policies.sql
-- Created: 2026-04-07
-- Purpose: Enforce educator ownership and enrolled student access for learning materials.

DROP POLICY IF EXISTS "Educator learning material view access" ON public.tbl_learning_materials;
DROP POLICY IF EXISTS "Educator learning material create access" ON public.tbl_learning_materials;
DROP POLICY IF EXISTS "Educator learning material update access" ON public.tbl_learning_materials;
DROP POLICY IF EXISTS "Educator learning material delete access" ON public.tbl_learning_materials;
DROP POLICY IF EXISTS "Student learning material view access" ON public.tbl_learning_materials;

CREATE POLICY "Educator learning material view access" ON public.tbl_learning_materials
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
);

CREATE POLICY "Educator learning material create access" ON public.tbl_learning_materials
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
);

CREATE POLICY "Educator learning material update access" ON public.tbl_learning_materials
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

CREATE POLICY "Educator learning material delete access" ON public.tbl_learning_materials
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  public.has_role('educator')
  AND educator_id = public.get_current_tbl_user_id()
);

CREATE POLICY "Student learning material view access" ON public.tbl_learning_materials
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  public.has_role('student')
  AND is_active = true
  AND EXISTS (
    SELECT 1
    FROM public.tbl_enrolled AS enrolled
    WHERE enrolled.student_id = public.get_current_tbl_user_id()
      AND enrolled.educator_id = public.tbl_learning_materials.educator_id
      AND enrolled.subject_id = public.tbl_learning_materials.subject_id
      AND enrolled.is_active = true
  )
);
