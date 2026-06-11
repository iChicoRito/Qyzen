-- ==================== CREATE PROFILE MEDIA BUCKET ====================
-- File: database/sql/migrations/create_profile_media_bucket.sql
-- Created: 2026-04-07
-- Purpose: Create a public bucket for profile and cover photo uploads with strict media limits.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-media',
  'profile-media',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
