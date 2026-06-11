-- ==================== SEED REALISTIC GROUP CHAT MESSAGES ====================
-- File: database/sql/migrations/seed_realistic_group_chat_messages.sql
-- Created: 2026-05-19
-- Purpose: Add realistic educator and student conversations to active group chats.

WITH message_seed AS (
  SELECT *
  FROM (
    VALUES
      (1::bigint, 80::bigint, 'Good morning BSIT22M1. Please review the Written Exam schedule and focus on visual hierarchy, layout balance, and media accessibility.', TIMESTAMPTZ '2026-05-19 00:00:00+00'),
      (1::bigint, 50::bigint, 'Sir, will the exam include questions about responsive layout and breakpoints?', TIMESTAMPTZ '2026-05-19 00:04:00+00'),
      (1::bigint, 80::bigint, 'Yes. Expect questions about mobile-first layouts, spacing, typography, and choosing the right media format.', TIMESTAMPTZ '2026-05-19 00:07:00+00'),
      (1::bigint, 75::bigint, 'Noted sir. Should we also review color contrast rules for interface design?', TIMESTAMPTZ '2026-05-19 00:11:00+00'),
      (1::bigint, 80::bigint, 'Yes, please include contrast, readability, and how color supports hierarchy instead of decoration only.', TIMESTAMPTZ '2026-05-19 00:14:00+00'),
      (1::bigint, 54::bigint, 'Sir, can we use the class activity screenshots as reference while reviewing?', TIMESTAMPTZ '2026-05-19 00:20:00+00'),
      (1::bigint, 80::bigint, 'Use them for review, but answer the exam based on the design principles we discussed.', TIMESTAMPTZ '2026-05-19 00:23:00+00'),
      (1::bigint, 77::bigint, 'Thank you sir. I will review the examples about image placement and content grouping.', TIMESTAMPTZ '2026-05-19 00:29:00+00'),
      (1::bigint, 74::bigint, 'Sir, if the layout is correct but spacing is inconsistent, is that considered a usability issue?', TIMESTAMPTZ '2026-05-19 00:34:00+00'),
      (1::bigint, 80::bigint, 'Yes. Inconsistent spacing affects scanning and usability, so treat it as part of the user experience.', TIMESTAMPTZ '2026-05-19 00:37:00+00'),
      (1::bigint, 52::bigint, 'Got it sir. We will review the notes before the deadline.', TIMESTAMPTZ '2026-05-19 00:43:00+00'),
      (1::bigint, 80::bigint, 'Great. Message here if any instruction is unclear before you start the assessment.', TIMESTAMPTZ '2026-05-19 00:48:00+00'),
      (2::bigint, 80::bigint, 'BSIT22M5, for Web System Technologies 2, review HTTP methods, status codes, fetch requests, and JSON responses.', TIMESTAMPTZ '2026-05-19 01:00:00+00'),
      (2::bigint, 48::bigint, 'Sir, do we need to memorize all status codes or just the common ones?', TIMESTAMPTZ '2026-05-19 01:05:00+00'),
      (2::bigint, 80::bigint, 'Focus on common status codes first: 200, 201, 400, 401, 403, 404, and 500.', TIMESTAMPTZ '2026-05-19 01:08:00+00'),
      (2::bigint, 51::bigint, 'Sir, will there be questions about POST and GET differences?', TIMESTAMPTZ '2026-05-19 01:13:00+00'),
      (2::bigint, 80::bigint, 'Yes. Know when to use GET for reading data and POST for creating or submitting data.', TIMESTAMPTZ '2026-05-19 01:16:00+00'),
      (2::bigint, 49::bigint, 'Noted sir. I will also review request body and response examples.', TIMESTAMPTZ '2026-05-19 01:22:00+00'),
      (2::bigint, 80::bigint, 'Good. Also review why JSON is commonly used for API responses.', TIMESTAMPTZ '2026-05-19 01:25:00+00'),
      (2::bigint, 55::bigint, 'Sir, is localStorage included in the written exam?', TIMESTAMPTZ '2026-05-19 01:31:00+00'),
      (2::bigint, 80::bigint, 'Yes, at a basic level. Understand the difference between localStorage and sessionStorage.', TIMESTAMPTZ '2026-05-19 01:34:00+00'),
      (2::bigint, 76::bigint, 'Thank you sir. The API examples from last meeting helped a lot.', TIMESTAMPTZ '2026-05-19 01:39:00+00'),
      (2::bigint, 53::bigint, 'Sir, should we answer based on REST API conventions?', TIMESTAMPTZ '2026-05-19 01:44:00+00'),
      (2::bigint, 80::bigint, 'Yes. Use REST conventions unless the question explicitly says otherwise.', TIMESTAMPTZ '2026-05-19 01:47:00+00')
  ) AS messages(group_chat_id, sender_user_id, content, created_at)
)
INSERT INTO public.tbl_group_chat_messages (
  group_chat_id,
  sender_user_id,
  content,
  created_at,
  updated_at
)
SELECT
  message_seed.group_chat_id,
  message_seed.sender_user_id,
  message_seed.content,
  message_seed.created_at,
  message_seed.created_at
FROM message_seed
WHERE EXISTS (
    SELECT 1
    FROM public.tbl_group_chats AS chat
    WHERE chat.id = message_seed.group_chat_id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.tbl_group_chat_messages AS existing_message
    WHERE existing_message.group_chat_id = message_seed.group_chat_id
      AND existing_message.sender_user_id = message_seed.sender_user_id
      AND existing_message.content = message_seed.content
  );
