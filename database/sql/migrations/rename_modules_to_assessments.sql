-- ==================== RENAME MODULES TO ASSESSMENTS ====================
-- File: database/sql/migrations/rename_modules_to_assessments.sql
-- Created: 2026-06-12
-- Purpose: Idempotently rename assessment-domain module objects, data, policies, and realtime references.

BEGIN;

-- ==================== TABLES AND SEQUENCES ====================
DO $$
BEGIN
  IF to_regclass('public.tbl_assessments') IS NULL AND to_regclass('public.tbl_modules') IS NOT NULL THEN
    ALTER TABLE public.tbl_modules RENAME TO tbl_assessments;
  END IF;

  IF to_regclass('public.tbl_student_assessment_retakes') IS NULL
     AND to_regclass('public.tbl_student_module_retakes') IS NOT NULL THEN
    ALTER TABLE public.tbl_student_module_retakes RENAME TO tbl_student_assessment_retakes;
  END IF;

  IF to_regclass('public.tbl_assessments_id_seq') IS NULL
     AND to_regclass('public.tbl_modules_id_seq') IS NOT NULL THEN
    ALTER SEQUENCE public.tbl_modules_id_seq RENAME TO tbl_assessments_id_seq;
  END IF;

  IF to_regclass('public.tbl_student_assessment_retakes_id_seq') IS NULL
     AND to_regclass('public.tbl_student_module_retakes_id_seq') IS NOT NULL THEN
    ALTER SEQUENCE public.tbl_student_module_retakes_id_seq RENAME TO tbl_student_assessment_retakes_id_seq;
  END IF;
END $$;

-- ==================== COLUMNS ====================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tbl_assessments'
      AND column_name = 'module_code'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tbl_assessments'
      AND column_name = 'assessment_code'
  ) THEN
    ALTER TABLE public.tbl_assessments RENAME COLUMN module_code TO assessment_code;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tbl_notifications'
      AND column_name = 'module_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tbl_notifications'
      AND column_name = 'assessment_id'
  ) THEN
    ALTER TABLE public.tbl_notifications RENAME COLUMN module_id TO assessment_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tbl_quizzes'
      AND column_name = 'module_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tbl_quizzes'
      AND column_name = 'assessment_id'
  ) THEN
    ALTER TABLE public.tbl_quizzes RENAME COLUMN module_id TO assessment_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tbl_scores'
      AND column_name = 'module_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tbl_scores'
      AND column_name = 'assessment_id'
  ) THEN
    ALTER TABLE public.tbl_scores RENAME COLUMN module_id TO assessment_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tbl_student_assessment_retakes'
      AND column_name = 'module_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tbl_student_assessment_retakes'
      AND column_name = 'assessment_id'
  ) THEN
    ALTER TABLE public.tbl_student_assessment_retakes RENAME COLUMN module_id TO assessment_id;
  END IF;
END $$;

-- ==================== SEQUENCE OWNERSHIP AND DEFAULTS ====================
DO $$
BEGIN
  IF to_regclass('public.tbl_assessments') IS NOT NULL
     AND to_regclass('public.tbl_assessments_id_seq') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'tbl_assessments'
        AND column_name = 'id'
        AND is_identity = 'NO'
    ) THEN
      ALTER TABLE public.tbl_assessments
        ALTER COLUMN id SET DEFAULT nextval('public.tbl_assessments_id_seq'::regclass);
    END IF;
  END IF;

  IF to_regclass('public.tbl_student_assessment_retakes') IS NOT NULL
     AND to_regclass('public.tbl_student_assessment_retakes_id_seq') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'tbl_student_assessment_retakes'
        AND column_name = 'id'
        AND is_identity = 'NO'
    ) THEN
      ALTER TABLE public.tbl_student_assessment_retakes
        ALTER COLUMN id SET DEFAULT nextval('public.tbl_student_assessment_retakes_id_seq'::regclass);
    END IF;
  END IF;
END $$;

-- ==================== PERMISSIONS DATA ====================
UPDATE public.tbl_permissions
SET
  resource = 'assessments',
  module = 'Assessments'
WHERE resource = 'modules';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tbl_permissions'
      AND column_name = 'permission_string'
      AND is_generated = 'NEVER'
  ) THEN
    UPDATE public.tbl_permissions
    SET permission_string = resource || ':' || action
    WHERE resource = 'assessments'
      AND action IN ('view', 'create', 'update', 'delete');
  END IF;
