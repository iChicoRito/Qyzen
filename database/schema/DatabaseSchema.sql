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

CREATE TABLE public.tbl_sections (
  id bigint NOT NULL,
  educator_id bigint NOT NULL,
  academic_term_id bigint NOT NULL,
  section_name text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.tbl_sections_term (
  id bigint NOT NULL,
  section_id bigint NOT NULL,
  academic_term_id bigint NOT NULL
);

CREATE TABLE public.tbl_subjects (
  id bigint NOT NULL,
  educator_id bigint NOT NULL,
  sections_id bigint NOT NULL,
  subject_code text NOT NULL,
  subject_name text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS tbl_user_roles_id_seq;
CREATE TABLE public.tbl_user_roles (
  id bigint DEFAULT nextval('tbl_user_roles_id_seq'::regclass) NOT NULL,
  user_id bigint NOT NULL,
  role_id bigint NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  deleted_at timestamp with time zone
);

CREATE SEQUENCE IF NOT EXISTS tbl_users_id_seq;
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

ALTER TABLE public.tbl_academic_term ADD CONSTRAINT academic_term_new_pkey PRIMARY KEY (id);
ALTER TABLE public.tbl_academic_year ADD CONSTRAINT academic_year_new_pkey PRIMARY KEY (id);
ALTER TABLE public.tbl_permissions ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);
ALTER TABLE public.tbl_role_permissions ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);
ALTER TABLE public.tbl_roles ADD CONSTRAINT roles_pkey PRIMARY KEY (id);
ALTER TABLE public.tbl_sections ADD CONSTRAINT tbl_sections_pkey PRIMARY KEY (id);
ALTER TABLE public.tbl_sections_term ADD CONSTRAINT tbl_sections_term_pkey PRIMARY KEY (id);
ALTER TABLE public.tbl_subjects ADD CONSTRAINT tbl_subjects_pkey PRIMARY KEY (id);
ALTER TABLE public.tbl_user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
ALTER TABLE public.tbl_users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

-- Foreign Keys

ALTER TABLE public.tbl_academic_term ADD CONSTRAINT academic_term_new_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.tbl_academic_year(id);
ALTER TABLE public.tbl_role_permissions ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.tbl_permissions(id) ON DELETE CASCADE;
ALTER TABLE public.tbl_role_permissions ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.tbl_roles(id) ON DELETE CASCADE;
ALTER TABLE public.tbl_sections ADD CONSTRAINT tbl_sections_academic_term_id_fkey FOREIGN KEY (academic_term_id) REFERENCES public.tbl_academic_term(id);
ALTER TABLE public.tbl_sections ADD CONSTRAINT tbl_sections_educator_id_fkey FOREIGN KEY (educator_id) REFERENCES public.tbl_users(id) ON DELETE CASCADE;
ALTER TABLE public.tbl_sections_term ADD CONSTRAINT tbl_sections_term_academic_term_id_fkey FOREIGN KEY (academic_term_id) REFERENCES public.tbl_academic_term(id) ON DELETE CASCADE;
ALTER TABLE public.tbl_sections_term ADD CONSTRAINT tbl_sections_term_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.tbl_sections(id) ON DELETE CASCADE;
ALTER TABLE public.tbl_subjects ADD CONSTRAINT tbl_subjects_educator_id_fkey FOREIGN KEY (educator_id) REFERENCES public.tbl_users(id) ON DELETE CASCADE;
ALTER TABLE public.tbl_subjects ADD CONSTRAINT tbl_subjects_sections_id_fkey FOREIGN KEY (sections_id) REFERENCES public.tbl_sections(id) ON DELETE CASCADE;
ALTER TABLE public.tbl_user_roles ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.tbl_roles(id) ON DELETE CASCADE;
ALTER TABLE public.tbl_user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.tbl_users(id) ON DELETE CASCADE;

-- Indexes

