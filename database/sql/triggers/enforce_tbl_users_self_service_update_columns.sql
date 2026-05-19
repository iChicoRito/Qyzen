-- ==================== ENFORCE TBL_USERS SELF-SERVICE UPDATE COLUMNS ====================
-- File: database/sql/triggers/enforce_tbl_users_self_service_update_columns.sql
-- Created: 2026-05-15
-- Purpose: Restrict authenticated self-service profile updates to safe columns only.

CREATE OR REPLACE FUNCTION public.enforce_tbl_users_self_service_update_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user <> 'authenticated' THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.user_type IS DISTINCT FROM OLD.user_type
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.is_active IS DISTINCT FROM OLD.is_active
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
    OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
  THEN
    RAISE EXCEPTION 'Only safe profile fields can be updated from self-service flows.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_tbl_users_self_service_update_columns ON public.tbl_users;

CREATE TRIGGER trg_enforce_tbl_users_self_service_update_columns
BEFORE UPDATE ON public.tbl_users
FOR EACH ROW
EXECUTE FUNCTION public.enforce_tbl_users_self_service_update_columns();
