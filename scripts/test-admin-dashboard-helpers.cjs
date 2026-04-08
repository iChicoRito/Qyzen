const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const ts = require('typescript')

// loadHelperModule - transpile the TypeScript helper file and require it as CommonJS
function loadHelperModule() {
  const sourcePath = path.join(process.cwd(), 'src', 'lib', 'supabase', 'admin-dashboard-helpers.ts')
  const sourceCode = fs.readFileSync(sourcePath, 'utf8')
  const transpiledCode = ts.transpileModule(sourceCode, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText

  const tempFilePath = path.join(os.tmpdir(), 'admin-dashboard-helpers.test.cjs')
  fs.writeFileSync(tempFilePath, transpiledCode, 'utf8')

  delete require.cache[tempFilePath]
  return require(tempFilePath)
}

// createSource - build a compact dashboard source fixture
function createSource() {
  return {
    users: [
      {
        id: 1,
        user_type: 'student',
        user_id: 'STU-001',
        given_name: 'Ava',
        surname: 'Stone',
        email: 'ava@example.com',
        is_active: true,
        deleted_at: null,
      },
      {
        id: 2,
        user_type: 'student',
        user_id: 'STU-002',
        given_name: 'Noah',
        surname: 'Reed',
        email: 'noah@example.com',
        is_active: true,
        deleted_at: null,
      },
      {
        id: 10,
        user_type: 'educator',
        user_id: 'EDU-001',
        given_name: 'Eli',
        surname: 'Hart',
        email: 'eli@example.com',
        is_active: true,
        deleted_at: null,
      },
    ],
    sections: [
      {
        id: 100,
        educator_id: 10,
        section_name: 'Section A',
        is_active: true,
      },
    ],
    subjects: [
      {
        id: 200,
        educator_id: 10,
        sections_id: 100,
        subject_name: 'Mathematics',
        subject_code: 'MATH-101',
        is_active: true,
      },
    ],
    modules: [
      {
        id: 300,
        educator_id: 10,
        subject_id: 200,
        section_id: 100,
        module_code: 'MOD-1',
        is_active: true,
      },
      {
        id: 301,
        educator_id: 10,
        subject_id: 200,
        section_id: 100,
        module_code: 'MOD-2',
        is_active: true,
      },
    ],
    enrollments: [
      {
        id: 400,
        student_id: 1,
        educator_id: 10,
        subject_id: 200,
        is_active: true,
        created_at: '2026-01-15T00:00:00.000Z',
      },
      {
        id: 401,
        student_id: 2,
        educator_id: 10,
        subject_id: 200,
        is_active: true,
        created_at: '2026-02-10T00:00:00.000Z',
      },
    ],
    scores: [
      {
        id: 500,
        student_id: 1,
        educator_id: 10,
        module_id: 300,
        subject_id: 200,
        section_id: 100,
        score: 6,
        total_questions: 10,
        status: 'failed',
        is_passed: false,
        submitted_at: '2026-03-01T08:00:00.000Z',
        created_at: '2026-03-01T08:00:00.000Z',
      },
      {
        id: 501,
        student_id: 1,
        educator_id: 10,
        module_id: 300,
        subject_id: 200,
        section_id: 100,
        score: 9,
        total_questions: 10,
        status: 'passed',
        is_passed: true,
        submitted_at: '2026-03-02T08:00:00.000Z',
        created_at: '2026-03-02T08:00:00.000Z',
      },
      {
        id: 502,
        student_id: 1,
        educator_id: 10,
        module_id: 301,
        subject_id: 200,
        section_id: 100,
        score: 8,
        total_questions: 10,
        status: 'submitted',
        is_passed: false,
        submitted_at: '2026-03-03T08:00:00.000Z',
        created_at: '2026-03-03T08:00:00.000Z',
      },
      {
        id: 503,
        student_id: 2,
        educator_id: 10,
        module_id: 300,
        subject_id: 200,
        section_id: 100,
        score: 7,
        total_questions: 10,
        status: 'passed',
        is_passed: true,
        submitted_at: '2026-03-04T08:00:00.000Z',
        created_at: '2026-03-04T08:00:00.000Z',
      },
      {
        id: 504,
        student_id: 2,
        educator_id: 10,
        module_id: 301,
        subject_id: 200,
        section_id: 100,
        score: 4,
        total_questions: 10,
        status: 'in_progress',
        is_passed: false,
        submitted_at: null,
        created_at: '2026-03-05T08:00:00.000Z',
      },
    ],
  }
}

// main - run helper assertions and exit non-zero on failure
function main() {
  const {
    buildAdminDashboardAnalytics,
    getLatestScoreContext,
    getLatestScoresByStudentModule,
  } = loadHelperModule()

  const latestScoreMap = getLatestScoresByStudentModule(createSource().scores)
  assert.equal(latestScoreMap.get('1:300').id, 501, 'latest score should win by id')
  assert.equal(getLatestScoreContext(latestScoreMap.get('1:301')).isFinished, true, 'submitted rows count as finished')
  assert.equal(getLatestScoreContext(latestScoreMap.get('1:301')).isPassed, false, 'submitted rows must not count as passed')
  assert.equal(getLatestScoreContext(latestScoreMap.get('2:301')).latestState, 'inProgress', 'active attempt should stay in progress')

  const analytics = buildAdminDashboardAnalytics(createSource(), new Date('2026-04-08T00:00:00.000Z'))

  assert.equal(analytics.assessmentOverview.enrolledStudents, 2, 'enrolled student total should be unique by student')
  assert.equal(analytics.assessmentOverview.finishedAssessments, 3, 'finished count should use latest submitted attempts')
  assert.equal(analytics.assessmentOverview.passedAssessments, 2, 'passed count should only include latest passed attempts')
  assert.equal(analytics.assessmentOverview.failedAssessments, 0, 'older failed attempts should be ignored when a newer score exists')
  assert.equal(analytics.topStudents[0].studentId, 1, 'higher weighted average should rank first')
  assert.equal(analytics.topStudents[0].weightedAverage, 85, 'weighted average should use latest finished attempts only')
  assert.equal(analytics.topStudents[1].studentId, 2, 'second student should remain in the ranking')

  console.log('Admin dashboard helper checks passed.')
}

main()
