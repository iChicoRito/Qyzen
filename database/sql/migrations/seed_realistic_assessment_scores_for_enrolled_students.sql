-- ==================== SEED REALISTIC ASSESSMENT SCORES ====================
-- File: database/sql/migrations/seed_realistic_assessment_scores_for_enrolled_students.sql
-- Created: 2026-05-19
-- Purpose: Insert realistic submitted assessment scores for active enrolled students with active modules.

WITH module_question_counts AS (
  SELECT
    quiz.module_id,
    COUNT(*)::integer AS total_questions
  FROM public.tbl_quizzes AS quiz
  GROUP BY quiz.module_id
),
eligible_pairs AS (
  SELECT
    ROW_NUMBER() OVER (ORDER BY module_row.id, student_user.user_id)::integer AS pair_rank,
    enrolled.student_id,
    enrolled.educator_id,
    module_row.id AS module_id,
    module_row.subject_id,
    module_row.section_id,
    question_counts.total_questions,
    LEAST(
      question_counts.total_questions,
      4 + ((enrolled.student_id + module_row.id) % 7)
    )::integer AS target_score
  FROM public.tbl_enrolled AS enrolled
  INNER JOIN public.tbl_users AS student_user
    ON student_user.id = enrolled.student_id
  INNER JOIN public.tbl_subjects AS subject_row
    ON subject_row.id = enrolled.subject_id
  INNER JOIN public.tbl_modules AS module_row
    ON module_row.educator_id = enrolled.educator_id
    AND module_row.subject_id = enrolled.subject_id
    AND module_row.section_id = subject_row.sections_id
    AND module_row.is_active = TRUE
  INNER JOIN module_question_counts AS question_counts
    ON question_counts.module_id = module_row.id
    AND question_counts.total_questions > 0
  WHERE enrolled.is_active = TRUE
    AND student_user.user_type = 'student'
    AND student_user.is_active = TRUE
    AND student_user.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.tbl_scores AS existing_score
      WHERE existing_score.student_id = enrolled.student_id
        AND existing_score.module_id = module_row.id
        AND existing_score.submitted_at IS NOT NULL
    )
),
quiz_answers AS (
  SELECT
    eligible_pairs.student_id,
    eligible_pairs.module_id,
    JSONB_OBJECT_AGG(
      quiz_order.quiz_id::text,
      CASE
        WHEN quiz_order.question_rank <= eligible_pairs.target_score THEN quiz_order.correct_answer
        ELSE COALESCE(quiz_order.wrong_answer, 'Incorrect answer')
      END
      ORDER BY quiz_order.quiz_id
    ) AS student_answer
  FROM eligible_pairs
  INNER JOIN LATERAL (
    SELECT
      quiz.id AS quiz_id,
      quiz.correct_answer,
      ROW_NUMBER() OVER (ORDER BY quiz.id)::integer AS question_rank,
      CASE
        WHEN quiz.quiz_type = 'multiple_choice' THEN (
          SELECT choice.value
          FROM JSONB_TO_RECORDSET(quiz.choices) AS choice(key text, value text)
          WHERE LOWER(choice.value) <> LOWER(quiz.correct_answer)
          ORDER BY choice.key
          LIMIT 1
        )
        ELSE 'Incorrect answer'
      END AS wrong_answer
    FROM public.tbl_quizzes AS quiz
    WHERE quiz.module_id = eligible_pairs.module_id
  ) AS quiz_order ON TRUE
  GROUP BY eligible_pairs.student_id, eligible_pairs.module_id
),
score_payload AS (
  SELECT
    eligible_pairs.student_id,
    eligible_pairs.educator_id,
    eligible_pairs.module_id,
    eligible_pairs.subject_id,
    eligible_pairs.section_id,
    eligible_pairs.target_score AS score,
    eligible_pairs.total_questions,
    quiz_answers.student_answer,
    (eligible_pairs.pair_rank % 3)::integer AS warning_attempts,
    CASE
      WHEN ((eligible_pairs.target_score::numeric / eligible_pairs.total_questions::numeric) * 100) >= 75
        THEN 'passed'
      ELSE 'failed'
    END AS status,
    ((eligible_pairs.target_score::numeric / eligible_pairs.total_questions::numeric) * 100) >= 75 AS is_passed,
    NOW() - (eligible_pairs.pair_rank * INTERVAL '7 minutes') AS submitted_at
  FROM eligible_pairs
  INNER JOIN quiz_answers
    ON quiz_answers.student_id = eligible_pairs.student_id
    AND quiz_answers.module_id = eligible_pairs.module_id
)
INSERT INTO public.tbl_scores (
  student_id,
  educator_id,
  module_id,
  subject_id,
  section_id,
  score,
  total_questions,
  student_answer,
  warning_attempts,
  status,
  is_passed,
  taken_at,
  submitted_at,
  created_at,
  updated_at
)
SELECT
  score_payload.student_id,
  score_payload.educator_id,
  score_payload.module_id,
  score_payload.subject_id,
  score_payload.section_id,
  score_payload.score,
  score_payload.total_questions,
  score_payload.student_answer,
  score_payload.warning_attempts,
  score_payload.status,
  score_payload.is_passed,
  score_payload.submitted_at - INTERVAL '20 minutes',
  score_payload.submitted_at,
  score_payload.submitted_at,
  score_payload.submitted_at
FROM score_payload;
