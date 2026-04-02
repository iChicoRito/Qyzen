-- ==================== ADD TBL_STUDENT_PRESENCE INDEXES ====================
-- File: database/sql/indexes/add_tbl_student_presence_indexes.sql
-- Created: 2026-04-02
-- Purpose: Add unique and lookup indexes for student presence heartbeats.

CREATE UNIQUE INDEX IF NOT EXISTS idx_tbl_student_presence_student_id
  ON public.tbl_student_presence(student_id);

CREATE INDEX IF NOT EXISTS idx_tbl_student_presence_last_seen_at
  ON public.tbl_student_presence(last_seen_at);
