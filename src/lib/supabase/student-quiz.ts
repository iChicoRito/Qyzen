import { createClient } from './server'

export const QUIZ_RESULT_PASSING_PERCENTAGE = 75

export interface StudentQuizChoice {
  key: 'A' | 'B' | 'C' | 'D'
  value: string
}

export interface StudentQuizQuestion {
  id: number
  question: string
  quizType: 'multiple_choice' | 'identification'
  choices: StudentQuizChoice[]
}

export interface StudentQuizSession {
  moduleRowId: number
  moduleId: string
  moduleCode: string
  subjectId: number
  subjectName: string
  sectionId: number
  sectionName: string
  educatorId: number
  educatorName: string
  educatorUserType: 'educator'
  termName: string
  timeLimitMinutes: number
  cheatingAttempts: number
  isShuffle: boolean
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  questions: StudentQuizQuestion[]
  existingScoreId: number | null
  existingAnswers: Record<string, string>
  warningAttempts: number
  takenAt: string | null
  submittedAt: string | null
  status: 'in_progress' | 'submitted' | 'passed' | 'failed' | null
  score: number | null
  totalQuestions: number
  isPassed: boolean
}

interface StudentQuizQuestionWithAnswers extends StudentQuizQuestion {
  correctAnswer: string
  correctAnswers: string[]
}

export interface StudentQuizGradingSession extends Omit<StudentQuizSession, 'questions'> {
  questions: StudentQuizQuestionWithAnswers[]
}

export interface StudentQuizResult {
  scoreId: number
  moduleRowId: number
  moduleCode: string
  subjectName: string
  sectionName: string
  educatorName: string
  termName: string
  score: number
  totalQuestions: number
  percentage: number
  isPassed: boolean
  status: 'passed' | 'failed'
  submittedAt: string | null
  takenAt: string | null
}

export interface StudentQuizReviewQuestion {
  id: number
  question: string
  quizType: 'multiple_choice' | 'identification'
  choices: StudentQuizChoice[]
  correctAnswers: string[]
  studentAnswer: string
  isCorrect: boolean
}

export interface StudentQuizReviewResult extends StudentQuizResult {
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  timeLimitMinutes: number
  isShuffle: boolean
  warningAttempts: number
  questions: StudentQuizReviewQuestion[]
}

interface EnrollmentRow {
  student_id: number
  educator_id: number
  subject_id: number
  is_active: boolean
}

interface ModuleSubjectRow {
  subject_name: string
}

interface ModuleSectionRow {
  section_name: string
}

interface ModuleEducatorRow {
  given_name: string
  surname: string
  user_type: string
}

interface ModuleTermRow {
  term_name: string
  semester: string
}

interface ModuleRow {
  id: number
  module_id: string
  module_code: string
  subject_id: number
  section_id: number
  educator_id: number
  time_limit: string
  cheating_attempts: number
  is_shuffle: boolean
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  subject: ModuleSubjectRow | ModuleSubjectRow[] | null
  section: ModuleSectionRow | ModuleSectionRow[] | null
  educator: ModuleEducatorRow | ModuleEducatorRow[] | null
  academic_term: ModuleTermRow | ModuleTermRow[] | null
}

interface QuizRow {
  id: number
  question: string
  quiz_type: 'multiple_choice' | 'identification'
  choices: unknown
  correct_answer: string
}

interface ScoreRow {
  id: number
  module_id: number
  score: number | null
  total_questions: number | null
  student_answer: unknown
  warning_attempts: number | null
  taken_at: string | null
  submitted_at: string | null
  status: 'in_progress' | 'submitted' | 'passed' | 'failed' | null
  is_passed: boolean | null
}

interface ScoreResultRow {
  id: number
  module_id: number
  score: number
  total_questions: number
  taken_at: string | null
  submitted_at: string | null
  status: 'passed' | 'failed'
  is_passed: boolean
  warning_attempts: number | null
  module: ModuleResultRow | ModuleResultRow[] | null
}

interface ModuleResultRow {
  module_code: string
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  time_limit: string
  is_shuffle: boolean
  subject: ModuleSubjectRow | ModuleSubjectRow[] | null
  section: ModuleSectionRow | ModuleSectionRow[] | null
  educator: ModuleEducatorRow | ModuleEducatorRow[] | null
  academic_term: ModuleTermRow | ModuleTermRow[] | null
}

