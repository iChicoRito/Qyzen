-- ==================== SEED FULL ENROLLED SUBJECT SCORE COVERAGE ====================
-- File: database/sql/migrations/seed_full_enrolled_subject_score_coverage.sql
-- Created: 2026-05-19
-- Purpose: Create missing demo assessments and submitted scores for every active enrolled subject.

WITH missing_assessment_pairs AS (
  SELECT DISTINCT
    enrolled.educator_id,
    enrolled.subject_id,
    subject_row.sections_id AS section_id,
    section_row.academic_term_id AS term
  FROM public.tbl_enrolled AS enrolled
  INNER JOIN public.tbl_subjects AS subject_row
    ON subject_row.id = enrolled.subject_id
  INNER JOIN public.tbl_sections AS section_row
    ON section_row.id = subject_row.sections_id
  WHERE enrolled.is_active = TRUE
    AND NOT EXISTS (
      SELECT 1
      FROM public.tbl_assessments AS existing_assessment
      WHERE existing_assessment.educator_id = enrolled.educator_id
        AND existing_assessment.subject_id = enrolled.subject_id
        AND existing_assessment.section_id = subject_row.sections_id
        AND existing_assessment.is_active = TRUE
    )
),
inserted_assessments AS (
  INSERT INTO public.tbl_assessments (
    educator_id,
    subject_id,
    section_id,
    assessment_code,
    term,
    time_limit,
    cheating_attempts,
    is_shuffle,
    allow_review,
    allow_retake,
    retake_count,
    allow_hint,
    hint_count,
    is_active,
    start_date,
    end_date,
    start_time,
    end_time,
    created_at,
    updated_at
  )
  SELECT
    missing_assessment_pairs.educator_id,
    missing_assessment_pairs.subject_id,
    missing_assessment_pairs.section_id,
    'Written Exam',
    missing_assessment_pairs.term,
    '30',
    5,
    TRUE,
    TRUE,
    FALSE,
    0,
    TRUE,
    5,
    TRUE,
    DATE '2026-05-06',
    DATE '2026-05-12',
    TIME '06:00:00',
    TIME '13:00:00',
    NOW(),
    NOW()
  FROM missing_assessment_pairs
  ON CONFLICT (assessment_code, subject_id, section_id, term)
  DO NOTHING
  RETURNING id, educator_id, subject_id, section_id
),
all_assessments AS (
  SELECT
    assessment_row.id,
    assessment_row.educator_id,
    assessment_row.subject_id,
    assessment_row.section_id,
    assessment_row.is_active
  FROM public.tbl_assessments AS assessment_row
  UNION ALL
  SELECT
    inserted_assessments.id,
    inserted_assessments.educator_id,
    inserted_assessments.subject_id,
    inserted_assessments.section_id,
    TRUE AS is_active
  FROM inserted_assessments
),
question_bank AS (
  SELECT *
  FROM (
    VALUES
      ('IT203', 1, 'Which data structure follows the Last In, First Out principle?', '[{"key":"A","value":"Queue"},{"key":"B","value":"Stack"},{"key":"C","value":"Array"},{"key":"D","value":"Graph"}]'::jsonb, 'Stack'),
      ('IT203', 2, 'Which data structure is commonly used for breadth-first search?', '[{"key":"A","value":"Queue"},{"key":"B","value":"Stack"},{"key":"C","value":"Hash table"},{"key":"D","value":"Tree"}]'::jsonb, 'Queue'),
      ('IT203', 3, 'What is the average-case lookup time for a hash table?', '[{"key":"A","value":"O(1)"},{"key":"B","value":"O(n)"},{"key":"C","value":"O(log n)"},{"key":"D","value":"O(n log n)"}]'::jsonb, 'O(1)'),
      ('IT203', 4, 'Which traversal visits the left subtree, root, then right subtree?', '[{"key":"A","value":"Preorder"},{"key":"B","value":"Inorder"},{"key":"C","value":"Postorder"},{"key":"D","value":"Level order"}]'::jsonb, 'Inorder'),
      ('IT203', 5, 'Which algorithm design technique solves overlapping subproblems by storing results?', '[{"key":"A","value":"Dynamic programming"},{"key":"B","value":"Brute force"},{"key":"C","value":"Linear search"},{"key":"D","value":"Selection"}]'::jsonb, 'Dynamic programming'),
      ('IT203', 6, 'What is the worst-case time complexity of linear search?', '[{"key":"A","value":"O(1)"},{"key":"B","value":"O(log n)"},{"key":"C","value":"O(n)"},{"key":"D","value":"O(n squared)"}]'::jsonb, 'O(n)'),
      ('IT203', 7, 'Which structure stores nodes with parent-child relationships?', '[{"key":"A","value":"Tree"},{"key":"B","value":"Stack"},{"key":"C","value":"Queue"},{"key":"D","value":"Array"}]'::jsonb, 'Tree'),
      ('IT203', 8, 'Which sorting algorithm repeatedly selects the smallest remaining item?', '[{"key":"A","value":"Selection sort"},{"key":"B","value":"Merge sort"},{"key":"C","value":"Quick sort"},{"key":"D","value":"Heap sort"}]'::jsonb, 'Selection sort'),
      ('IT203', 9, 'Which notation describes algorithm growth rate?', '[{"key":"A","value":"Big O notation"},{"key":"B","value":"Camel case"},{"key":"C","value":"Binary code"},{"key":"D","value":"ASCII"}]'::jsonb, 'Big O notation'),
      ('IT203', 10, 'Which data structure uses key-value pairs?', '[{"key":"A","value":"Hash table"},{"key":"B","value":"Stack"},{"key":"C","value":"Queue"},{"key":"D","value":"Linked list"}]'::jsonb, 'Hash table'),
      ('IT204', 1, 'Which protocol is used to transfer web pages over the internet?', '[{"key":"A","value":"HTTP"},{"key":"B","value":"SMTP"},{"key":"C","value":"FTP"},{"key":"D","value":"SSH"}]'::jsonb, 'HTTP'),
      ('IT204', 2, 'Which HTTP method is typically used to create a new resource?', '[{"key":"A","value":"GET"},{"key":"B","value":"POST"},{"key":"C","value":"DELETE"},{"key":"D","value":"HEAD"}]'::jsonb, 'POST'),
      ('IT204', 3, 'Which status code means a request succeeded?', '[{"key":"A","value":"200"},{"key":"B","value":"301"},{"key":"C","value":"404"},{"key":"D","value":"500"}]'::jsonb, '200'),
      ('IT204', 4, 'Which technology styles web page presentation?', '[{"key":"A","value":"CSS"},{"key":"B","value":"SQL"},{"key":"C","value":"JSON"},{"key":"D","value":"XML"}]'::jsonb, 'CSS'),
      ('IT204', 5, 'Which JavaScript API is commonly used to make HTTP requests in browsers?', '[{"key":"A","value":"fetch"},{"key":"B","value":"console"},{"key":"C","value":"Math"},{"key":"D","value":"Date"}]'::jsonb, 'fetch'),
      ('IT204', 6, 'What does API stand for?', '[{"key":"A","value":"Application Programming Interface"},{"key":"B","value":"Automated Page Index"},{"key":"C","value":"Active Program Input"},{"key":"D","value":"Application Package Installer"}]'::jsonb, 'Application Programming Interface'),
      ('IT204', 7, 'Which format is commonly used for REST API responses?', '[{"key":"A","value":"JSON"},{"key":"B","value":"PNG"},{"key":"C","value":"MP3"},{"key":"D","value":"ZIP"}]'::jsonb, 'JSON'),
      ('IT204', 8, 'Which HTML element loads a JavaScript file?', '[{"key":"A","value":"script"},{"key":"B","value":"style"},{"key":"C","value":"link"},{"key":"D","value":"meta"}]'::jsonb, 'script'),
      ('IT204', 9, 'Which web storage option persists after the browser is closed?', '[{"key":"A","value":"localStorage"},{"key":"B","value":"sessionStorage"},{"key":"C","value":"requestStorage"},{"key":"D","value":"tempStorage"}]'::jsonb, 'localStorage'),
      ('IT204', 10, 'Which header identifies the media type of a response body?', '[{"key":"A","value":"Content-Type"},{"key":"B","value":"User-Agent"},{"key":"C","value":"Host"},{"key":"D","value":"Referer"}]'::jsonb, 'Content-Type')
  ) AS questions(subject_code, question_order, question, choices, correct_answer)
),
assessments_needing_questions AS (
  SELECT
    assessment_row.id AS assessment_id,
    assessment_row.educator_id,
    assessment_row.subject_id,
    assessment_row.section_id,
    subject_row.subject_code
  FROM all_assessments AS assessment_row
  INNER JOIN public.tbl_subjects AS subject_row
    ON subject_row.id = assessment_row.subject_id
  WHERE assessment_row.is_active = TRUE
    AND subject_row.subject_code IN ('IT203', 'IT204')
    AND EXISTS (
      SELECT 1
      FROM public.tbl_enrolled AS enrolled
      WHERE enrolled.educator_id = assessment_row.educator_id
        AND enrolled.subject_id = assessment_row.subject_id
        AND enrolled.is_active = TRUE
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.tbl_quizzes AS existing_quiz
      WHERE existing_quiz.assessment_id = assessment_row.id
    )
  UNION
  SELECT
    inserted_assessments.id AS assessment_id,
    inserted_assessments.educator_id,
    inserted_assessments.subject_id,
    inserted_assessments.section_id,
    subject_row.subject_code
  FROM inserted_assessments
  INNER JOIN public.tbl_subjects AS subject_row
    ON subject_row.id = inserted_assessments.subject_id
),
inserted_quizzes AS (
  INSERT INTO public.tbl_quizzes (
    assessment_id,
    subject_id,
    section_id,
    educator_id,
    question,
    quiz_type,
    choices,
    correct_answer,
    created_at,
    updated_at
  )
  SELECT
    assessments_needing_questions.assessment_id,
    assessments_needing_questions.subject_id,
    assessments_needing_questions.section_id,
    assessments_needing_questions.educator_id,
    question_bank.question,
    'multiple_choice',
    question_bank.choices,
    question_bank.correct_answer,
    NOW(),
    NOW()
  FROM assessments_needing_questions
  INNER JOIN question_bank
    ON question_bank.subject_code = assessments_needing_questions.subject_code
  RETURNING id, assessment_id, correct_answer, choices
),
all_quizzes AS (
  SELECT
    quiz.id,
    quiz.assessment_id,
    quiz.correct_answer,
    quiz.choices
  FROM public.tbl_quizzes AS quiz
  UNION ALL
  SELECT
    inserted_quizzes.id,
    inserted_quizzes.assessment_id,
    inserted_quizzes.correct_answer,
    inserted_quizzes.choices
  FROM inserted_quizzes
),
assessment_question_counts AS (
  SELECT
    all_quizzes.assessment_id,
    COUNT(*)::integer AS total_questions
  FROM all_quizzes
  GROUP BY all_quizzes.assessment_id
),
eligible_pairs AS (
  SELECT
    ROW_NUMBER() OVER (ORDER BY assessment_row.id, student_user.user_id)::integer AS pair_rank,
    enrolled.student_id,
    enrolled.educator_id,
    assessment_row.id AS assessment_id,
    assessment_row.subject_id,
    assessment_row.section_id,
    question_counts.total_questions,
    LEAST(
      question_counts.total_questions,
      4 + ((enrolled.student_id + assessment_row.id) % 7)
    )::integer AS target_score
  FROM public.tbl_enrolled AS enrolled
  INNER JOIN public.tbl_users AS student_user
    ON student_user.id = enrolled.student_id
  INNER JOIN public.tbl_subjects AS subject_row
    ON subject_row.id = enrolled.subject_id
  INNER JOIN all_assessments AS assessment_row
    ON assessment_row.educator_id = enrolled.educator_id
    AND assessment_row.subject_id = enrolled.subject_id
    AND assessment_row.section_id = subject_row.sections_id
    AND assessment_row.is_active = TRUE
  INNER JOIN assessment_question_counts AS question_counts
    ON question_counts.assessment_id = assessment_row.id
    AND question_counts.total_questions > 0
  WHERE enrolled.is_active = TRUE
    AND student_user.user_type = 'student'
    AND student_user.is_active = TRUE
    AND student_user.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.tbl_scores AS existing_score
      WHERE existing_score.student_id = enrolled.student_id
        AND existing_score.assessment_id = assessment_row.id
        AND existing_score.submitted_at IS NOT NULL
    )
),
quiz_answers AS (
  SELECT
    eligible_pairs.student_id,
    eligible_pairs.assessment_id,
    JSONB_OBJECT_AGG(
      quiz_order.quiz_id::text,
      CASE
        WHEN quiz_order.question_rank <= eligible_pairs.target_score THEN quiz_order.correct_answer
        ELSE quiz_order.wrong_answer
      END
      ORDER BY quiz_order.quiz_id
    ) AS student_answer
  FROM eligible_pairs
  INNER JOIN LATERAL (
    SELECT
      quiz.id AS quiz_id,
      quiz.correct_answer,
      ROW_NUMBER() OVER (ORDER BY quiz.id)::integer AS question_rank,
      COALESCE(
        (
          SELECT choice.value
          FROM JSONB_TO_RECORDSET(quiz.choices) AS choice(key text, value text)
          WHERE LOWER(choice.value) <> LOWER(quiz.correct_answer)
          ORDER BY choice.key
          LIMIT 1
        ),
        'Incorrect answer'
      ) AS wrong_answer
    FROM all_quizzes AS quiz
    WHERE quiz.assessment_id = eligible_pairs.assessment_id
  ) AS quiz_order ON TRUE
  GROUP BY eligible_pairs.student_id, eligible_pairs.assessment_id
),
score_payload AS (
  SELECT
    eligible_pairs.student_id,
    eligible_pairs.educator_id,
    eligible_pairs.assessment_id,
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
    NOW() - (eligible_pairs.pair_rank * INTERVAL '6 minutes') AS submitted_at
  FROM eligible_pairs
  INNER JOIN quiz_answers
    ON quiz_answers.student_id = eligible_pairs.student_id
    AND quiz_answers.assessment_id = eligible_pairs.assessment_id
)
INSERT INTO public.tbl_scores (
  student_id,
  educator_id,
  assessment_id,
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
  score_payload.assessment_id,
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

