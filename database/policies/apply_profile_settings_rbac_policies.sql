-- ==================== APPLY PROFILE SETTINGS RBAC POLICIES ====================
-- File: database/policies/apply_profile_settings_rbac_policies.sql
-- Created: 2026-04-07
-- Purpose: Allow authenticated users to update only their own active account row.

DROP POLICY IF EXISTS "Users can update own profile" ON public.tbl_users;

CREATE POLICY "Users can update own profile" ON public.tbl_users
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING ((id = public.get_current_tbl_user_id()) AND (deleted_at IS NULL) AND (is_active = true))
WITH CHECK ((id = public.get_current_tbl_user_id()) AND (deleted_at IS NULL) AND (is_active = true));
