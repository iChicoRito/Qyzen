-- ==================== CREATE GET GROUP CHAT MESSAGES FUNCTION ====================
-- File: database/functions/create_get_group_chat_messages_function.sql
-- Created: 2026-04-03
-- Purpose: Return authorized subject group chat messages with sender display names.

CREATE OR REPLACE FUNCTION public.get_group_chat_messages(target_group_chat_id BIGINT)
RETURNS TABLE (
  message_id BIGINT,
  group_chat_id BIGINT,
  sender_user_id BIGINT,
  sender_display_name TEXT,
  sender_role TEXT,
  content TEXT,
  created_at TIMESTAMPTZ,
  is_seen_by_other_participant BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH authorized_chat AS (
    SELECT
      chats.id,
      chats.educator_id,
      chats.subject_id
    FROM public.tbl_group_chats AS chats
    WHERE chats.id = target_group_chat_id
      AND (
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
  )
  SELECT
    message.id AS message_id,
    message.group_chat_id,
    message.sender_user_id,
    TRIM(CONCAT(sender_user.given_name, ' ', sender_user.surname)) AS sender_display_name,
    sender_user.user_type AS sender_role,
    message.content,
    message.created_at,
    EXISTS (
      SELECT 1
      FROM public.tbl_group_chat_reads AS reads
      WHERE reads.group_chat_id = message.group_chat_id
        AND reads.user_id <> message.sender_user_id
        AND reads.last_read_at >= message.created_at
        AND (
          reads.user_id = authorized_chat.educator_id
          OR EXISTS (
            SELECT 1
            FROM public.tbl_enrolled AS enrolled
            WHERE enrolled.educator_id = authorized_chat.educator_id
              AND enrolled.subject_id = authorized_chat.subject_id
              AND enrolled.student_id = reads.user_id
              AND enrolled.is_active = TRUE
          )
        )
    ) AS is_seen_by_other_participant
  FROM authorized_chat
  INNER JOIN public.tbl_group_chat_messages AS message
    ON message.group_chat_id = authorized_chat.id
  INNER JOIN public.tbl_users AS sender_user
    ON sender_user.id = message.sender_user_id
   AND sender_user.deleted_at IS NULL
  ORDER BY message.created_at ASC, message.id ASC;
$$;