interface ScoreReviewRow extends ScoreResultRow {
  student_answer: unknown
}

interface SupabaseErrorResponse {
  message?: string
}

// getSupabaseErrorMessage - normalize api errors
function getSupabaseErrorMessage(error: SupabaseErrorResponse | null, fallbackMessage: string) {
  return error?.message || fallbackMessage
}

// getSingleRelation - normalize supabase relation arrays
function getSingleRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] || null : value
}

// buildAcademicTermLabel - format term label
function buildAcademicTermLabel(term: ModuleTermRow | null) {
  if (!term) {
    return 'No term'
  }

  return `${term.term_name} - ${term.semester}`
}

// isEducatorUser - validate educator profile relation
function isEducatorUser(user: ModuleEducatorRow | null) {
  return user?.user_type?.trim().toLowerCase() === 'educator'
}

// normalizeChoices - convert stored choices into ui rows
function normalizeChoices(choices: unknown): StudentQuizChoice[] {
  if (!Array.isArray(choices)) {
    return []
  }

  return choices
    .map((choice) => {
      if (
        typeof choice === 'object' &&
        choice !== null &&
        'key' in choice &&
        'value' in choice &&
        (choice.key === 'A' || choice.key === 'B' || choice.key === 'C' || choice.key === 'D') &&
        typeof choice.value === 'string'
      ) {
        return {
          key: choice.key,
          value: choice.value,
        } satisfies StudentQuizChoice
      }

      return null
    })
    .filter((choice): choice is StudentQuizChoice => Boolean(choice))
}

// normalizeCorrectAnswers - convert stored correct answer values
function normalizeCorrectAnswers(quizType: 'multiple_choice' | 'identification', correctAnswer: string) {
  if (quizType === 'multiple_choice') {
    return correctAnswer ? [correctAnswer] : []
  }

  try {
    const parsedAnswers = JSON.parse(correctAnswer) as unknown

    if (!Array.isArray(parsedAnswers)) {
      return correctAnswer ? [correctAnswer] : []
    }

    return parsedAnswers.filter((answer): answer is string => typeof answer === 'string')
  } catch {
    return correctAnswer ? [correctAnswer] : []
  }
}

// normalizeStoredAnswers - normalize saved student answers
function normalizeStoredAnswers(studentAnswer: unknown) {
  if (!studentAnswer || typeof studentAnswer !== 'object' || Array.isArray(studentAnswer)) {
    return {} as Record<string, string>
  }

  return Object.entries(studentAnswer).reduce<Record<string, string>>((result, [key, value]) => {
    result[key] = typeof value === 'string' ? value : ''
    return result
  }, {})
}

// normalizeAnswerValue - normalize answer text for comparisons
function normalizeAnswerValue(value: string) {
  return value.trim().toLowerCase()
}

// buildQuestionRecord - map quiz row for ui and grading
function buildQuestionRecord(row: QuizRow): StudentQuizQuestionWithAnswers {
  const correctAnswers = normalizeCorrectAnswers(row.quiz_type, row.correct_answer)

  return {
    id: row.id,
    question: row.question,
    quizType: row.quiz_type,
    choices: normalizeChoices(row.choices),
    correctAnswer: row.correct_answer,
    correctAnswers,
  }
}

// buildSessionRecord - map database rows to quiz session
function buildSessionRecord(
  module: ModuleRow,
  quizzes: QuizRow[],
  score: ScoreRow | null
): StudentQuizGradingSession {
  const subject = getSingleRelation(module.subject)
  const section = getSingleRelation(module.section)
  const educator = getSingleRelation(module.educator)
  const term = getSingleRelation(module.academic_term)

  if (!isEducatorUser(educator)) {
    throw new Error('Module educator was not found.')
  }

  return {
    moduleRowId: module.id,
    moduleId: module.module_id,
    moduleCode: module.module_code,
    subjectId: module.subject_id,
    subjectName: subject?.subject_name || 'Unknown Subject',
    sectionId: module.section_id,
    sectionName: section?.section_name || 'Unknown Section',
    educatorId: module.educator_id,
    educatorName: `${educator.given_name} ${educator.surname}`.trim(),
    educatorUserType: 'educator',
    termName: buildAcademicTermLabel(term),
    timeLimitMinutes: Number(module.time_limit) || 0,
    cheatingAttempts: module.cheating_attempts,
    isShuffle: module.is_shuffle,
    startDate: module.start_date,
    endDate: module.end_date,
    startTime: module.start_time,
    endTime: module.end_time,
    questions: quizzes.map(buildQuestionRecord),
    existingScoreId: score?.id ?? null,
    existingAnswers: normalizeStoredAnswers(score?.student_answer ?? {}),
    warningAttempts: score?.warning_attempts ?? 0,
    takenAt: score?.taken_at ?? null,
    submittedAt: score?.submitted_at ?? null,
    status: score?.status ?? null,
    score: score?.score ?? null,
    totalQuestions: score?.total_questions ?? quizzes.length,
    isPassed: Boolean(score?.is_passed),
  }
}

