-- ==================== CREATE TBL_ENROLLED TABLE ====================
-- File: database/sql/tables/create_tbl_enrolled_table.sql
-- Created: 2026-03-29
-- Purpose: Create the educator student enrollment table with foreign keys and row level security.

CREATE SEQUENCE IF NOT EXISTS public.tbl_enrolled_id_seq;

CREATE TABLE IF NOT EXISTS public.tbl_enrolled (
  id bigint DEFAULT nextval('public.tbl_enrolled_id_seq'::regclass) NOT NULL,
  student_id bigint NOT NULL,
  educator_id bigint NOT NULL,
  subject_id bigint NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT tbl_enrolled_pkey PRIMARY KEY (id),
  CONSTRAINT tbl_enrolled_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.tbl_users(id) ON DELETE CASCADE,
  CONSTRAINT tbl_enrolled_educator_id_fkey FOREIGN KEY (educator_id) REFERENCES public.tbl_users(id) ON DELETE CASCADE,
  CONSTRAINT tbl_enrolled_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.tbl_subjects(id) ON DELETE CASCADE
);

ALTER TABLE public.tbl_enrolled ENABLE ROW LEVEL SECURITY;
