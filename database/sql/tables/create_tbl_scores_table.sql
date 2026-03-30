-- ==================== CREATE TBL_SCORES TABLE ====================
-- File: database/sql/tables/create_tbl_scores_table.sql
-- Created: 2026-03-30
-- Purpose: Store student quiz attempts, draft answers, and final results.

CREATE SEQUENCE IF NOT EXISTS public.tbl_scores_id_seq;

CREATE TABLE IF NOT EXISTS public.tbl_scores (
  id bigint DEFAULT nextval('public.tbl_scores_id_seq'::regclass) NOT NULL,
  student_id bigint NOT NULL,
  educator_id bigint NOT NULL,
  module_id bigint NOT NULL,
  subject_id bigint NOT NULL,
  section_id bigint NOT NULL,
  score integer,
  total_questions integer DEFAULT 0 NOT NULL,
  student_answer jsonb DEFAULT '{}'::jsonb NOT NULL,
  warning_attempts integer DEFAULT 0 NOT NULL,
  status text DEFAULT 'in_progress' NOT NULL,
  is_passed boolean DEFAULT false NOT NULL,
  taken_at timestamp with time zone DEFAULT now() NOT NULL,
  submitted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT tbl_scores_pkey PRIMARY KEY (id),
  CONSTRAINT tbl_scores_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.tbl_users(id) ON DELETE CASCADE,
  CONSTRAINT tbl_scores_educator_id_fkey FOREIGN KEY (educator_id) REFERENCES public.tbl_users(id) ON DELETE CASCADE,
  CONSTRAINT tbl_scores_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.tbl_modules(id) ON DELETE CASCADE,
  CONSTRAINT tbl_scores_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.tbl_subjects(id) ON DELETE CASCADE,
  CONSTRAINT tbl_scores_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.tbl_sections(id) ON DELETE CASCADE,
  CONSTRAINT tbl_scores_status_check CHECK (status IN ('in_progress', 'submitted', 'passed', 'failed'))
);

ALTER TABLE public.tbl_scores ENABLE ROW LEVEL SECURITY;
