-- ==================== RENAME ACADEMIC TABLES WITH TBL PREFIX ====================
ALTER TABLE public.academic_year RENAME TO tbl_academic_year;
ALTER TABLE public.academic_term RENAME TO tbl_academic_term;

-- ==================== RENAME ACCESS CONTROL TABLES WITH TBL PREFIX ====================
ALTER TABLE public.roles RENAME TO tbl_roles;
ALTER TABLE public.permissions RENAME TO tbl_permissions;
ALTER TABLE public.role_permissions RENAME TO tbl_role_permissions;

-- ==================== RENAME USER TABLES WITH TBL PREFIX ====================
ALTER TABLE public.users RENAME TO tbl_users;
ALTER TABLE public.user_roles RENAME TO tbl_user_roles;

-- ==================== RENAME USER SEQUENCES WITH TBL PREFIX ====================
ALTER SEQUENCE IF EXISTS public.users_id_seq RENAME TO tbl_users_id_seq;
ALTER SEQUENCE IF EXISTS public.user_roles_id_seq RENAME TO tbl_user_roles_id_seq;
