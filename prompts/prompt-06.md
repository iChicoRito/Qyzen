# Objective
## Terminology Migration: "Module" → "Assessment" Across Codebase and Database

---

## Description
The system currently uses the word "module" throughout its codebase and database, which is considered inaccurate given that "module" and "assessment" carry different meanings. The goal is to migrate all instances of the terminology "module" to "assessment" across the entire system. This is classified as a major revision and requires a full scan and analysis of the codebase before any implementation begins. Before any database changes are made, the entire Supabase database schema must be backed up. The database must then be updated strictly in line with the changes made to the codebase.

---

## Primary Objective
Replace all occurrences of the terminology "module" with "assessment" across the entire codebase and database — ensuring semantic accuracy between the two terms throughout the system.

---

## Secondary Objectives
- Back up the entire Supabase database schema before any database modifications are made.
- Update the Supabase database schema strictly based on the results of the codebase migration.

---

## Supporting Tasks

### Phase 0 — Database Backup
- Back up the entire Supabase database schema before any changes are made to the database or codebase
- Confirm the backup is complete and valid before proceeding to any subsequent phase

### Phase 1 — Codebase Scanning
- Scan the entire codebase to locate all occurrences of the word "module" (and its variants, e.g., `Module`, `MODULE`, `modules`)
- Analyze each occurrence in context to confirm it refers to the terminology being migrated

### Phase 2 — Planning
- Create a plan based on the scan results before implementing any changes
- Identify all affected files, components, variables, labels, routes, and references
- Identify all affected database tables, columns, values, and constraints

### Phase 3 — Implementation
- Replace all terminology instances of "module" with "assessment" in the codebase
- Update the Supabase database schema entries, column names, table names, or values that use "module" terminology — strictly based on the migration plan

### Phase 4 — Verification
- Re-analyze the codebase after implementation to confirm no instances of "module" terminology remain
- Verify Supabase database integrity and schema consistency after updates

---

## Detailed Breakdown

### Pre-Implementation Requirement — Database Backup
The entire Supabase database schema must be backed up **before** any changes are made — to either the database or the codebase. No database modification may proceed without a confirmed, valid backup in place.

### Pre-Implementation Requirement — Codebase Scan
A full codebase scan and analysis must be completed before any changes are made. This is explicitly required as a prerequisite step — no implementation should begin without it.

### Planning Requirement
A plan must be formulated from the scan results. Implementation follows the plan, not the other way around. The sequence is strictly: **backup → scan → analyze → plan → implement.**

### Database Update Requirement
The Supabase database must be updated as part of this revision. The update must align strictly with the codebase migration plan and must not be performed before the backup in Phase 0 is confirmed complete. This is a major revision — the database re-analysis is required, not assumed.

### Scope
The migration covers the **overall system** — no part of the codebase or database is excluded from the scan, the backup, or the terminology replacement.