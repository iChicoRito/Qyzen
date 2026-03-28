-- ==================== CREATE USER HAS PERMISSION FUNCTION ====================
-- File: sql/functions/create_user_has_permission_function.sql
-- Created: 2026-03-29
-- Purpose: Checks whether the current authenticated user has a specific active permission

CREATE OR REPLACE FUNCTION public.user_has_permission(required_permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tbl_user_roles user_roles
    INNER JOIN public.tbl_roles roles
      ON roles.id = user_roles.role_id
    INNER JOIN public.tbl_role_permissions role_permissions
      ON role_permissions.role_id = roles.id
    INNER JOIN public.tbl_permissions permissions
      ON permissions.id = role_permissions.permission_id
    WHERE user_roles.user_id = public.get_current_tbl_user_id()
      AND user_roles.deleted_at IS NULL
      AND roles.is_active = TRUE
      AND permissions.is_active = TRUE
      AND permissions.permission_string = required_permission
  );
$$;
