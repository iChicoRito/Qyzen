-- Tables
CREATE TABLE public.academic_term (
  id bigint NOT NULL,
  term_name text NOT NULL,
  semester text NOT NULL,
  academic_year_id bigint NOT NULL,
  is_active boolean DEFAULT true NOT NULL
);

CREATE TABLE public.academic_year (
  id bigint NOT NULL,
  year text NOT NULL,
  is_active boolean DEFAULT true NOT NULL
);

CREATE TABLE public.permissions (
  id bigint NOT NULL,
  name text NOT NULL,
  resource text NOT NULL,
  action text NOT NULL,
  description text NOT NULL,
  module text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  permission_string text
);

CREATE TABLE public.role_permissions (
  id bigint NOT NULL,
  role_id bigint NOT NULL,
  permission_id bigint NOT NULL
);

CREATE TABLE public.roles (
  id bigint NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  is_system boolean DEFAULT false NOT NULL,
  is_active boolean DEFAULT true NOT NULL
);

-- Primary Keys
ALTER TABLE public.academic_term ADD CONSTRAINT academic_term_new_pkey PRIMARY KEY (id);
ALTER TABLE public.academic_year ADD CONSTRAINT academic_year_new_pkey PRIMARY KEY (id);
ALTER TABLE public.permissions ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);
ALTER TABLE public.roles ADD CONSTRAINT roles_pkey PRIMARY KEY (id);

-- Foreign Keys
ALTER TABLE public.academic_term ADD CONSTRAINT academic_term_new_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_year(id);
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;

-- Indexes
CREATE UNIQUE INDEX academic_year_new_year_key ON public.academic_year USING btree (year);
CREATE UNIQUE INDEX academic_term_new_unique_term ON public.academic_term USING btree (term_name, semester, academic_year_id);
CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);
CREATE UNIQUE INDEX permissions_permission_string_key ON public.permissions USING btree (permission_string);
CREATE UNIQUE INDEX role_permissions_unique_pair ON public.role_permissions USING btree (role_id, permission_id);