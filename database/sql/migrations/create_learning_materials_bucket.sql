-- ==================== CREATE LEARNING MATERIALS BUCKET ====================
-- File: database/sql/migrations/create_learning_materials_bucket.sql
-- Created: 2026-04-07
-- Purpose: Create a private bucket for educator learning material uploads with a file-size limit.

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('learning-materials', 'learning-materials', false, 20971520)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;
