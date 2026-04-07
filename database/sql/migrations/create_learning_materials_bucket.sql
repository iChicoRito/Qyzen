-- ==================== CREATE LEARNING MATERIALS BUCKET ====================
-- File: database/sql/migrations/create_learning_materials_bucket.sql
-- Created: 2026-04-07
-- Purpose: Create a private bucket for educator learning material uploads.

INSERT INTO storage.buckets (id, name, public)
VALUES ('learning-materials', 'learning-materials', false)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;
