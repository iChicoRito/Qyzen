# Admin Dashboard Real Data Design

**Date:** 2026-04-06

**Source Requirements:** [prompts/AdminDashboard.md](../../../prompts/AdminDashboard.md)

## Goal

Replace the placeholder admin dashboard with a real data dashboard that shows:
- top summary widget cards for total students, educators, sections, and subjects
- a main chart for student totals per subject and section with educator context
- pass/fail assessment totals based on the latest submitted result per student per module
- read-only summary tabs for students, educators, sections, and subjects

## Confirmed Product Decisions

- The four primary KPI cards are:
  - total students
  - total educators
  - total sections
  - total subjects
- The main analytics view defaults to:
  - students per subject and section
  - educator name shown as context in labels or tooltips
- The lower tabbed area is:
  - read-only summary tables
  - not full management CRUD tables
- Passed and failed totals are counted by:
  - the latest submitted assessment result for each student and module pair

## Existing Codebase Context

- The current admin dashboard route is [src/app/(admin)/admin/dashboard/page.tsx](../../../src/app/(admin)/admin/dashboard/page.tsx).
- The current dashboard components are template-driven placeholders:
  - [src/app/(admin)/admin/dashboard/components/section-cards.tsx](../../../src/app/(admin)/admin/dashboard/components/section-cards.tsx)
  - [src/app/(admin)/admin/dashboard/components/chart-area-interactive.tsx](../../../src/app/(admin)/admin/dashboard/components/chart-area-interactive.tsx)
  - [src/app/(admin)/admin/dashboard/components/data-table.tsx](../../../src/app/(admin)/admin/dashboard/components/data-table.tsx)
- The current placeholder components do not fit the project protocol because they rely on template data, `lucide-react`, and gradient styling.
- The schema already supports the required dashboard data through:
  - `tbl_users`
  - `tbl_sections`
  - `tbl_subjects`
  - `tbl_enrolled`
  - `tbl_scores`
- Admin access policies already exist in [database/schema/DatabaseSchema.sql](../../../database/schema/DatabaseSchema.sql), so this feature can be built from existing tables without database schema changes.

## Recommended Architecture

Use a server-driven dashboard with one admin analytics loader that gathers and shapes all dashboard data on the server before rendering.

This is the recommended approach because it:
- matches the current route structure best
- keeps data access centralized
- avoids unnecessary client-side fetching
- makes pass/fail aggregation easier to test
- keeps the feature scoped to dashboard requirements instead of duplicating management-page behavior

## Data Model For The Dashboard

The dashboard will be backed by one typed analytics payload with these sections.

### KPI Summary

- `totalStudents`
- `totalEducators`
- `totalSections`
- `totalSubjects`

These values are global active counts for the admin surface. Users will be counted from `tbl_users` with `deleted_at IS NULL`, using `user_type` to separate students and educators. Sections and subjects will be counted from their own tables.

### Enrollment Distribution

This chart dataset will group records by:
- subject
- section

Each chart data point will also include:
- educator name
- enrolled student count

Data will be derived by joining:
- `tbl_enrolled`
- `tbl_subjects`
- `tbl_sections`
- `tbl_users` for educator names

The chart grouping key will be the specific subject row and its related section so each classroom-style assignment is shown distinctly.

### Assessment Outcome Summary

Pass/fail totals will come from `tbl_scores` using only the latest submitted record for each:
- `student_id`
- `module_id`

Statuses will be counted as:
- `passed`
- `failed`

Rows with no submitted result will not be included in pass/fail totals. `in_progress` and plain `submitted` rows will not be counted as passed or failed unless the latest status is explicitly `passed` or `failed`.

### Summary Table Datasets

The four tabs will expose read-only dashboard summaries for:
- students
- educators
- sections
- subjects

Each dataset will be concise and dashboard-oriented.

Planned fields:

**Students**
- student ID
- full name
- email
- status
- active enrollment count

**Educators**
- educator ID
- full name
- email
- status
- section count
- subject count
- enrolled student count

