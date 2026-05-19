const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

// readFile - load a repo file as text
function readFile(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

// expectIncludes - verify a file contains the expected text
function expectIncludes(filePath, expectedText) {
  const content = readFile(filePath)

  assert.ok(
    content.includes(expectedText),
    `${filePath} should include: ${expectedText}`
  )
}

// expectExcludes - verify a file does not contain the forbidden text
function expectExcludes(filePath, forbiddenText) {
  const content = readFile(filePath)

  assert.ok(
    !content.includes(forbiddenText),
    `${filePath} should not include: ${forbiddenText}`
  )
}

// main - verify the security hardening contract
function main() {
  expectIncludes('src/lib/validations/profile-settings.schema.ts', "email: z.string().trim().email('A valid email is required.')")
  expectIncludes('src/lib/validations/profile-settings.schema.ts', "Students cannot change their given name.")
  expectIncludes('src/app/api/profile/settings/route.ts', 'ensureUniqueEmail')
  expectIncludes('src/app/api/profile/settings/route.ts', 'auth.admin.updateUserById')
  expectIncludes('src/app/(profile)/profile/profile-settings-form.tsx', 'name="email"')
  expectIncludes('src/app/(profile)/profile/profile-settings-form.tsx', 'Students can update email and media only.')
  expectIncludes('src/app/api/student/assessment/scores/[moduleId]/route.ts', 'const adminClient = createAdminClient()')
  expectIncludes('database/functions/export_public_schema_data.sql', 'DROP FUNCTION IF EXISTS public.export_public_schema_data();')
  expectExcludes('database/policies/apply_scores_rbac_policies.sql', 'CREATE POLICY "Student score create access"')
  expectExcludes('database/policies/apply_scores_rbac_policies.sql', 'CREATE POLICY "Student score update access"')
  expectIncludes('database/sql/triggers/enforce_tbl_users_self_service_update_columns.sql', 'Only safe profile fields can be updated from self-service flows.')
  expectExcludes('database/sql/triggers/enforce_tbl_users_self_service_update_columns.sql', 'NEW.email IS DISTINCT FROM OLD.email')

  console.log('Security hardening checks passed.')
}

main()
