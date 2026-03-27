-- ==================== CREATE USERS TABLE ====================
CREATE TABLE IF NOT EXISTS public.tbl_users (
  id BIGSERIAL PRIMARY KEY,
  user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'student', 'educator')),
  user_id TEXT NOT NULL UNIQUE,
  given_name TEXT NOT NULL,
  surname TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.tbl_users DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_tbl_users_user_type ON public.tbl_users(user_type);
CREATE INDEX IF NOT EXISTS idx_tbl_users_user_id ON public.tbl_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tbl_users_email ON public.tbl_users(email);

-- ==================== CREATE USER ROLE JUNCTION TABLE ====================
CREATE TABLE IF NOT EXISTS public.tbl_user_roles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.tbl_users(id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES public.tbl_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT tbl_user_roles_user_role_unique UNIQUE (user_id, role_id)
);

ALTER TABLE public.tbl_user_roles DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_tbl_user_roles_user_id ON public.tbl_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_tbl_user_roles_role_id ON public.tbl_user_roles(role_id);