CREATE UNIQUE INDEX academic_year_new_year_key ON public.tbl_academic_year USING btree (year);
CREATE UNIQUE INDEX academic_term_new_unique_term ON public.tbl_academic_term USING btree (term_name, semester, academic_year_id);
CREATE UNIQUE INDEX roles_name_key ON public.tbl_roles USING btree (name);
CREATE UNIQUE INDEX permissions_permission_string_key ON public.tbl_permissions USING btree (permission_string);
CREATE UNIQUE INDEX role_permissions_unique_pair ON public.tbl_role_permissions USING btree (role_id, permission_id);
CREATE UNIQUE INDEX users_user_id_key ON public.tbl_users USING btree (user_id);
CREATE UNIQUE INDEX users_email_key ON public.tbl_users USING btree (email);
CREATE INDEX idx_users_user_type ON public.tbl_users USING btree (user_type);
CREATE INDEX idx_users_user_id ON public.tbl_users USING btree (user_id);
CREATE INDEX idx_users_email ON public.tbl_users USING btree (email);
CREATE UNIQUE INDEX user_roles_user_role_unique ON public.tbl_user_roles USING btree (user_id, role_id);
CREATE INDEX idx_user_roles_user_id ON public.tbl_user_roles USING btree (user_id);
CREATE INDEX idx_user_roles_role_id ON public.tbl_user_roles USING btree (role_id);
CREATE INDEX idx_tbl_sections_educator_id ON public.tbl_sections USING btree (educator_id);
CREATE INDEX idx_tbl_sections_academic_term_id ON public.tbl_sections USING btree (academic_term_id);
CREATE INDEX idx_tbl_sections_section_name ON public.tbl_sections USING btree (section_name);
CREATE UNIQUE INDEX tbl_sections_term_unique_pair ON public.tbl_sections_term USING btree (section_id, academic_term_id);
CREATE INDEX idx_tbl_sections_term_section_id ON public.tbl_sections_term USING btree (section_id);
CREATE INDEX idx_tbl_sections_term_academic_term_id ON public.tbl_sections_term USING btree (academic_term_id);
CREATE UNIQUE INDEX tbl_subjects_unique_code_per_section ON public.tbl_subjects USING btree (educator_id, sections_id, subject_code);
CREATE UNIQUE INDEX tbl_subjects_unique_name_per_section ON public.tbl_subjects USING btree (educator_id, sections_id, subject_name);
CREATE INDEX idx_tbl_subjects_educator_id ON public.tbl_subjects USING btree (educator_id);
CREATE INDEX idx_tbl_subjects_sections_id ON public.tbl_subjects USING btree (sections_id);
CREATE INDEX idx_tbl_subjects_subject_code ON public.tbl_subjects USING btree (subject_code);
CREATE INDEX idx_tbl_subjects_subject_name ON public.tbl_subjects USING btree (subject_name);

-- Enable RLS

ALTER TABLE public.tbl_academic_year ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_academic_term ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_sections_term ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_subjects ENABLE ROW LEVEL SECURITY;

-- RLS Policies

CREATE POLICY "Admin full access on tbl_users" ON public.tbl_users AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role('admin'::text))
  WITH CHECK (has_role('admin'::text));

CREATE POLICY "Admin full access on tbl_user_roles" ON public.tbl_user_roles AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role('admin'::text))
  WITH CHECK (has_role('admin'::text));

CREATE POLICY "Admin full access on tbl_roles" ON public.tbl_roles AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role('admin'::text))
  WITH CHECK (has_role('admin'::text));

CREATE POLICY "Admin full access on tbl_role_permissions" ON public.tbl_role_permissions AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role('admin'::text))
  WITH CHECK (has_role('admin'::text));

CREATE POLICY "Admin full access on tbl_permissions" ON public.tbl_permissions AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role('admin'::text))
  WITH CHECK (has_role('admin'::text));

CREATE POLICY "Admin full access on tbl_academic_year" ON public.tbl_academic_year AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role('admin'::text))
  WITH CHECK (has_role('admin'::text));

CREATE POLICY "Admin full access on tbl_academic_term" ON public.tbl_academic_term AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role('admin'::text))
  WITH CHECK (has_role('admin'::text));

CREATE POLICY "Users can read own profile" ON public.tbl_users AS PERMISSIVE FOR SELECT TO authenticated
  USING ((email = auth.email()));

CREATE POLICY "Users can read own role links" ON public.tbl_user_roles AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id = get_current_tbl_user_id()));

CREATE POLICY "Authenticated users can read active roles" ON public.tbl_roles AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_active = true));

CREATE POLICY "Authenticated users can read active permissions" ON public.tbl_permissions AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_active = true));

CREATE POLICY "Authenticated users can read role permissions" ON public.tbl_role_permissions AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read active academic years" ON public.tbl_academic_year AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_active = true));

CREATE POLICY "Authenticated users can read active academic terms" ON public.tbl_academic_term AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_active = true));