END $$;

-- ==================== NOTIFICATION EVENTS AND METADATA ====================
ALTER TABLE public.tbl_notifications
  DROP CONSTRAINT IF EXISTS tbl_notifications_event_type_check;

UPDATE public.tbl_notifications
SET
  event_type = CASE event_type
    WHEN 'module_created' THEN 'assessment_created'
    WHEN 'module_updated' THEN 'assessment_updated'
    WHEN 'module_deleted' THEN 'assessment_deleted'
    ELSE event_type
  END,
  title = CASE event_type
    WHEN 'module_created' THEN 'New assessment available'
    WHEN 'module_updated' THEN 'Assessment updated'
    WHEN 'module_deleted' THEN 'Assessment removed'
    ELSE title
  END,
  message = regexp_replace(
    regexp_replace(message, '\mModule\M', 'Assessment', 'g'),
    '\mmodule\M',
    'assessment',
    'g'
  ),
  metadata = CASE
    WHEN metadata ? 'moduleCode' THEN
      (metadata - 'moduleCode')
      || jsonb_build_object(
        'assessmentCode',
        COALESCE(metadata -> 'assessmentCode', metadata -> 'moduleCode')
      )
    ELSE metadata
  END
WHERE event_type IN ('module_created', 'module_updated', 'module_deleted')
   OR title IN ('New module available', 'Module updated', 'Module removed')
   OR message ~* '\mmodule\M'
   OR metadata ? 'moduleCode';

ALTER TABLE public.tbl_notifications
  ADD CONSTRAINT tbl_notifications_event_type_check
  CHECK (
    event_type = ANY (
      ARRAY[
        'assessment_created'::text,
        'assessment_updated'::text,
        'assessment_deleted'::text,
        'learning_material_uploaded'::text,
        'learning_material_deleted'::text,
        'quiz_created'::text,
        'quiz_uploaded'::text,
        'quiz_updated'::text,
        'quiz_deleted'::text,
        'enrollment_created'::text,
        'enrollment_updated'::text,
        'enrollment_deleted'::text,
        'retake_updated'::text,
        'quiz_submitted'::text
      ]
    )
  );

