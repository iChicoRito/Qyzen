-- ==================== ALLOW EDUCATORS TO READ STUDENTS FOR ENROLLMENT ====================
-- File: database/policies/apply_enrollment_student_access_policy.sql
-- Created: 2026-03-29
-- Purpose: Allow authenticated educators to read student rows needed for enrollment selection.

CREATE POLICY "Educators can read students for enrollment" ON public.tbl_users AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    public.has_role('educator'::text)
    AND user_type = 'student'::text
    AND deleted_at IS NULL
  );
