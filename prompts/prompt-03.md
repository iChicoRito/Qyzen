# Objective

## Threat Assessment and Access Control Security Improvements

---

## Description

The objective is to address critical and high-priority security findings identified during a threat assessment. The assessment scanned 20 files and detected 3 findings, including 2 P0 issues and 1 P1 issue. The goal is to prevent unauthorized data exposure, restrict improper database modification access, and strengthen role-based access control policies to protect sensitive application data and maintain system integrity.

---

## Objectives Breakdown

### 1. Main Objective Area

Improve database security by fixing critical vulnerabilities related to unrestricted data export functions, insecure score modification permissions, and unrestricted user profile updates.

---

### 2. Secondary Objective Area

* Prevent unauthorized access to sensitive database records.

* Restrict modification of grading and result-related data.

* Enforce safer update controls for user profile information.

* Strengthen role-based access control policies for database operations.

---

### 3. Supporting Tasks

#### 3.1 Task Group

* Remove or secure the `export_public_schema_data` database function.

* Restrict execution access for authenticated and anonymous users.

* Prevent students from directly modifying grading-related fields in `tbl_scores`.

* Treat `tbl_scores` as server-owned state.

* Restrict updates to sensitive columns in `tbl_users`.

* Replace unrestricted update policies with secure RPC or server-side controlled updates.

* Protect privilege-related and account-sensitive fields from modification.

---

### 4. Detailed Breakdown

#### 4.1 Public Schema Data Export Protection

The `export_public_schema_data` function allows anyone with access to dump every table in the public schema, exposing sensitive records such as user data, scores, messages, and notifications.

* Delete the function from production or move it to an admin-only private schema.

* Recreate the function as `SECURITY DEFINER` with explicit access guards.

* Revoke `EXECUTE` permissions from authenticated and anonymous roles.

* Remove deployable SQL test calls related to the export function.

#### 4.2 Score Modification Access Control

Students currently have the ability to modify their own quiz score records and potentially alter pass or fail results.

* Remove direct student `UPDATE` access on `tbl_scores`.

* Separate mutable student input from computed grading fields if necessary.

* Restrict grading-related fields to trusted server roles or admin-only functions.

* Replace the existing student update policy with stricter validation checks.

#### 4.3 User Profile Update Restrictions

Users can currently update unrestricted columns in their own profile records, including potentially sensitive account fields.

##### Nested Details

* Replace blanket `UPDATE` access on `tbl_users`.
* Allow updates only for safe profile-related fields such as:

  * `given_name`
  * `surname`
  * `profile_picture`
  * `cover_photo`
* Prevent modification of sensitive fields including:

  * `user_type`
  * `email`
  * `is_active`
  * `deleted_at`
* Add triggers or separate policies to enforce restrictions on privilege-related fields.
