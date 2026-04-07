-- ==================== ADD PROFILE MEDIA COLUMNS TO TBL_USERS ====================
-- File: database/sql/migrations/add_profile_media_columns_to_tbl_users.sql
-- Created: 2026-04-07
-- Purpose: Store profile and cover image paths for each user account.

ALTER TABLE public.tbl_users
ADD COLUMN IF NOT EXISTS profile_picture text,
ADD COLUMN IF NOT EXISTS cover_photo text;