-- ==================== CONSTRAINT NAMES ====================
DO $$
BEGIN
  IF to_regclass('public.tbl_assessments') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.tbl_assessments'::regclass
        AND conname = 'tbl_assessments_pkey'
    ) THEN
      IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.tbl_assessments'::regclass
          AND conname = 'tbl_modules_pkey'
      ) THEN
        ALTER TABLE public.tbl_assessments
          RENAME CONSTRAINT tbl_modules_pkey TO tbl_assessments_pkey;
      ELSE
        ALTER TABLE public.tbl_assessments
          ADD CONSTRAINT tbl_assessments_pkey PRIMARY KEY (id);
      END IF;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.tbl_assessments'::regclass
        AND conname = 'tbl_assessments_unique_code_per_subject_section_term'
    ) THEN
      IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.tbl_assessments'::regclass
          AND conname = 'tbl_modules_unique_code_per_subject_section_term'
      ) THEN
        ALTER TABLE public.tbl_assessments
          RENAME CONSTRAINT tbl_modules_unique_code_per_subject_section_term
          TO tbl_assessments_unique_code_per_subject_section_term;
      ELSE
        ALTER TABLE public.tbl_assessments
          ADD CONSTRAINT tbl_assessments_unique_code_per_subject_section_term
          UNIQUE (assessment_code, subject_id, section_id, term);
      END IF;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.tbl_assessments'::regclass
        AND conname = 'tbl_assessments_educator_id_fkey'
    ) THEN
      IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.tbl_assessments'::regclass
          AND conname = 'tbl_modules_educator_id_fkey'
      ) THEN
        ALTER TABLE public.tbl_assessments
          RENAME CONSTRAINT tbl_modules_educator_id_fkey TO tbl_assessments_educator_id_fkey;
      ELSE
        ALTER TABLE public.tbl_assessments
          ADD CONSTRAINT tbl_assessments_educator_id_fkey
          FOREIGN KEY (educator_id) REFERENCES public.tbl_users(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.tbl_assessments'::regclass
        AND conname = 'tbl_assessments_subject_id_fkey'
    ) THEN
      IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.tbl_assessments'::regclass
          AND conname = 'tbl_modules_subject_id_fkey'
      ) THEN
        ALTER TABLE public.tbl_assessments
          RENAME CONSTRAINT tbl_modules_subject_id_fkey TO tbl_assessments_subject_id_fkey;
      ELSE
        ALTER TABLE public.tbl_assessments
          ADD CONSTRAINT tbl_assessments_subject_id_fkey
          FOREIGN KEY (subject_id) REFERENCES public.tbl_subjects(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.tbl_assessments'::regclass
        AND conname = 'tbl_assessments_section_id_fkey'
    ) THEN
      IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.tbl_assessments'::regclass
          AND conname = 'tbl_modules_section_id_fkey'
      ) THEN
        ALTER TABLE public.tbl_assessments
          RENAME CONSTRAINT tbl_modules_section_id_fkey TO tbl_assessments_section_id_fkey;
      ELSE
        ALTER TABLE public.tbl_assessments
          ADD CONSTRAINT tbl_assessments_section_id_fkey
          FOREIGN KEY (section_id) REFERENCES public.tbl_sections(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.tbl_assessments'::regclass
        AND conname = 'tbl_assessments_term_fkey'
    ) THEN
      IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.tbl_assessments'::regclass
          AND conname = 'tbl_modules_term_fkey'
      ) THEN
        ALTER TABLE public.tbl_assessments
          RENAME CONSTRAINT tbl_modules_term_fkey TO tbl_assessments_term_fkey;
      ELSE
        ALTER TABLE public.tbl_assessments
          ADD CONSTRAINT tbl_assessments_term_fkey
          FOREIGN KEY (term) REFERENCES public.tbl_academic_term(id) ON DELETE CASCADE;
      END IF;
    END IF;
  END IF;

  IF to_regclass('public.tbl_notifications') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'tbl_notifications'
         AND column_name = 'assessment_id'
     )
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conrelid = 'public.tbl_notifications'::regclass
         AND conname = 'tbl_notifications_assessment_id_fkey'
     ) THEN
    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.tbl_notifications'::regclass
        AND conname = 'tbl_notifications_module_id_fkey'
    ) THEN
      ALTER TABLE public.tbl_notifications
        RENAME CONSTRAINT tbl_notifications_module_id_fkey TO tbl_notifications_assessment_id_fkey;
    ELSE
      ALTER TABLE public.tbl_notifications
        ADD CONSTRAINT tbl_notifications_assessment_id_fkey
        FOREIGN KEY (assessment_id) REFERENCES public.tbl_assessments(id) ON DELETE SET NULL;
    END IF;
  END IF;

  IF to_regclass('public.tbl_quizzes') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'tbl_quizzes'
         AND column_name = 'assessment_id'
     )
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conrelid = 'public.tbl_quizzes'::regclass
         AND conname = 'tbl_quizzes_assessment_id_fkey'
     ) THEN
    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.tbl_quizzes'::regclass
        AND conname = 'tbl_quizzes_module_id_fkey'
    ) THEN
      ALTER TABLE public.tbl_quizzes
        RENAME CONSTRAINT tbl_quizzes_module_id_fkey TO tbl_quizzes_assessment_id_fkey;
    ELSE
      ALTER TABLE public.tbl_quizzes
        ADD CONSTRAINT tbl_quizzes_assessment_id_fkey
        FOREIGN KEY (assessment_id) REFERENCES public.tbl_assessments(id) ON DELETE CASCADE;
    END IF;
  END IF;

  IF to_regclass('public.tbl_scores') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'tbl_scores'
         AND column_name = 'assessment_id'
     )
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conrelid = 'public.tbl_scores'::regclass
         AND conname = 'tbl_scores_assessment_id_fkey'
     ) THEN
    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.tbl_scores'::regclass
        AND conname = 'tbl_scores_module_id_fkey'
    ) THEN
      ALTER TABLE public.tbl_scores
        RENAME CONSTRAINT tbl_scores_module_id_fkey TO tbl_scores_assessment_id_fkey;
    ELSE
      ALTER TABLE public.tbl_scores
        ADD CONSTRAINT tbl_scores_assessment_id_fkey
        FOREIGN KEY (assessment_id) REFERENCES public.tbl_assessments(id) ON DELETE CASCADE;
    END IF;
  END IF;

  IF to_regclass('public.tbl_student_assessment_retakes') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.tbl_student_assessment_retakes'::regclass
        AND conname = 'tbl_student_assessment_retakes_pkey'
    ) THEN
      IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.tbl_student_assessment_retakes'::regclass
          AND conname = 'tbl_student_module_retakes_pkey'
      ) THEN
        ALTER TABLE public.tbl_student_assessment_retakes
          RENAME CONSTRAINT tbl_student_module_retakes_pkey TO tbl_student_assessment_retakes_pkey;
      ELSE
        ALTER TABLE public.tbl_student_assessment_retakes
          ADD CONSTRAINT tbl_student_assessment_retakes_pkey PRIMARY KEY (id);
      END IF;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.tbl_student_assessment_retakes'::regclass
        AND conname = 'tbl_student_assessment_retakes_educator_id_fkey'
    ) THEN
      IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.tbl_student_assessment_retakes'::regclass
          AND conname = 'tbl_student_module_retakes_educator_id_fkey'
      ) THEN
        ALTER TABLE public.tbl_student_assessment_retakes
          RENAME CONSTRAINT tbl_student_module_retakes_educator_id_fkey
          TO tbl_student_assessment_retakes_educator_id_fkey;
      ELSE
        ALTER TABLE public.tbl_student_assessment_retakes
          ADD CONSTRAINT tbl_student_assessment_retakes_educator_id_fkey
          FOREIGN KEY (educator_id) REFERENCES public.tbl_users(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.tbl_student_assessment_retakes'::regclass
        AND conname = 'tbl_student_assessment_retakes_student_id_fkey'
    ) THEN
      IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.tbl_student_assessment_retakes'::regclass
          AND conname = 'tbl_student_module_retakes_student_id_fkey'
      ) THEN
        ALTER TABLE public.tbl_student_assessment_retakes
          RENAME CONSTRAINT tbl_student_module_retakes_student_id_fkey
          TO tbl_student_assessment_retakes_student_id_fkey;
      ELSE
        ALTER TABLE public.tbl_student_assessment_retakes
          ADD CONSTRAINT tbl_student_assessment_retakes_student_id_fkey
          FOREIGN KEY (student_id) REFERENCES public.tbl_users(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.tbl_student_assessment_retakes'::regclass
        AND conname = 'tbl_student_assessment_retakes_assessment_id_fkey'
    ) THEN
      IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.tbl_student_assessment_retakes'::regclass
          AND conname = 'tbl_student_module_retakes_module_id_fkey'
      ) THEN
        ALTER TABLE public.tbl_student_assessment_retakes
          RENAME CONSTRAINT tbl_student_module_retakes_module_id_fkey
          TO tbl_student_assessment_retakes_assessment_id_fkey;
      ELSE
        ALTER TABLE public.tbl_student_assessment_retakes
          ADD CONSTRAINT tbl_student_assessment_retakes_assessment_id_fkey
          FOREIGN KEY (assessment_id) REFERENCES public.tbl_assessments(id) ON DELETE CASCADE;
      END IF;
    END IF;
  END IF;