// ensureStudentModuleAccess - verify enrolled student can access module
async function ensureStudentModuleAccess(studentId: number, module: ModuleRow) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tbl_enrolled')
    .select('student_id,educator_id,subject_id,is_active')
    .eq('student_id', studentId)
    .eq('educator_id', module.educator_id)
    .eq('subject_id', module.subject_id)
    .eq('is_active', true)
    .limit(1)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to validate student enrollment.'))
  }

  const enrollment = ((data || []) as EnrollmentRow[])[0]

  if (!enrollment) {
    throw new Error('You do not have access to this assessment.')
  }
}

// fetchModuleRow - load one student-accessible module row
async function fetchModuleRow(moduleId: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tbl_modules')
    .select(
      'id,module_id,module_code,subject_id,section_id,educator_id,time_limit,cheating_attempts,is_shuffle,start_date,end_date,start_time,end_time,subject:subject_id(subject_name),section:section_id(section_name),educator:educator_id(given_name,surname,user_type),academic_term:term(term_name,semester)'
    )
    .eq('id', moduleId)
    .eq('is_active', true)
    .limit(1)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load quiz module.'))
  }

  const moduleRow = ((data || []) as ModuleRow[])[0]

  if (!moduleRow) {
    throw new Error('Assessment module was not found.')
  }

  return moduleRow
}

// fetchModuleQuizzes - load student-accessible quiz rows
async function fetchModuleQuizzes(moduleId: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tbl_quizzes')
    .select('id,question,quiz_type,choices,correct_answer')
    .eq('module_id', moduleId)
    .order('id', { ascending: true })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load quiz questions.'))
  }

  return (data || []) as QuizRow[]
}

// fetchScoreDraft - load an existing student score draft
async function fetchScoreDraft(studentId: number, moduleId: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tbl_scores')
    .select(
      'id,module_id,score,total_questions,student_answer,warning_attempts,taken_at,submitted_at,status,is_passed'
    )
    .eq('student_id', studentId)
    .eq('module_id', moduleId)
    .order('id', { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load existing score data.'))
  }

  return ((data || []) as ScoreRow[])[0] || null
}

// fetchStudentQuizGradingSession - load quiz session with answer key
export async function fetchStudentQuizGradingSession(studentId: number, moduleId: number) {
  const module = await fetchModuleRow(moduleId)
  await ensureStudentModuleAccess(studentId, module)
  const [quizzes, score] = await Promise.all([
    fetchModuleQuizzes(module.id),
    fetchScoreDraft(studentId, module.id),
  ])

  if (quizzes.length === 0) {
    throw new Error('This assessment has no quiz questions yet.')
  }

  return buildSessionRecord(module, quizzes, score)
}

// fetchStudentQuizSession - load quiz session without answer key
export async function fetchStudentQuizSession(studentId: number, moduleId: number): Promise<StudentQuizSession> {
  const session = await fetchStudentQuizGradingSession(studentId, moduleId)

  return {
    ...session,
    questions: session.questions.map(({ correctAnswer: _correctAnswer, correctAnswers: _correctAnswers, ...question }) => question),
  }
}

// fetchStudentScoreResult - load one student result row
export async function fetchStudentScoreResult(studentId: number, scoreId?: number) {
  const supabase = await createClient()
  let query = supabase
    .from('tbl_scores')
    .select(
      'id,module_id,score,total_questions,taken_at,submitted_at,status,is_passed,warning_attempts,module:module_id(module_code,subject:subject_id(subject_name),section:section_id(section_name),educator:educator_id(given_name,surname,user_type),academic_term:term(term_name,semester))'
    )
    .eq('student_id', studentId)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: false })

  if (scoreId) {
    query = query.eq('id', scoreId)
  }

  const { data, error } = await query.limit(1)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load score result.'))
  }

  const scoreRow = ((data || []) as ScoreResultRow[])[0]

  if (!scoreRow) {
    return null
  }

  const module = getSingleRelation(scoreRow.module)
  const subject = getSingleRelation(module?.subject || null)
  const section = getSingleRelation(module?.section || null)
  const educator = getSingleRelation(module?.educator || null)
  const term = getSingleRelation(module?.academic_term || null)
  const percentage = scoreRow.total_questions > 0
    ? Math.round((scoreRow.score / scoreRow.total_questions) * 100)
    : 0

  return {
    scoreId: scoreRow.id,
    moduleRowId: scoreRow.module_id,
    moduleCode: module?.module_code || 'Unknown Module',
    subjectName: subject?.subject_name || 'Unknown Subject',
    sectionName: section?.section_name || 'Unknown Section',
    educatorName: `${educator?.given_name || ''} ${educator?.surname || ''}`.trim() || 'Unknown Educator',
    termName: buildAcademicTermLabel(term),
    score: scoreRow.score,
    totalQuestions: scoreRow.total_questions,
    percentage,
    isPassed: scoreRow.is_passed,
    status: scoreRow.status,
    submittedAt: scoreRow.submitted_at,
    takenAt: scoreRow.taken_at,
  } satisfies StudentQuizResult
}

