-- ==================== APPLY NOTIFICATION RBAC POLICIES ====================
-- File: database/policies/apply_notifications_rbac_policies.sql
-- Created: 2026-04-03
-- Purpose: Restrict notification access to recipients, educators, and student quiz submitters.

DROP POLICY IF EXISTS "Admin full access on tbl_notifications" ON public.tbl_notifications;
DROP POLICY IF EXISTS "Recipients can view own notifications" ON public.tbl_notifications;
DROP POLICY IF EXISTS "Recipients can update own notifications" ON public.tbl_notifications;
DROP POLICY IF EXISTS "Educator notification insert access" ON public.tbl_notifications;
DROP POLICY IF EXISTS "Student submission notification insert access" ON public.tbl_notifications;

CREATE POLICY "Admin full access on tbl_notifications" ON public.tbl_notifications
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

CREATE POLICY "Recipients can view own notifications" ON public.tbl_notifications
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (recipient_user_id = public.get_current_tbl_user_id());

CREATE POLICY "Recipients can update own notifications" ON public.tbl_notifications
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (recipient_user_id = public.get_current_tbl_user_id())
  WITH CHECK (recipient_user_id = public.get_current_tbl_user_id());

CREATE POLICY "Educator notification insert access" ON public.tbl_notifications
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('educator')
    AND actor_user_id = public.get_current_tbl_user_id()
    AND event_type = ANY (
      ARRAY[
        'module_created'::TEXT,
        'module_updated'::TEXT,
        'module_deleted'::TEXT,
        'quiz_created'::TEXT,
        'quiz_uploaded'::TEXT,
        'quiz_updated'::TEXT,
        'quiz_deleted'::TEXT,
        'enrollment_created'::TEXT,
        'enrollment_updated'::TEXT,
        'enrollment_deleted'::TEXT,
        'retake_updated'::TEXT
      ]
    )
    AND EXISTS (
      SELECT 1
      FROM public.tbl_users AS student_user
      WHERE student_user.id = public.tbl_notifications.recipient_user_id
        AND student_user.user_type = 'student'
        AND student_user.deleted_at IS NULL
    )
    AND (
      (
        event_type = 'enrollment_deleted'
        AND EXISTS (
          SELECT 1
          FROM public.tbl_subjects AS subject_row
          WHERE subject_row.id = public.tbl_notifications.subject_id
            AND subject_row.educator_id = public.get_current_tbl_user_id()
        )
      )
      OR (
        event_type <> 'enrollment_deleted'
        AND EXISTS (
          SELECT 1
          FROM public.tbl_enrolled AS enrolled
          WHERE enrolled.educator_id = public.get_current_tbl_user_id()
            AND enrolled.student_id = public.tbl_notifications.recipient_user_id
            AND enrolled.subject_id = public.tbl_notifications.subject_id
        )
      )
    )
  );

CREATE POLICY "Student submission notification insert access" ON public.tbl_notifications
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('student')
    AND actor_user_id = public.get_current_tbl_user_id()
    AND event_type = 'quiz_submitted'
    AND EXISTS (
      SELECT 1
      FROM public.tbl_modules AS module_row
      JOIN public.tbl_enrolled AS enrolled
        ON enrolled.educator_id = module_row.educator_id
       AND enrolled.subject_id = module_row.subject_id
      WHERE module_row.id = public.tbl_notifications.module_id
        AND module_row.educator_id = public.tbl_notifications.recipient_user_id
        AND enrolled.student_id = public.get_current_tbl_user_id()
        AND enrolled.is_active = true
    )
  );