CREATE POLICY "Admin full access on tbl_sections" ON public.tbl_sections AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role('admin'::text))
  WITH CHECK (has_role('admin'::text));

CREATE POLICY "Admin full access on tbl_sections_term" ON public.tbl_sections_term AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role('admin'::text))
  WITH CHECK (has_role('admin'::text));

CREATE POLICY "Admin full access on tbl_subjects" ON public.tbl_subjects AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role('admin'::text))
  WITH CHECK (has_role('admin'::text));

CREATE POLICY "Educator section view access" ON public.tbl_sections AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_role('educator'::text) AND (educator_id = get_current_tbl_user_id()) AND user_has_permission('sections:view'::text)));

CREATE POLICY "Educator section create access" ON public.tbl_sections AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((has_role('educator'::text) AND (educator_id = get_current_tbl_user_id()) AND user_has_permission('sections:create'::text)));

CREATE POLICY "Educator section update access" ON public.tbl_sections AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((has_role('educator'::text) AND (educator_id = get_current_tbl_user_id()) AND user_has_permission('sections:update'::text)))
  WITH CHECK ((has_role('educator'::text) AND (educator_id = get_current_tbl_user_id()) AND user_has_permission('sections:update'::text)));

CREATE POLICY "Educator section delete access" ON public.tbl_sections AS PERMISSIVE FOR DELETE TO authenticated
  USING ((has_role('educator'::text) AND (educator_id = get_current_tbl_user_id()) AND user_has_permission('sections:delete'::text)));

CREATE POLICY "Educator section term view access" ON public.tbl_sections_term AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_role('educator'::text) AND user_has_permission('sections:view'::text) AND (EXISTS ( SELECT 1
   FROM tbl_sections
  WHERE ((tbl_sections.id = tbl_sections_term.section_id) AND (tbl_sections.educator_id = get_current_tbl_user_id()))))));

CREATE POLICY "Educator section term create access" ON public.tbl_sections_term AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((has_role('educator'::text) AND user_has_permission('sections:create'::text) AND (EXISTS ( SELECT 1
   FROM tbl_sections
  WHERE ((tbl_sections.id = tbl_sections_term.section_id) AND (tbl_sections.educator_id = get_current_tbl_user_id()))))));

CREATE POLICY "Educator section term update access" ON public.tbl_sections_term AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((has_role('educator'::text) AND user_has_permission('sections:update'::text) AND (EXISTS ( SELECT 1
   FROM tbl_sections
  WHERE ((tbl_sections.id = tbl_sections_term.section_id) AND (tbl_sections.educator_id = get_current_tbl_user_id()))))))
  WITH CHECK ((has_role('educator'::text) AND user_has_permission('sections:update'::text) AND (EXISTS ( SELECT 1
   FROM tbl_sections
  WHERE ((tbl_sections.id = tbl_sections_term.section_id) AND (tbl_sections.educator_id = get_current_tbl_user_id()))))));

CREATE POLICY "Educator section term delete access" ON public.tbl_sections_term AS PERMISSIVE FOR DELETE TO authenticated
  USING ((has_role('educator'::text) AND user_has_permission('sections:delete'::text) AND (EXISTS ( SELECT 1
   FROM tbl_sections
  WHERE ((tbl_sections.id = tbl_sections_term.section_id) AND (tbl_sections.educator_id = get_current_tbl_user_id()))))));

CREATE POLICY "Educator subject view access" ON public.tbl_subjects AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_role('educator'::text) AND (educator_id = get_current_tbl_user_id()) AND user_has_permission('subjects:view'::text)));

CREATE POLICY "Educator subject create access" ON public.tbl_subjects AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((has_role('educator'::text) AND (educator_id = get_current_tbl_user_id()) AND user_has_permission('subjects:create'::text)));

CREATE POLICY "Educator subject update access" ON public.tbl_subjects AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((has_role('educator'::text) AND (educator_id = get_current_tbl_user_id()) AND user_has_permission('subjects:update'::text)))
  WITH CHECK ((has_role('educator'::text) AND (educator_id = get_current_tbl_user_id()) AND user_has_permission('subjects:update'::text)));

CREATE POLICY "Educator subject delete access" ON public.tbl_subjects AS PERMISSIVE FOR DELETE TO authenticated
  USING ((has_role('educator'::text) AND (educator_id = get_current_tbl_user_id()) AND user_has_permission('subjects:delete'::text)));