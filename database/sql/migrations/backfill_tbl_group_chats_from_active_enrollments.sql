-- ==================== BACKFILL TBL_GROUP_CHATS FROM ACTIVE ENROLLMENTS ====================
-- File: database/sql/migrations/backfill_tbl_group_chats_from_active_enrollments.sql
-- Created: 2026-04-03
-- Purpose: Create one group chat row for every active educator subject and section enrollment set.

INSERT INTO public.tbl_group_chats (
  educator_id,
  subject_id,
  section_id,
  created_at,
  updated_at
)
SELECT DISTINCT
  enrolled.educator_id,
  enrolled.subject_id,
  subject_row.sections_id,
  NOW(),
  NOW()
FROM public.tbl_enrolled AS enrolled
INNER JOIN public.tbl_subjects AS subject_row
  ON subject_row.id = enrolled.subject_id
WHERE enrolled.is_active = TRUE
ON CONFLICT (educator_id, subject_id, section_id)
DO UPDATE SET
  updated_at = EXCLUDED.updated_at;
