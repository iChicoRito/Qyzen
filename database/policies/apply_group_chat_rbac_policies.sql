-- ==================== APPLY GROUP CHAT RBAC POLICIES ====================
-- File: database/policies/apply_group_chat_rbac_policies.sql
-- Created: 2026-04-03
-- Purpose: Restrict group chats, group chat messages, and read-state access to valid classroom members.

DROP POLICY IF EXISTS "Admin full access on tbl_group_chats" ON public.tbl_group_chats;
DROP POLICY IF EXISTS "Educator group chat view access" ON public.tbl_group_chats;
DROP POLICY IF EXISTS "Educator group chat create access" ON public.tbl_group_chats;
DROP POLICY IF EXISTS "Educator group chat delete access" ON public.tbl_group_chats;
DROP POLICY IF EXISTS "Student group chat view access" ON public.tbl_group_chats;

DROP POLICY IF EXISTS "Admin full access on tbl_group_chat_messages" ON public.tbl_group_chat_messages;
DROP POLICY IF EXISTS "Educator group chat message view access" ON public.tbl_group_chat_messages;
DROP POLICY IF EXISTS "Student group chat message view access" ON public.tbl_group_chat_messages;
DROP POLICY IF EXISTS "Educator group chat message create access" ON public.tbl_group_chat_messages;
DROP POLICY IF EXISTS "Student group chat message create access" ON public.tbl_group_chat_messages;

DROP POLICY IF EXISTS "Admin full access on tbl_group_chat_reads" ON public.tbl_group_chat_reads;
DROP POLICY IF EXISTS "Educator group chat read view access" ON public.tbl_group_chat_reads;
DROP POLICY IF EXISTS "Student group chat read view access" ON public.tbl_group_chat_reads;
DROP POLICY IF EXISTS "Educator own group chat read create access" ON public.tbl_group_chat_reads;
DROP POLICY IF EXISTS "Student own group chat read create access" ON public.tbl_group_chat_reads;
DROP POLICY IF EXISTS "Educator own group chat read update access" ON public.tbl_group_chat_reads;
DROP POLICY IF EXISTS "Student own group chat read update access" ON public.tbl_group_chat_reads;

CREATE POLICY "Admin full access on tbl_group_chats" ON public.tbl_group_chats
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

CREATE POLICY "Educator group chat view access" ON public.tbl_group_chats
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    public.has_role('educator')
    AND educator_id = public.get_current_tbl_user_id()
  );

CREATE POLICY "Educator group chat create access" ON public.tbl_group_chats
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('educator')
    AND educator_id = public.get_current_tbl_user_id()
    AND EXISTS (
      SELECT 1
      FROM public.tbl_subjects AS subject_row
      WHERE subject_row.id = public.tbl_group_chats.subject_id
        AND subject_row.educator_id = public.get_current_tbl_user_id()
        AND subject_row.sections_id = public.tbl_group_chats.section_id
    )
  );

CREATE POLICY "Educator group chat delete access" ON public.tbl_group_chats
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (
    public.has_role('educator')
    AND educator_id = public.get_current_tbl_user_id()
  );

CREATE POLICY "Student group chat view access" ON public.tbl_group_chats
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    public.has_role('student')
    AND EXISTS (
      SELECT 1
      FROM public.tbl_enrolled AS enrolled
      WHERE enrolled.educator_id = public.tbl_group_chats.educator_id
        AND enrolled.subject_id = public.tbl_group_chats.subject_id
        AND enrolled.student_id = public.get_current_tbl_user_id()
        AND enrolled.is_active = TRUE
    )
  );

CREATE POLICY "Admin full access on tbl_group_chat_messages" ON public.tbl_group_chat_messages
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

CREATE POLICY "Educator group chat message view access" ON public.tbl_group_chat_messages
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    public.has_role('educator')
    AND EXISTS (
      SELECT 1
      FROM public.tbl_group_chats AS chats
      WHERE chats.id = public.tbl_group_chat_messages.group_chat_id
        AND chats.educator_id = public.get_current_tbl_user_id()
    )
  );

CREATE POLICY "Student group chat message view access" ON public.tbl_group_chat_messages
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    public.has_role('student')
    AND EXISTS (
      SELECT 1
      FROM public.tbl_group_chats AS chats
      INNER JOIN public.tbl_enrolled AS enrolled
        ON enrolled.educator_id = chats.educator_id
       AND enrolled.subject_id = chats.subject_id
      WHERE chats.id = public.tbl_group_chat_messages.group_chat_id
        AND enrolled.student_id = public.get_current_tbl_user_id()
        AND enrolled.is_active = TRUE
    )
  );

CREATE POLICY "Educator group chat message create access" ON public.tbl_group_chat_messages
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('educator')
    AND sender_user_id = public.get_current_tbl_user_id()
    AND EXISTS (
      SELECT 1
      FROM public.tbl_group_chats AS chats
      WHERE chats.id = public.tbl_group_chat_messages.group_chat_id
        AND chats.educator_id = public.get_current_tbl_user_id()
    )
  );

