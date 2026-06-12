-- ==================== ADD TERM COLUMN TO TBL_ASSESSMENTS ====================
-- File: database/sql/migrations/add_term_column_to_tbl_assessments.sql
-- Created: 2026-03-29
-- Purpose: Add selected academic term support to assessment rows

ALTER TABLE public.tbl_assessments
ADD COLUMN IF NOT EXISTS term BIGINT;

UPDATE public.tbl_assessments AS assessment
SET term = section.academic_term_id
FROM public.tbl_sections AS section
WHERE assessment.section_id = section.id
  AND assessment.term IS NULL;

ALTER TABLE public.tbl_assessments
ALTER COLUMN term SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tbl_assessments_term_fkey'
  ) THEN
    ALTER TABLE public.tbl_assessments
    ADD CONSTRAINT tbl_assessments_term_fkey
    FOREIGN KEY (term) REFERENCES public.tbl_academic_term(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tbl_assessments_term ON public.tbl_assessments(term);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tbl_assessments_unique_code_per_subject_section'
      AND conrelid = 'public.tbl_assessments'::regclass
  ) THEN
    ALTER TABLE public.tbl_assessments
    DROP CONSTRAINT tbl_assessments_unique_code_per_subject_section;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tbl_assessments_unique_code_per_subject_section_term'
      AND conrelid = 'public.tbl_assessments'::regclass
  ) THEN
    ALTER TABLE public.tbl_assessments
    ADD CONSTRAINT tbl_assessments_unique_code_per_subject_section_term
    UNIQUE (assessment_code, subject_id, section_id, term);
  END IF;
END $$;

