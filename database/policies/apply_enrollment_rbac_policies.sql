-- ==================== APPLY ENROLLMENT RBAC POLICIES ====================
-- File: database/policies/apply_enrollment_rbac_policies.sql
-- Created: 2026-03-29
-- Purpose: Apply educator and admin row level security policies to tbl_enrolled.

CREATE POLICY "Admin full access on tbl_enrolled" ON public.tbl_enrolled AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role('admin'::text))
  WITH CHECK (public.has_role('admin'::text));

CREATE POLICY "Educator enrollment view access" ON public.tbl_enrolled AS PERMISSIVE FOR SELECT TO authenticated
  USING ((public.has_role('educator'::text) AND (educator_id = public.get_current_tbl_user_id())));

CREATE POLICY "Educator enrollment create access" ON public.tbl_enrolled AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((public.has_role('educator'::text) AND (educator_id = public.get_current_tbl_user_id())));

CREATE POLICY "Educator enrollment update access" ON public.tbl_enrolled AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((public.has_role('educator'::text) AND (educator_id = public.get_current_tbl_user_id())))
  WITH CHECK ((public.has_role('educator'::text) AND (educator_id = public.get_current_tbl_user_id())));

CREATE POLICY "Educator enrollment delete access" ON public.tbl_enrolled AS PERMISSIVE FOR DELETE TO authenticated
  USING ((public.has_role('educator'::text) AND (educator_id = public.get_current_tbl_user_id())));
