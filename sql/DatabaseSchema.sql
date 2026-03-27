-- Tables

CREATE TABLE public.tbl_academic_term (
  id bigint NOT NULL,
  term_name text NOT NULL,
  semester text NOT NULL,
  academic_year_id bigint NOT NULL,
  is_active boolean DEFAULT true NOT NULL
);

CREATE TABLE public.tbl_academic_year (
  id bigint NOT NULL,
  year text NOT NULL,
  is_active boolean DEFAULT true NOT NULL
);

CREATE TABLE public.tbl_permissions (
  id bigint NOT NULL,
  name text NOT NULL,
  resource text NOT NULL,
  action text NOT NULL,
  description text NOT NULL,
  module text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  permission_string text
);

CREATE TABLE public.tbl_role_permissions (
  id bigint NOT NULL,
  role_id bigint NOT NULL,
  permission_id bigint NOT NULL
);

CREATE TABLE public.tbl_roles (
  id bigint NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  is_system boolean DEFAULT false NOT NULL,
  is_active boolean DEFAULT true NOT NULL
);

CREATE TABLE public.tbl_user_roles (
  id bigint DEFAULT nextval('tbl_user_roles_id_seq'::regclass) NOT NULL,
  user_id bigint NOT NULL,
  role_id bigint NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  deleted_at timestamp with time zone
);

CREATE TABLE public.tbl_users (
  id bigint DEFAULT nextval('tbl_users_id_seq'::regclass) NOT NULL,
  user_type text NOT NULL,
  user_id text NOT NULL,
  given_name text NOT NULL,
  surname text NOT NULL,
  email text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  deleted_at timestamp with time zone
);

-- Primary Keys

ALTER TABLE public.tbl_academic_term ADD CONSTRAINT tbl_academic_term_pkey PRIMARY KEY (id);
ALTER TABLE public.tbl_academic_year ADD CONSTRAINT tbl_academic_year_pkey PRIMARY KEY (id);
ALTER TABLE public.tbl_permissions ADD CONSTRAINT tbl_permissions_pkey PRIMARY KEY (id);
ALTER TABLE public.tbl_role_permissions ADD CONSTRAINT tbl_role_permissions_pkey PRIMARY KEY (id);
ALTER TABLE public.tbl_roles ADD CONSTRAINT tbl_roles_pkey PRIMARY KEY (id);
ALTER TABLE public.tbl_user_roles ADD CONSTRAINT tbl_user_roles_pkey PRIMARY KEY (id);
ALTER TABLE public.tbl_users ADD CONSTRAINT tbl_users_pkey PRIMARY KEY (id);

-- Foreign Keys

ALTER TABLE public.tbl_academic_term ADD CONSTRAINT tbl_academic_term_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.tbl_academic_year(id);
ALTER TABLE public.tbl_role_permissions ADD CONSTRAINT tbl_role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.tbl_permissions(id) ON DELETE CASCADE;
ALTER TABLE public.tbl_role_permissions ADD CONSTRAINT tbl_role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.tbl_roles(id) ON DELETE CASCADE;
ALTER TABLE public.tbl_user_roles ADD CONSTRAINT tbl_user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.tbl_roles(id) ON DELETE CASCADE;
ALTER TABLE public.tbl_user_roles ADD CONSTRAINT tbl_user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.tbl_users(id) ON DELETE CASCADE;

-- Indexes

CREATE UNIQUE INDEX tbl_academic_year_year_key ON public.tbl_academic_year USING btree (year);
CREATE UNIQUE INDEX tbl_academic_term_unique_term ON public.tbl_academic_term USING btree (term_name, semester, academic_year_id);
CREATE UNIQUE INDEX tbl_roles_name_key ON public.tbl_roles USING btree (name);
CREATE UNIQUE INDEX tbl_permissions_permission_string_key ON public.tbl_permissions USING btree (permission_string);
CREATE UNIQUE INDEX tbl_role_permissions_unique_pair ON public.tbl_role_permissions USING btree (role_id, permission_id);
CREATE UNIQUE INDEX tbl_users_user_id_key ON public.tbl_users USING btree (user_id);
CREATE UNIQUE INDEX tbl_users_email_key ON public.tbl_users USING btree (email);
CREATE INDEX idx_tbl_users_user_type ON public.tbl_users USING btree (user_type);
CREATE INDEX idx_tbl_users_user_id ON public.tbl_users USING btree (user_id);
CREATE INDEX idx_tbl_users_email ON public.tbl_users USING btree (email);
CREATE UNIQUE INDEX tbl_user_roles_user_role_unique ON public.tbl_user_roles USING btree (user_id, role_id);
CREATE INDEX idx_tbl_user_roles_user_id ON public.tbl_user_roles USING btree (user_id);
CREATE INDEX idx_tbl_user_roles_role_id ON public.tbl_user_roles USING btree (role_id);
