-- ==================== CREATE PROFILE MEDIA BUCKET ====================
-- File: database/sql/migrations/create_profile_media_bucket.sql
-- Created: 2026-04-07
-- Purpose: Create a public bucket for profile and cover photo uploads.

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-media', 'profile-media', true)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;
