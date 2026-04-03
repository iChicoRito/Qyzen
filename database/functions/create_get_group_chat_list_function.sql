-- ==================== CREATE GET GROUP CHAT LIST FUNCTION ====================
-- File: database/functions/create_get_group_chat_list_function.sql
-- Created: 2026-04-03
-- Purpose: Return each authorized user's visible subject group chats with unread and online counts.

CREATE OR REPLACE FUNCTION public.get_group_chat_list()
RETURNS TABLE (
  group_chat_id BIGINT,
  subject_id BIGINT,
  section_id BIGINT,
  educator_id BIGINT,
  subject_name TEXT,
  section_name TEXT,
  student_count INTEGER,
  online_student_count INTEGER,
  last_message_preview TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_sender_user_id BIGINT,
  last_message_sender_display_name TEXT,
  unread_count INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH accessible_chats AS (
    SELECT
      chats.id,
      chats.subject_id,
      chats.section_id,
      chats.educator_id,
      chats.created_at,
      subjects.subject_name,
      sections.section_name
    FROM public.tbl_group_chats AS chats
    INNER JOIN public.tbl_subjects AS subjects
      ON subjects.id = chats.subject_id
    INNER JOIN public.tbl_sections AS sections
      ON sections.id = chats.section_id
    WHERE (
      (
        public.has_role('educator')
        AND chats.educator_id = public.get_current_tbl_user_id()
      )
      OR (
        public.has_role('student')
        AND EXISTS (
          SELECT 1
          FROM public.tbl_enrolled AS enrolled
          WHERE enrolled.educator_id = chats.educator_id
            AND enrolled.subject_id = chats.subject_id
            AND enrolled.student_id = public.get_current_tbl_user_id()
            AND enrolled.is_active = TRUE
        )
      )
    )
  ),
  active_counts AS (
    SELECT
      chats.id AS group_chat_id,
      COUNT(DISTINCT enrolled.student_id)::INT AS student_count
    FROM accessible_chats AS chats
    INNER JOIN public.tbl_enrolled AS enrolled
      ON enrolled.educator_id = chats.educator_id
     AND enrolled.subject_id = chats.subject_id
     AND enrolled.is_active = TRUE
    INNER JOIN public.tbl_users AS student_user
      ON student_user.id = enrolled.student_id
     AND student_user.user_type = 'student'
     AND student_user.is_active = TRUE
     AND student_user.deleted_at IS NULL
    GROUP BY chats.id
  ),
  online_counts AS (
    SELECT
      chats.id AS group_chat_id,
      COUNT(DISTINCT presence.student_id)::INT AS online_student_count
    FROM accessible_chats AS chats
    INNER JOIN public.tbl_enrolled AS enrolled
      ON enrolled.educator_id = chats.educator_id
     AND enrolled.subject_id = chats.subject_id
     AND enrolled.is_active = TRUE
    INNER JOIN public.tbl_users AS student_user
      ON student_user.id = enrolled.student_id
     AND student_user.user_type = 'student'
     AND student_user.is_active = TRUE
     AND student_user.deleted_at IS NULL
    INNER JOIN public.tbl_student_presence AS presence
      ON presence.student_id = enrolled.student_id
     AND presence.last_seen_at >= NOW() - INTERVAL '60 seconds'
    GROUP BY chats.id
  )
  SELECT
    chats.id AS group_chat_id,
    chats.subject_id,
    chats.section_id,
    chats.educator_id,
    chats.subject_name,
    chats.section_name,
    counts.student_count,
    COALESCE(online.online_student_count, 0) AS online_student_count,
    last_message.content AS last_message_preview,
    last_message.created_at AS last_message_at,
    last_message.sender_user_id AS last_message_sender_user_id,
    last_message.sender_display_name AS last_message_sender_display_name,
    COALESCE(unread.unread_count, 0) AS unread_count
  FROM accessible_chats AS chats
  INNER JOIN active_counts AS counts
    ON counts.group_chat_id = chats.id
  LEFT JOIN online_counts AS online
    ON online.group_chat_id = chats.id
  LEFT JOIN public.tbl_group_chat_reads AS reads
    ON reads.group_chat_id = chats.id
   AND reads.user_id = public.get_current_tbl_user_id()
  LEFT JOIN LATERAL (
    SELECT
      message.content,
      message.created_at,
      message.sender_user_id,
      TRIM(CONCAT(sender_user.given_name, ' ', sender_user.surname)) AS sender_display_name
    FROM public.tbl_group_chat_messages AS message
    INNER JOIN public.tbl_users AS sender_user
      ON sender_user.id = message.sender_user_id
     AND sender_user.deleted_at IS NULL
    WHERE message.group_chat_id = chats.id
    ORDER BY message.created_at DESC, message.id DESC
    LIMIT 1
  ) AS last_message ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::INT AS unread_count
    FROM public.tbl_group_chat_messages AS message
    WHERE message.group_chat_id = chats.id
      AND message.sender_user_id <> public.get_current_tbl_user_id()
      AND message.created_at > COALESCE(reads.last_read_at, 'epoch'::TIMESTAMPTZ)
  ) AS unread ON TRUE
  ORDER BY COALESCE(last_message.created_at, chats.created_at) DESC, chats.subject_name ASC;
$$;
