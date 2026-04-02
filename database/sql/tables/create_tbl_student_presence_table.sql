-- ==================== CREATE TBL_STUDENT_PRESENCE TABLE ====================
-- File: database/sql/tables/create_tbl_student_presence_table.sql
-- Created: 2026-04-02
-- Purpose: Store one live heartbeat row per student for educator real-time monitoring.

CREATE SEQUENCE IF NOT EXISTS public.tbl_student_presence_id_seq;

CREATE TABLE IF NOT EXISTS public.tbl_student_presence (
  id bigint DEFAULT nextval('public.tbl_student_presence_id_seq'::regclass) NOT NULL,
  student_id bigint NOT NULL,
  last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
  current_path text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT tbl_student_presence_pkey PRIMARY KEY (id),
  CONSTRAINT tbl_student_presence_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.tbl_users(id) ON DELETE CASCADE
);

ALTER TABLE public.tbl_student_presence ENABLE ROW LEVEL SECURITY;