// isStudentAnswerCorrect - check if student answer matches accepted answers
function isStudentAnswerCorrect(question: StudentQuizQuestionWithAnswers, studentAnswer: string) {
  const normalizedStudentAnswer = normalizeAnswerValue(studentAnswer)

  if (!normalizedStudentAnswer) {
    return false
  }

  return question.correctAnswers.some(
    (correctAnswer) => normalizeAnswerValue(correctAnswer) === normalizedStudentAnswer
  )
}

// fetchStudentQuizReviewResult - load one submitted assessment result with review data
export async function fetchStudentQuizReviewResult(studentId: number, scoreId: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tbl_scores')
    .select(
      'id,module_id,score,total_questions,student_answer,taken_at,submitted_at,status,is_passed,warning_attempts,module:module_id(module_code,start_date,end_date,start_time,end_time,time_limit,is_shuffle,subject:subject_id(subject_name),section:section_id(section_name),educator:educator_id(given_name,surname,user_type),academic_term:term(term_name,semester))'
    )
    .eq('student_id', studentId)
    .eq('id', scoreId)
    .not('submitted_at', 'is', null)
    .limit(1)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load quiz result review.'))
  }

  const scoreRow = ((data || []) as ScoreReviewRow[])[0]

  if (!scoreRow) {
    return null
  }

  const module = await fetchModuleRow(scoreRow.module_id)
  await ensureStudentModuleAccess(studentId, module)
  const quizzes = await fetchModuleQuizzes(scoreRow.module_id)
  const questionRecords = quizzes.map(buildQuestionRecord)
  const studentAnswers = normalizeStoredAnswers(scoreRow.student_answer)
  const baseResult = await fetchStudentScoreResult(studentId, scoreId)

  if (!baseResult) {
    return null
  }

  return {
    ...baseResult,
    startDate: module.start_date,
    endDate: module.end_date,
    startTime: module.start_time,
    endTime: module.end_time,
    timeLimitMinutes: Number(module.time_limit) || 0,
    isShuffle: module.is_shuffle,
    warningAttempts: scoreRow.warning_attempts ?? 0,
    questions: questionRecords.map((question) => {
      const studentAnswer = studentAnswers[String(question.id)] || ''

      return {
        id: question.id,
        question: question.question,
        quizType: question.quizType,
        choices: question.choices,
        correctAnswers: question.correctAnswers,
        studentAnswer,
        isCorrect: isStudentAnswerCorrect(question, studentAnswer),
      } satisfies StudentQuizReviewQuestion
    }),
  } satisfies StudentQuizReviewResult
}
