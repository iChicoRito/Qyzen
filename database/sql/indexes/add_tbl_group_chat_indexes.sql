-- ==================== ADD GROUP CHAT INDEXES ====================
-- File: database/sql/indexes/add_tbl_group_chat_indexes.sql
-- Created: 2026-04-03
-- Purpose: Speed up group chat list, message history, and unread badge lookups.

CREATE INDEX IF NOT EXISTS idx_tbl_group_chats_educator_id
  ON public.tbl_group_chats USING btree (educator_id);

CREATE INDEX IF NOT EXISTS idx_tbl_group_chats_subject_id
  ON public.tbl_group_chats USING btree (subject_id);

CREATE INDEX IF NOT EXISTS idx_tbl_group_chats_section_id
  ON public.tbl_group_chats USING btree (section_id);

CREATE INDEX IF NOT EXISTS idx_tbl_group_chat_messages_group_chat_created_at
  ON public.tbl_group_chat_messages USING btree (group_chat_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tbl_group_chat_messages_sender_user_id
  ON public.tbl_group_chat_messages USING btree (sender_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tbl_group_chat_reads_user_id
  ON public.tbl_group_chat_reads USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_tbl_group_chat_reads_group_chat_last_read_at
  ON public.tbl_group_chat_reads USING btree (group_chat_id, last_read_at DESC);
