# Security, Vulnerability, Performance, and Reliability Audit

Date: 2026-06-11
System: Qyzen web application
Stack reviewed: Next.js, React, Supabase, shadcn/ui, pnpm

## Executive Summary

This audit identified and remediated several concrete security issues in dependency hygiene, password reset behavior, file upload validation, HTTP security headers, and Supabase SQL function exposure. The system now has a clean production dependency audit and passes the targeted security regression checks added for this work.

The main remaining risks are operational rather than source-only: the prepared Supabase SQL hardening scripts must be applied to the live database, backup restore validation requires access to the production backup process, and load testing requires a representative deployment target. Full ESLint now executes successfully but reports pre-existing React Compiler and script lint issues outside the hardened files.

## Scope And Method

The audit covered:

- Known package vulnerabilities via `pnpm audit --prod`.
- Authentication and API behavior around password reset.
- Upload handling for profile images and learning material files.
- Spreadsheet import parsing for user, enrollment, and quiz uploads.
- Next.js security response headers.
- Supabase SQL artifacts for function search paths, execute grants, storage bucket constraints, and future public schema default privileges.
- Build, typecheck, targeted lint, and security regression verification.

Not covered in this local-only session:

- Live Supabase project policy execution checks.
- Production backup restore validation.
- Representative load testing against production-like infrastructure.
- Runtime penetration testing against a deployed environment.

## Implemented Findings And Fixes

| ID | Area | Risk | Finding | Remediation |
| --- | --- | --- | --- | --- |
| SEC-01 | Dependencies | High | Production audit exposed vulnerable transitive packages, and spreadsheet upload flows used `xlsx`, which has unresolved high-severity advisories. | Upgraded Next.js, Supabase clients, PostCSS, and affected tooling dependencies; removed `xlsx`; added pnpm overrides for vulnerable transitive ranges; production audit is now clean. |
| SEC-02 | Spreadsheet parsing | High | Upload modals parsed `.xlsx` files through SheetJS. | Added a shared ExcelJS-based reader and migrated student, enrollment, and quiz upload modals to it. |
| SEC-03 | Password reset | High | Password reset responses could reveal whether an account exists and returned provider error details. | Added a generic success response, removed raw provider/account existence messages, and added process-local rate limiting keyed by IP plus email. |
| SEC-04 | Profile image uploads | Medium | Profile image validation did not explicitly restrict uploads to safe raster image MIME types. | Restricted profile uploads to JPEG, PNG, and WebP, and explicitly rejected SVG. Updated the profile storage bucket SQL with matching MIME and size constraints. |
| SEC-05 | Learning material uploads | Medium | Learning material file size constraints were not centralized in the shared validation schema. | Added `MAX_LEARNING_MATERIAL_FILE_SIZE_BYTES` and shared validation, then reused it in create and update API routes. Updated the storage bucket SQL with a 20 MB limit. |
| SEC-06 | HTTP response headers | Medium | Security header coverage was incomplete. | Added Content Security Policy, Strict-Transport-Security, Permissions-Policy, Cross-Origin-Opener-Policy, and X-Permitted-Cross-Domain-Policies while preserving existing protective headers. |
| SEC-07 | Supabase functions | Medium | SQL functions used security-definer patterns without explicit execute revocation/grants and stable search paths. | Added explicit `SET search_path = public, pg_temp`, revoked execute from `PUBLIC`, and granted execute only to `authenticated` for the reviewed functions. |
| SEC-08 | Future database objects | Medium | New public schema objects could accidentally inherit broad API privileges depending on database defaults and project timing. | Added a migration to revoke broad default table, sequence, and function privileges for future public schema objects. |
| REL-01 | Tooling reliability | Low | ESLint configuration crashed before reporting actual project issues. | Migrated ESLint config to the Next.js 16 flat config exports. Full lint now runs and reports actionable existing issues. |

## Residual Findings And Recommendations

| ID | Area | Risk | Current Status | Recommendation |
| --- | --- | --- | --- | --- |
| OPS-01 | Supabase deployment | High | SQL hardening files are prepared locally but were not applied to a live Supabase database in this session. | Apply the new and modified SQL files through the Supabase SQL Editor or migration workflow, then verify grants, RLS, and storage bucket settings in the live project. |
| OPS-02 | Rate limiting | Medium | Password reset rate limiting is process-local. It helps local and single-instance deployments but does not coordinate across multiple server instances. | Use a shared production limiter such as Redis, Supabase-backed counters, edge middleware, or platform-native rate limiting. |
| OPS-03 | Backup integrity | Medium | Backup restore validation could not be performed without production backup access. | Schedule a restore drill against a non-production project and document recovery time, recovery point, and validation queries. |
| PERF-01 | Load testing | Medium | Build verification passed, but high-traffic simulation was not executed locally. | Run load tests against a staging deployment with representative data and monitor Supabase query latency, API response times, error rates, and memory usage. |
| REL-02 | Full lint | Medium | `eslint . --quiet` now runs but reports 48 existing errors outside the changed security files. | Triage React Compiler errors, hook dependency issues, CommonJS script rules, and render-time `Math.random()` usage in a dedicated cleanup pass. |
| REL-03 | Next.js middleware | Low | Build warns that the `middleware` file convention is deprecated. | Migrate the current middleware behavior to the newer `proxy` convention during the next framework maintenance pass. |
| PERF-02 | Chart rendering | Low | Build emits Recharts warnings about chart dimensions resolving to `-1` during prerendering. | Audit chart containers and ensure stable width/height are available before rendering charts. |

## Verification Evidence

Commands run after remediation:

```powershell
node scripts\test-security-hardening.cjs
pnpm exec tsc --noEmit
pnpm audit --prod
pnpm build
pnpm exec eslint "eslint.config.mjs" "next.config.ts" "src/lib/spreadsheets/xlsx-reader.ts" "src/lib/security/rate-limit.ts" "src/app/api/auth/reset-password/request/route.ts" "src/app/api/profile/settings/route.ts" "src/app/api/learning-materials/route.ts" "src/app/api/learning-materials/[materialId]/route.ts" "src/app/(admin)/admin/users/components/upload-students-file-modal.tsx" "src/app/(educator)/educator/enrollment/components/upload-enrollments-file-modal.tsx" "src/app/(educator)/educator/assessment/quizzes/components/upload-quiz-file-modal.tsx"
pnpm exec eslint . --quiet
```

Results:

- Security hardening regression checks: passed.
- TypeScript typecheck: passed.
- Production dependency audit: passed, no known vulnerabilities found.
- Production build: passed.
- Targeted lint for changed application/configuration files: passed.
- Full project lint: failed with 48 existing errors outside the changed application/configuration files.

## External Guidance Referenced

Supabase guidance reviewed during the audit:

- [Supabase product security](https://supabase.com/docs/guides/security/product-security)
- [Securing your API](https://supabase.com/docs/guides/api/securing-your-api)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase changelog](https://supabase.com/changelog)

Key interpretation: RLS remains the primary authorization control for exposed tables, but SQL grants and function execute privileges are still important. The audit therefore hardened both function-level privileges and default privileges for future public schema objects.