END $$;

-- ==================== INDEX NAMES ====================
DO $$
BEGIN
  IF to_regclass('public.tbl_assessments') IS NOT NULL THEN
    IF to_regclass('public.idx_tbl_assessments_educator_id') IS NULL THEN
      IF to_regclass('public.idx_tbl_modules_educator_id') IS NOT NULL THEN
        ALTER INDEX public.idx_tbl_modules_educator_id RENAME TO idx_tbl_assessments_educator_id;
      ELSE
        CREATE INDEX idx_tbl_assessments_educator_id ON public.tbl_assessments (educator_id);
      END IF;
    END IF;

    IF to_regclass('public.idx_tbl_assessments_subject_id') IS NULL THEN
      IF to_regclass('public.idx_tbl_modules_subject_id') IS NOT NULL THEN
        ALTER INDEX public.idx_tbl_modules_subject_id RENAME TO idx_tbl_assessments_subject_id;
      ELSE
        CREATE INDEX idx_tbl_assessments_subject_id ON public.tbl_assessments (subject_id);
      END IF;
    END IF;

    IF to_regclass('public.idx_tbl_assessments_section_id') IS NULL THEN
      IF to_regclass('public.idx_tbl_modules_section_id') IS NOT NULL THEN
        ALTER INDEX public.idx_tbl_modules_section_id RENAME TO idx_tbl_assessments_section_id;
      ELSE
        CREATE INDEX idx_tbl_assessments_section_id ON public.tbl_assessments (section_id);
      END IF;
    END IF;

    IF to_regclass('public.idx_tbl_assessments_term') IS NULL THEN
      IF to_regclass('public.idx_tbl_modules_term') IS NOT NULL THEN
        ALTER INDEX public.idx_tbl_modules_term RENAME TO idx_tbl_assessments_term;
      ELSE
        CREATE INDEX idx_tbl_assessments_term ON public.tbl_assessments (term);
      END IF;
    END IF;

    IF to_regclass('public.idx_tbl_assessments_assessment_code') IS NULL THEN
      IF to_regclass('public.idx_tbl_modules_module_code') IS NOT NULL THEN
        ALTER INDEX public.idx_tbl_modules_module_code RENAME TO idx_tbl_assessments_assessment_code;
      ELSE
        CREATE INDEX idx_tbl_assessments_assessment_code ON public.tbl_assessments (assessment_code);
      END IF;
    END IF;

    IF to_regclass('public.idx_tbl_assessments_start_date') IS NULL THEN
      IF to_regclass('public.idx_tbl_modules_start_date') IS NOT NULL THEN
        ALTER INDEX public.idx_tbl_modules_start_date RENAME TO idx_tbl_assessments_start_date;
      ELSE
        CREATE INDEX idx_tbl_assessments_start_date ON public.tbl_assessments (start_date);
      END IF;
    END IF;
  END IF;

  IF to_regclass('public.tbl_notifications') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'tbl_notifications'
         AND column_name = 'assessment_id'
     )
     AND to_regclass('public.idx_tbl_notifications_assessment_id') IS NULL THEN
    IF to_regclass('public.idx_tbl_notifications_module_id') IS NOT NULL THEN
      ALTER INDEX public.idx_tbl_notifications_module_id RENAME TO idx_tbl_notifications_assessment_id;
    ELSE
      CREATE INDEX idx_tbl_notifications_assessment_id ON public.tbl_notifications (assessment_id);
    END IF;
  END IF;

  IF to_regclass('public.tbl_quizzes') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'tbl_quizzes'
         AND column_name = 'assessment_id'
     )
     AND to_regclass('public.idx_tbl_quizzes_assessment_id') IS NULL THEN
    IF to_regclass('public.idx_tbl_quizzes_module_id') IS NOT NULL THEN
      ALTER INDEX public.idx_tbl_quizzes_module_id RENAME TO idx_tbl_quizzes_assessment_id;
    ELSE
      CREATE INDEX idx_tbl_quizzes_assessment_id ON public.tbl_quizzes (assessment_id);
    END IF;
  END IF;

  IF to_regclass('public.tbl_scores') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'tbl_scores'
         AND column_name = 'assessment_id'
     ) THEN
    IF to_regclass('public.idx_tbl_scores_assessment_id') IS NULL THEN
      IF to_regclass('public.idx_tbl_scores_module_id') IS NOT NULL THEN
        ALTER INDEX public.idx_tbl_scores_module_id RENAME TO idx_tbl_scores_assessment_id;
      ELSE
        CREATE INDEX idx_tbl_scores_assessment_id ON public.tbl_scores (assessment_id);
      END IF;
    END IF;

    IF to_regclass('public.idx_tbl_scores_student_assessment') IS NULL THEN
      IF to_regclass('public.idx_tbl_scores_student_module') IS NOT NULL THEN
        ALTER INDEX public.idx_tbl_scores_student_module RENAME TO idx_tbl_scores_student_assessment;
      ELSE
        CREATE INDEX idx_tbl_scores_student_assessment ON public.tbl_scores (student_id, assessment_id);
      END IF;
    END IF;
  END IF;

  IF to_regclass('public.tbl_student_assessment_retakes') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'tbl_student_assessment_retakes'
         AND column_name = 'assessment_id'
     ) THEN
    IF to_regclass('public.idx_tbl_student_assessment_retakes_unique_pair') IS NULL THEN
      IF to_regclass('public.idx_tbl_student_module_retakes_unique_pair') IS NOT NULL THEN
        ALTER INDEX public.idx_tbl_student_module_retakes_unique_pair
          RENAME TO idx_tbl_student_assessment_retakes_unique_pair;
      ELSE
        CREATE UNIQUE INDEX idx_tbl_student_assessment_retakes_unique_pair
          ON public.tbl_student_assessment_retakes (educator_id, student_id, assessment_id);
      END IF;
    END IF;

    IF to_regclass('public.idx_tbl_student_assessment_retakes_student_assessment') IS NULL THEN
      IF to_regclass('public.idx_tbl_student_module_retakes_student_module') IS NOT NULL THEN
        ALTER INDEX public.idx_tbl_student_module_retakes_student_module
          RENAME TO idx_tbl_student_assessment_retakes_student_assessment;
      ELSE
        CREATE INDEX idx_tbl_student_assessment_retakes_student_assessment
          ON public.tbl_student_assessment_retakes (student_id, assessment_id);
      END IF;
    END IF;

    IF to_regclass('public.idx_tbl_student_assessment_retakes_educator_id') IS NULL THEN
      IF to_regclass('public.idx_tbl_student_module_retakes_educator_id') IS NOT NULL THEN
        ALTER INDEX public.idx_tbl_student_module_retakes_educator_id
          RENAME TO idx_tbl_student_assessment_retakes_educator_id;
      ELSE
        CREATE INDEX idx_tbl_student_assessment_retakes_educator_id
          ON public.tbl_student_assessment_retakes (educator_id);
      END IF;
    END IF;

    IF to_regclass('public.idx_tbl_student_assessment_retakes_assessment_id') IS NULL THEN
      IF to_regclass('public.idx_tbl_student_module_retakes_module_id') IS NOT NULL THEN
        ALTER INDEX public.idx_tbl_student_module_retakes_module_id
          RENAME TO idx_tbl_student_assessment_retakes_assessment_id;
      ELSE
        CREATE INDEX idx_tbl_student_assessment_retakes_assessment_id
          ON public.tbl_student_assessment_retakes (assessment_id);
      END IF;
    END IF;
  END IF;