**Sections**
- section name
- status
- educator name
- subject count
- enrolled student count

**Subjects**
- subject code
- subject name
- status
- section name
- educator name
- enrolled student count

## UI Design

The page will be reorganized into three dashboard blocks.

### Block 1: Summary Widgets

The top row will render four compact metric cards styled to match the user-provided reference image in feel, while still following project protocol.

The cards will use:
- dark card surfaces already supported by the theme
- solid-color accents only
- Tabler icons only
- modest spacing and sizing

Each card will show:
- an icon
- a metric label
- the total value
- a short contextual footer or helper line

Because the approved top metrics are absolute totals, the cards will not show fake percentage trends. Any secondary text will describe the type of count instead of inventing period-over-period change values.

### Block 2: Analytics Charts

This block will contain:
- one primary chart for student totals per subject and section
- one secondary chart or compact summary for pass/fail totals

#### Primary Chart Choice

Use a bar chart for the subject-section enrollment view.

Reason:
- this feature compares counts across named categories
- bar charts are easier to scan than area charts for category comparisons
- the current template area chart is time-series oriented and does not fit this data

The x-axis will represent subject and section labels. The tooltip will include:
- full subject name
- section name
- educator name
- enrolled total

If the number of categories is large, the component should remain readable by limiting label density and relying on tooltips for full details.

#### Secondary Chart Choice

Use a compact bar chart or donut chart for pass/fail totals.

Reason:
- the data is a simple two-group comparison
- the visualization should stay compact relative to the main chart

The final implementation can choose between those two as long as the result remains compact, solid-colored, and readable within the dashboard layout.

### Block 3: Read-Only Summary Tabs

The bottom section will use tabs labeled:
- Students
- Educators
- Sections
- Subjects

Each tab will render a lightweight summary table with:
- read-only rows
- pagination
- a simple empty state

These tables should not reproduce the current management-page editing flows, row actions, drag-and-drop behavior, or form drawers. The goal is fast admin overview, not full record management from the dashboard.

## Component Boundaries

The feature should replace the current placeholder dashboard pieces with focused dashboard components.

Planned boundaries:

- `page.tsx`
  - server route that loads one analytics payload and composes the dashboard
- admin analytics data module under `src/lib/supabase/`
  - server-side aggregate queries and data shaping
- summary cards component
  - presentational rendering for the four KPI cards
- enrollment chart component
  - presentational rendering for subject-section student totals
- assessment outcome component
  - presentational rendering for passed and failed totals
- summary tabs component
  - presentational rendering for the four read-only table datasets

This separation keeps query logic out of UI components and prevents the current template dashboard file pattern from leaking into the new feature.

## Error Handling And Empty States

The dashboard should fail safely and remain understandable when data is missing.

Planned behavior:
- if analytics queries fail, the page shows a clear dashboard-level fallback state
- if a chart has no data, render an empty card with `No data found`
- if a summary tab dataset is empty, render an empty table state
- if pass/fail data is empty because no submitted assessments exist yet, show zeros and an explanatory note

## Testing Strategy

The implementation plan should include tests for:
- analytics aggregation and mapping logic
- latest submitted score selection for pass/fail counts
- summary table row shaping
- component rendering for populated and empty states

The highest-risk logic is the latest-result calculation for assessment outcomes, so that logic should be isolated and tested directly.

## Out Of Scope

The following are intentionally not part of this feature:
- creating new database tables
- changing RLS policies
- adding CRUD actions to dashboard tables
- adding period-over-period KPI trends
- duplicating the full admin management screens inside the dashboard
- introducing client-side global state or data fetching abstractions

## Implementation Notes For The Next Phase

- The design should follow the Next.js shadcn Supabase protocol already activated for this repo.
- Replacement dashboard components must use Tabler icons only.
- Replacement dashboard components must use solid-color styling only.
- The current placeholder admin dashboard components are expected to be replaced or substantially rewritten rather than lightly edited.
- The implementation plan should stay scoped to the requirements in `prompts/AdminDashboard.md`.
