-- ==================== ADD TERM COLUMN TO TBL_MODULES ====================
-- File: database/sql/migrations/add_term_column_to_tbl_modules.sql
-- Created: 2026-03-29
-- Purpose: Add selected academic term support to module rows

ALTER TABLE public.tbl_modules
ADD COLUMN IF NOT EXISTS term BIGINT;

UPDATE public.tbl_modules AS module
SET term = section.academic_term_id
FROM public.tbl_sections AS section
WHERE module.section_id = section.id
  AND module.term IS NULL;

ALTER TABLE public.tbl_modules
ALTER COLUMN term SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tbl_modules_term_fkey'
  ) THEN
    ALTER TABLE public.tbl_modules
    ADD CONSTRAINT tbl_modules_term_fkey
    FOREIGN KEY (term) REFERENCES public.tbl_academic_term(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tbl_modules_term ON public.tbl_modules(term);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tbl_modules_unique_code_per_subject_section'
      AND conrelid = 'public.tbl_modules'::regclass
  ) THEN
    ALTER TABLE public.tbl_modules
    DROP CONSTRAINT tbl_modules_unique_code_per_subject_section;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tbl_modules_unique_code_per_subject_section_term'
      AND conrelid = 'public.tbl_modules'::regclass
  ) THEN
    ALTER TABLE public.tbl_modules
    ADD CONSTRAINT tbl_modules_unique_code_per_subject_section_term
    UNIQUE (module_code, subject_id, section_id, term);
  END IF;
END $$;