CREATE POLICY "Student group chat message create access" ON public.tbl_group_chat_messages
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('student')
    AND sender_user_id = public.get_current_tbl_user_id()
    AND EXISTS (
      SELECT 1
      FROM public.tbl_group_chats AS chats
      INNER JOIN public.tbl_enrolled AS enrolled
        ON enrolled.educator_id = chats.educator_id
       AND enrolled.subject_id = chats.subject_id
      WHERE chats.id = public.tbl_group_chat_messages.group_chat_id
        AND enrolled.student_id = public.get_current_tbl_user_id()
        AND enrolled.is_active = TRUE
    )
  );

CREATE POLICY "Admin full access on tbl_group_chat_reads" ON public.tbl_group_chat_reads
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

CREATE POLICY "Educator group chat read view access" ON public.tbl_group_chat_reads
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    public.has_role('educator')
    AND EXISTS (
      SELECT 1
      FROM public.tbl_group_chats AS chats
      WHERE chats.id = public.tbl_group_chat_reads.group_chat_id
        AND chats.educator_id = public.get_current_tbl_user_id()
    )
  );

CREATE POLICY "Student group chat read view access" ON public.tbl_group_chat_reads
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    public.has_role('student')
    AND EXISTS (
      SELECT 1
      FROM public.tbl_group_chats AS chats
      INNER JOIN public.tbl_enrolled AS enrolled
        ON enrolled.educator_id = chats.educator_id
       AND enrolled.subject_id = chats.subject_id
      WHERE chats.id = public.tbl_group_chat_reads.group_chat_id
        AND enrolled.student_id = public.get_current_tbl_user_id()
        AND enrolled.is_active = TRUE
    )
  );

CREATE POLICY "Educator own group chat read create access" ON public.tbl_group_chat_reads
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('educator')
    AND user_id = public.get_current_tbl_user_id()
    AND EXISTS (
      SELECT 1
      FROM public.tbl_group_chats AS chats
      WHERE chats.id = public.tbl_group_chat_reads.group_chat_id
        AND chats.educator_id = public.get_current_tbl_user_id()
    )
  );

CREATE POLICY "Student own group chat read create access" ON public.tbl_group_chat_reads
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('student')
    AND user_id = public.get_current_tbl_user_id()
    AND EXISTS (
      SELECT 1
      FROM public.tbl_group_chats AS chats
      INNER JOIN public.tbl_enrolled AS enrolled
        ON enrolled.educator_id = chats.educator_id
       AND enrolled.subject_id = chats.subject_id
      WHERE chats.id = public.tbl_group_chat_reads.group_chat_id
        AND enrolled.student_id = public.get_current_tbl_user_id()
        AND enrolled.is_active = TRUE
    )
  );

CREATE POLICY "Educator own group chat read update access" ON public.tbl_group_chat_reads
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    public.has_role('educator')
    AND user_id = public.get_current_tbl_user_id()
    AND EXISTS (
      SELECT 1
      FROM public.tbl_group_chats AS chats
      WHERE chats.id = public.tbl_group_chat_reads.group_chat_id
        AND chats.educator_id = public.get_current_tbl_user_id()
    )
  )
  WITH CHECK (
    public.has_role('educator')
    AND user_id = public.get_current_tbl_user_id()
    AND EXISTS (
      SELECT 1
      FROM public.tbl_group_chats AS chats
      WHERE chats.id = public.tbl_group_chat_reads.group_chat_id
        AND chats.educator_id = public.get_current_tbl_user_id()
    )
  );

CREATE POLICY "Student own group chat read update access" ON public.tbl_group_chat_reads
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    public.has_role('student')
    AND user_id = public.get_current_tbl_user_id()
    AND EXISTS (
      SELECT 1
      FROM public.tbl_group_chats AS chats
      INNER JOIN public.tbl_enrolled AS enrolled
        ON enrolled.educator_id = chats.educator_id
       AND enrolled.subject_id = chats.subject_id
      WHERE chats.id = public.tbl_group_chat_reads.group_chat_id
        AND enrolled.student_id = public.get_current_tbl_user_id()
        AND enrolled.is_active = TRUE
    )
  )
  WITH CHECK (
    public.has_role('student')
    AND user_id = public.get_current_tbl_user_id()
    AND EXISTS (
      SELECT 1
      FROM public.tbl_group_chats AS chats
      INNER JOIN public.tbl_enrolled AS enrolled
        ON enrolled.educator_id = chats.educator_id
       AND enrolled.subject_id = chats.subject_id
      WHERE chats.id = public.tbl_group_chat_reads.group_chat_id
        AND enrolled.student_id = public.get_current_tbl_user_id()
        AND enrolled.is_active = TRUE
    )
  );
