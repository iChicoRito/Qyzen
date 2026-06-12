# Module to Assessment Whitelist

Reviewed on 2026-06-12 for the assessment-domain terminology migration.

These remaining `module` references are intentional and should not be renamed:

- `database/schema/DatabaseSchema.sql`
  - `public.tbl_permissions.module` is the admin feature-grouping column, not the assessment domain.
- `scripts/test-admin-dashboard-helpers.cjs`
  - TypeScript compiler options `module` and `esModuleInterop` are language/tooling terms.
- `tsconfig.json`
  - The `compilerOptions.module` setting is a TypeScript config term.
- `src/types/spreadsheet-modules.d.ts`
  - `declare module 'exceljs'` is a TypeScript module declaration.
- `src/app/(admin)/admin/access-control/**`
  - Uses `module` to describe admin access-control groupings.
- `src/lib/supabase/access-control.ts`
  - Uses `module` for admin access-control groupings, not assessments.
- `prompts/**` and other historical planning/spec artifacts
  - Historical references are preserved as authored.
- `docs/superpowers/specs/**`
  - Historical design docs are preserved as authored.
- `src/app/template/**` and demo JSON/task seed content
  - Placeholder/template content may use generic `module` wording that is unrelated to the assessment domain.
- `database/sql/migrations/rename_modules_to_assessments.sql`
  - The migration intentionally references old `module` names so it can rename them in the live database.
- `pnpm-lock.yaml`
  - Dependency metadata may contain package/module terminology that is unrelated to the assessment domain.