END $$;

-- ==================== RLS POLICIES ====================
ALTER TABLE public.tbl_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_student_assessment_retakes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Educator module view access" ON public.tbl_assessments;
DROP POLICY IF EXISTS "Educator module create access" ON public.tbl_assessments;
DROP POLICY IF EXISTS "Educator module update access" ON public.tbl_assessments;
DROP POLICY IF EXISTS "Educator module delete access" ON public.tbl_assessments;
DROP POLICY IF EXISTS "Student module view access" ON public.tbl_assessments;
DROP POLICY IF EXISTS "Educator assessment view access" ON public.tbl_assessments;
DROP POLICY IF EXISTS "Educator assessment create access" ON public.tbl_assessments;
DROP POLICY IF EXISTS "Educator assessment update access" ON public.tbl_assessments;
DROP POLICY IF EXISTS "Educator assessment delete access" ON public.tbl_assessments;
DROP POLICY IF EXISTS "Student assessment view access" ON public.tbl_assessments;

CREATE POLICY "Educator assessment view access" ON public.tbl_assessments
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    public.has_role('educator')
    AND educator_id = public.get_current_tbl_user_id()
  );

CREATE POLICY "Educator assessment create access" ON public.tbl_assessments
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('educator')
    AND educator_id = public.get_current_tbl_user_id()
  );

