# Objective
## Fix Dark/Light Mode Inconsistency Across Specific Pages

---

## Description
The system currently has bugs and inconsistencies in how dark mode and light mode are applied across certain pages. When switching between modes, not all UI components update consistently — specifically, the sidebar correctly reflects the selected mode, but the main content area does not. The goal is to fix this so that all components on the affected pages respond uniformly to mode changes. The fix should ensure that switching to dark mode applies dark mode styling to both the sidebar and the page content simultaneously.

---

## Primary Objective
Resolve the bug where switching to dark mode updates the sidebar but leaves the main content area still rendering in light mode, so that both regions reflect the active mode at the same time.

---

## Supporting Tasks

### Bug Identification
- Identify all specific pages where the dark/light mode inconsistency occurs
- Confirm which components on those pages fail to respond to mode changes (e.g., main content area)

### Bug Resolution
- Fix the main content area on affected pages to correctly apply dark mode styles when dark mode is active
- Fix the main content area to correctly apply light mode styles when light mode is active
- Ensure the sidebar and the content area switch modes in sync

### Verification
- Verify the fix by toggling between light mode and dark mode on all affected pages
- Confirm that all visible components — sidebar and content area — reflect the correct mode after switching

---

## Detailed Breakdown

### The Inconsistency
When the user switches to dark mode, the sidebar correctly renders in dark mode styling. However, the main content area on the right side of the page remains in light mode. The inverse scenario (switching to light mode) appears to work correctly — all content displays in light mode. The bug is specific to the transition into dark mode.

### Scope
The issue is scoped to specific pages in the system, not all pages. The affected pages need to be identified and fixed individually.

### Evidence
The following screenshots are provided as visual proof of the bug:

| # | File Path |
|---|-----------|
| 1 | `public\Screenshot 2026-06-12 at 13-22-08 Qyzen.png` |
| 2 | `public\Screenshot 2026-06-12 at 13-22-19 Qyzen.png` |

Both screenshots confirm the inconsistency: the sidebar is rendered in dark mode while the main content area on the right side remains in light mode.