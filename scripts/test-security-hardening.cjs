const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

// readJson - load a repo json file
function readJson(relativePath) {
  return JSON.parse(readFile(relativePath))
}

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

// expectDependencyMissing - verify a dependency has been removed
function expectDependencyMissing(packageName) {
  const packageJson = readJson('package.json')
  const allDependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }

  assert.equal(
    allDependencies[packageName],
    undefined,
    `${packageName} should not be listed in package.json`
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
  expectDependencyMissing('xlsx')
  expectIncludes('next.config.ts', 'Content-Security-Policy')
  expectIncludes('next.config.ts', 'Strict-Transport-Security')
  expectIncludes('next.config.ts', 'Permissions-Policy')
  expectIncludes('src/app/api/auth/reset-password/request/route.ts', 'RESET_PASSWORD_SUCCESS_MESSAGE')
  expectIncludes('src/app/api/auth/reset-password/request/route.ts', 'checkRateLimit')
  expectExcludes('src/app/api/auth/reset-password/request/route.ts', "We couldn't find an account")
  expectExcludes('src/app/api/auth/reset-password/request/route.ts', 'userError.message')
  expectExcludes('src/app/api/auth/reset-password/request/route.ts', 'resetError.message')
  expectIncludes('src/lib/security/rate-limit.ts', 'createRateLimit')
  expectIncludes('src/app/api/profile/settings/route.ts', "ALLOWED_PROFILE_IMAGE_TYPES")
  expectIncludes('src/app/api/profile/settings/route.ts', "image/svg+xml")
  expectIncludes('src/lib/validations/learning-materials.schema.ts', 'MAX_LEARNING_MATERIAL_FILE_SIZE_BYTES')
  expectIncludes('src/app/api/learning-materials/route.ts', 'validateLearningMaterialFileSize')
  expectIncludes('src/app/api/learning-materials/[materialId]/route.ts', 'validateLearningMaterialFileSize')
  expectExcludes('src/app/(admin)/admin/users/components/upload-students-file-modal.tsx', "from 'xlsx'")
  expectExcludes('src/app/(educator)/educator/enrollment/components/upload-enrollments-file-modal.tsx', "from 'xlsx'")
  expectExcludes('src/app/(educator)/educator/assessment/quizzes/components/upload-quiz-file-modal.tsx', "from 'xlsx'")
  expectIncludes('src/lib/spreadsheets/xlsx-reader.ts', 'workbook.xlsx.load')
  expectIncludes('src/app/(admin)/admin/users/components/upload-students-file-modal.tsx', 'readFirstWorksheetRows')
  expectIncludes('src/app/(educator)/educator/enrollment/components/upload-enrollments-file-modal.tsx', 'readFirstWorksheetRows')
  expectIncludes('src/app/(educator)/educator/assessment/quizzes/components/upload-quiz-file-modal.tsx', 'readFirstWorksheetRows')
  expectIncludes('database/functions/create_user_has_permission_function.sql', 'REVOKE ALL ON FUNCTION public.user_has_permission(TEXT) FROM PUBLIC;')
  expectIncludes('database/functions/create_user_has_permission_function.sql', 'GRANT EXECUTE ON FUNCTION public.user_has_permission(TEXT) TO authenticated;')
  expectIncludes('database/functions/create_get_group_chat_list_function.sql', 'REVOKE ALL ON FUNCTION public.get_group_chat_list() FROM PUBLIC;')
  expectIncludes('database/functions/create_get_group_chat_messages_function.sql', 'REVOKE ALL ON FUNCTION public.get_group_chat_messages(BIGINT) FROM PUBLIC;')

  console.log('Security hardening checks passed.')
}

main()