CREATE POLICY "Educator assessment update access" ON public.tbl_assessments
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    public.has_role('educator')
    AND educator_id = public.get_current_tbl_user_id()
  )
  WITH CHECK (
    public.has_role('educator')
    AND educator_id = public.get_current_tbl_user_id()
  );

CREATE POLICY "Educator assessment delete access" ON public.tbl_assessments
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (
    public.has_role('educator')
    AND educator_id = public.get_current_tbl_user_id()
  );

CREATE POLICY "Student assessment view access" ON public.tbl_assessments
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    public.has_role('student')
    AND EXISTS (
      SELECT 1
      FROM public.tbl_enrolled AS enrolled
      WHERE enrolled.student_id = public.get_current_tbl_user_id()
        AND enrolled.educator_id = public.tbl_assessments.educator_id
        AND enrolled.subject_id = public.tbl_assessments.subject_id
        AND enrolled.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admin full access on tbl_student_module_retakes" ON public.tbl_student_assessment_retakes;
DROP POLICY IF EXISTS "Admin full access on tbl_student_assessment_retakes" ON public.tbl_student_assessment_retakes;
DROP POLICY IF EXISTS "Educator student retake view access" ON public.tbl_student_assessment_retakes;
DROP POLICY IF EXISTS "Educator student retake create access" ON public.tbl_student_assessment_retakes;
DROP POLICY IF EXISTS "Educator student retake update access" ON public.tbl_student_assessment_retakes;
DROP POLICY IF EXISTS "Educator student retake delete access" ON public.tbl_student_assessment_retakes;
DROP POLICY IF EXISTS "Student retake grant view access" ON public.tbl_student_assessment_retakes;

CREATE POLICY "Admin full access on tbl_student_assessment_retakes" ON public.tbl_student_assessment_retakes
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

CREATE POLICY "Educator student retake view access" ON public.tbl_student_assessment_retakes
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    public.has_role('educator')
    AND educator_id = public.get_current_tbl_user_id()
  );

CREATE POLICY "Educator student retake create access" ON public.tbl_student_assessment_retakes
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('educator')
    AND educator_id = public.get_current_tbl_user_id()
  );

CREATE POLICY "Educator student retake update access" ON public.tbl_student_assessment_retakes
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    public.has_role('educator')
    AND educator_id = public.get_current_tbl_user_id()
  )
  WITH CHECK (
    public.has_role('educator')
    AND educator_id = public.get_current_tbl_user_id()
  );

CREATE POLICY "Educator student retake delete access" ON public.tbl_student_assessment_retakes
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (
    public.has_role('educator')
    AND educator_id = public.get_current_tbl_user_id()
  );

CREATE POLICY "Student retake grant view access" ON public.tbl_student_assessment_retakes
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    public.has_role('student')
    AND student_id = public.get_current_tbl_user_id()
  );

DROP POLICY IF EXISTS "Educator notification insert access" ON public.tbl_notifications;
DROP POLICY IF EXISTS "Student submission notification insert access" ON public.tbl_notifications;

CREATE POLICY "Educator notification insert access" ON public.tbl_notifications
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('educator')
    AND actor_user_id = public.get_current_tbl_user_id()
    AND event_type = ANY (
      ARRAY[
        'assessment_created'::TEXT,
        'assessment_updated'::TEXT,
        'assessment_deleted'::TEXT,
        'learning_material_uploaded'::TEXT,
        'learning_material_deleted'::TEXT,
        'quiz_created'::TEXT,
        'quiz_uploaded'::TEXT,
        'quiz_updated'::TEXT,
        'quiz_deleted'::TEXT,
        'enrollment_created'::TEXT,
        'enrollment_updated'::TEXT,
        'enrollment_deleted'::TEXT,
        'retake_updated'::TEXT
      ]
    )
    AND EXISTS (
      SELECT 1
      FROM public.tbl_users AS student_user
      WHERE student_user.id = public.tbl_notifications.recipient_user_id
        AND student_user.user_type = 'student'
        AND student_user.deleted_at IS NULL
    )
    AND (
      (
        event_type = 'enrollment_deleted'
        AND EXISTS (
          SELECT 1
          FROM public.tbl_subjects AS subject_row
          WHERE subject_row.id = public.tbl_notifications.subject_id
            AND subject_row.educator_id = public.get_current_tbl_user_id()
        )
      )
      OR (
        event_type <> 'enrollment_deleted'
        AND EXISTS (
          SELECT 1
          FROM public.tbl_enrolled AS enrolled
          WHERE enrolled.educator_id = public.get_current_tbl_user_id()
            AND enrolled.student_id = public.tbl_notifications.recipient_user_id
            AND enrolled.subject_id = public.tbl_notifications.subject_id
        )
      )
    )
  );

CREATE POLICY "Student submission notification insert access" ON public.tbl_notifications
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('student')
    AND actor_user_id = public.get_current_tbl_user_id()
    AND event_type = 'quiz_submitted'
    AND EXISTS (
      SELECT 1
      FROM public.tbl_assessments AS assessment_row
      JOIN public.tbl_enrolled AS enrolled
        ON enrolled.educator_id = assessment_row.educator_id
       AND enrolled.subject_id = assessment_row.subject_id
      WHERE assessment_row.id = public.tbl_notifications.assessment_id
        AND assessment_row.educator_id = public.tbl_notifications.recipient_user_id
        AND enrolled.student_id = public.get_current_tbl_user_id()
        AND enrolled.is_active = true
    )
  );

-- ==================== REALTIME PUBLICATION ====================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'tbl_assessments'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.tbl_assessments;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'tbl_student_assessment_retakes'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.tbl_student_assessment_retakes;
    END IF;
  END IF;
END $$;

COMMIT;
