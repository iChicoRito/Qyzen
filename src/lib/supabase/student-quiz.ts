import { createClient } from './server'
import { fetchStudentModuleRetakeGrant, fetchStudentModuleRetakeGrantMap } from './student-retakes'

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

export interface StudentQuizHint {
  questionId: number
  question: string
  answer: string
}

export interface StudentQuizAttemptHistoryItem {
  scoreId: number
  attemptNumber: number
  score: number
  totalQuestions: number
  percentage: number
  status: 'passed' | 'failed'
  isPassed: boolean
  submittedAt: string | null
  takenAt: string | null
  isBestScore: boolean
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
  allowReview: boolean
  allowRetake: boolean
  retakeCount: number
  grantedRetakeCount: number
  effectiveRetakeCount: number
  allowHint: boolean
  hintCount: number
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  questions: StudentQuizQuestion[]
  hints: StudentQuizHint[]
  existingScoreId: number | null
  currentAttemptId: number | null
  existingAnswers: Record<string, string>
  warningAttempts: number
  takenAt: string | null
  submittedAt: string | null
  status: 'in_progress' | 'submitted' | 'passed' | 'failed' | null
  score: number | null
  totalQuestions: number
  isPassed: boolean
  submittedAttemptCount: number
  remainingRetakes: number
  bestScoreId: number | null
  bestScore: number | null
  latestScoreId: number | null
  canRetake: boolean
  canTake: boolean
  hasInProgressAttempt: boolean
  attemptHistory: StudentQuizAttemptHistoryItem[]
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
  allowRetake: boolean
  retakeCount: number
  grantedRetakeCount: number
  effectiveRetakeCount: number
  submittedAttemptCount: number
  remainingRetakes: number
  bestScoreId: number | null
  bestScore: number | null
  latestScoreId: number | null
  canRetake: boolean
  attemptHistory: StudentQuizAttemptHistoryItem[]
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
  allowReview: boolean
  warningAttempts: number
  questions: StudentQuizReviewQuestion[]
}

export interface StudentQuizReviewListItem extends StudentQuizReviewResult {}

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
  allow_review: boolean
  allow_retake: boolean
  retake_count: number
  allow_hint: boolean
  hint_count: number
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

interface ScoreResultRow extends ScoreRow {
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
  allow_review: boolean
  allow_retake: boolean
  retake_count: number
  subject: ModuleSubjectRow | ModuleSubjectRow[] | null
  section: ModuleSectionRow | ModuleSectionRow[] | null
  educator: ModuleEducatorRow | ModuleEducatorRow[] | null
  academic_term: ModuleTermRow | ModuleTermRow[] | null
}

interface ScoreReviewRow extends ScoreResultRow {}

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

// getHintAnswerLabel - format hint answer text for students
function getHintAnswerLabel(question: StudentQuizQuestionWithAnswers) {
  if (question.quizType === 'multiple_choice') {
    const correctChoice = question.choices.find((choice) => choice.value === question.correctAnswers[0])

    if (!correctChoice) {
      return question.correctAnswers[0] || 'No answer available'
    }

    return `${correctChoice.key}. ${correctChoice.value}`
  }

  return question.correctAnswers.join(', ') || 'No answer available'
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

// sortSubmittedScoresAscending - order attempts by submission time
function sortSubmittedScoresAscending(scores: ScoreRow[]) {
  return [...scores]
    .filter((score) => Boolean(score.submitted_at))
    .sort((leftScore, rightScore) => {
      const leftTime = new Date(leftScore.submitted_at || '').getTime()
      const rightTime = new Date(rightScore.submitted_at || '').getTime()

      if (leftTime !== rightTime) {
        return leftTime - rightTime
      }

      return leftScore.id - rightScore.id
    })
}

// getScorePercentage - compute score percentage
function getScorePercentage(score: Pick<ScoreRow, 'score' | 'total_questions'>) {
  const totalQuestions = score.total_questions || 0

  if (totalQuestions <= 0) {
    return 0
  }

  return Math.round(((score.score || 0) / totalQuestions) * 100)
}

// getBestSubmittedScore - resolve canonical best attempt
function getBestSubmittedScore(submittedScores: ScoreRow[]) {
  return [...submittedScores].sort((leftScore, rightScore) => {
    const leftScoreValue = leftScore.score || 0
    const rightScoreValue = rightScore.score || 0

    if (leftScoreValue !== rightScoreValue) {
      return rightScoreValue - leftScoreValue
    }

    const leftPercentage = getScorePercentage(leftScore)
    const rightPercentage = getScorePercentage(rightScore)

    if (leftPercentage !== rightPercentage) {
      return rightPercentage - leftPercentage
    }

    const leftTime = new Date(leftScore.submitted_at || '').getTime()
    const rightTime = new Date(rightScore.submitted_at || '').getTime()

    if (leftTime !== rightTime) {
      return rightTime - leftTime
    }

    return rightScore.id - leftScore.id
  })[0] || null
}

// buildAttemptHistory - map submitted score rows into attempt history
function buildAttemptHistory(submittedScores: ScoreRow[]) {
  const orderedScores = sortSubmittedScoresAscending(submittedScores)
  const bestScore = getBestSubmittedScore(submittedScores)

  return orderedScores.map((score, index) => ({
    scoreId: score.id,
    attemptNumber: index + 1,
    score: score.score || 0,
    totalQuestions: score.total_questions || 0,
    percentage: getScorePercentage(score),
    status: score.status === 'passed' ? 'passed' : 'failed',
    isPassed: Boolean(score.is_passed),
    submittedAt: score.submitted_at,
    takenAt: score.taken_at,
    isBestScore: score.id === bestScore?.id,
  })) satisfies StudentQuizAttemptHistoryItem[]
}

// getCurrentDraftScore - resolve latest in-progress score
function getCurrentDraftScore(scores: ScoreRow[]) {
  return [...scores]
    .filter((score) => !score.submitted_at)
    .sort((leftScore, rightScore) => rightScore.id - leftScore.id)[0] || null
}

// getRetakeState - compute retake availability
function getRetakeState(
  module: Pick<ModuleRow, 'allow_retake' | 'retake_count'>,
  submittedScores: ScoreRow[],
  grantedRetakeCount: number
) {
  const submittedAttemptCount = submittedScores.length
  const moduleRetakeCount = module.allow_retake ? module.retake_count : 0
  const effectiveRetakeCount = Math.max(moduleRetakeCount + grantedRetakeCount, 0)
  const allowRetake = effectiveRetakeCount > 0
  const maxAttempts = effectiveRetakeCount + 1
  const remainingRetakes = Math.max(
    effectiveRetakeCount - Math.max(submittedAttemptCount - 1, 0),
    0
  )
  const canRetake = allowRetake && submittedAttemptCount > 0 && submittedAttemptCount < maxAttempts

  return {
    allowRetake,
    grantedRetakeCount,
    effectiveRetakeCount,
    submittedAttemptCount,
    remainingRetakes,
    canRetake,
  }
}

// buildSessionRecord - map database rows to quiz session
function buildSessionRecord(
  module: ModuleRow,
  quizzes: QuizRow[],
  scores: ScoreRow[],
  grantedRetakeCount: number
): StudentQuizGradingSession {
  const questionRecords = quizzes.map(buildQuestionRecord)
  const subject = getSingleRelation(module.subject)
  const section = getSingleRelation(module.section)
  const educator = getSingleRelation(module.educator)
  const term = getSingleRelation(module.academic_term)
  const submittedScores = scores.filter((score) => Boolean(score.submitted_at))
  const bestSubmittedScore = getBestSubmittedScore(submittedScores)
  const latestSubmittedScore = [...submittedScores].sort((leftScore, rightScore) => rightScore.id - leftScore.id)[0] || null
  const currentDraftScore = getCurrentDraftScore(scores)
  const attemptHistory = buildAttemptHistory(submittedScores)
  const retakeState = getRetakeState(module, submittedScores, grantedRetakeCount)

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
    allowReview: module.allow_review,
    allowRetake: retakeState.allowRetake,
    retakeCount: retakeState.effectiveRetakeCount,
    grantedRetakeCount: retakeState.grantedRetakeCount,
    effectiveRetakeCount: retakeState.effectiveRetakeCount,
    allowHint: module.allow_hint,
    hintCount: module.hint_count,
    startDate: module.start_date,
    endDate: module.end_date,
    startTime: module.start_time,
    endTime: module.end_time,
    questions: questionRecords,
    hints: questionRecords.map((question) => ({
      questionId: question.id,
      question: question.question,
      answer: getHintAnswerLabel(question),
    })),
    existingScoreId: currentDraftScore?.id ?? null,
    currentAttemptId: currentDraftScore?.id ?? null,
    existingAnswers: normalizeStoredAnswers(currentDraftScore?.student_answer ?? {}),
    warningAttempts: currentDraftScore?.warning_attempts ?? 0,
    takenAt: currentDraftScore?.taken_at ?? null,
    submittedAt: latestSubmittedScore?.submitted_at ?? null,
    status: currentDraftScore?.status ?? latestSubmittedScore?.status ?? null,
    score: bestSubmittedScore?.score ?? null,
    totalQuestions: bestSubmittedScore?.total_questions ?? quizzes.length,
    isPassed: Boolean(bestSubmittedScore?.is_passed),
    submittedAttemptCount: retakeState.submittedAttemptCount,
    remainingRetakes: retakeState.remainingRetakes,
    bestScoreId: bestSubmittedScore?.id ?? null,
    bestScore: bestSubmittedScore?.score ?? null,
    latestScoreId: latestSubmittedScore?.id ?? null,
    canRetake: retakeState.canRetake,
    canTake: quizzes.length > 0 && (submittedScores.length === 0 || Boolean(currentDraftScore) || retakeState.canRetake),
    hasInProgressAttempt: Boolean(currentDraftScore),
    attemptHistory,
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
      'id,module_id,module_code,subject_id,section_id,educator_id,time_limit,cheating_attempts,is_shuffle,allow_review,allow_retake,retake_count,allow_hint,hint_count,start_date,end_date,start_time,end_time,subject:subject_id(subject_name),section:section_id(section_name),educator:educator_id(given_name,surname,user_type),academic_term:term(term_name,semester)'
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

// fetchModuleScores - load student score rows for a module
async function fetchModuleScores(studentId: number, moduleId: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tbl_scores')
    .select(
      'id,module_id,score,total_questions,student_answer,warning_attempts,taken_at,submitted_at,status,is_passed'
    )
    .eq('student_id', studentId)
    .eq('module_id', moduleId)
    .order('id', { ascending: false })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load existing score data.'))
  }

  return (data || []) as ScoreRow[]
}

// fetchStudentQuizGradingSession - load quiz session with answer key
export async function fetchStudentQuizGradingSession(studentId: number, moduleId: number) {
  const module = await fetchModuleRow(moduleId)
  await ensureStudentModuleAccess(studentId, module)
  const [quizzes, scores, grantedRetakeCount] = await Promise.all([
    fetchModuleQuizzes(module.id),
    fetchModuleScores(studentId, module.id),
    fetchStudentModuleRetakeGrant(studentId, module.id),
  ])

  if (quizzes.length === 0) {
    throw new Error('This assessment has no quiz questions yet.')
  }

  return buildSessionRecord(module, quizzes, scores, grantedRetakeCount)
}

// fetchStudentQuizSession - load quiz session without answer key
export async function fetchStudentQuizSession(studentId: number, moduleId: number): Promise<StudentQuizSession> {
  const session = await fetchStudentQuizGradingSession(studentId, moduleId)

  return {
    ...session,
    questions: session.questions.map(({ correctAnswer: _correctAnswer, correctAnswers: _correctAnswers, ...question }) => question),
  }
}

// buildStudentQuizResult - map submitted score rows into result payload
function buildStudentQuizResult(
  targetScore: ScoreRow,
  module: ModuleResultRow,
  submittedScores: ScoreRow[],
  grantedRetakeCount: number
): StudentQuizResult {
  const subject = getSingleRelation(module.subject)
  const section = getSingleRelation(module.section)
  const educator = getSingleRelation(module.educator)
  const term = getSingleRelation(module.academic_term)
  const attemptHistory = buildAttemptHistory(submittedScores)
  const bestScore = getBestSubmittedScore(submittedScores)
  const latestSubmittedScore = [...submittedScores].sort((leftScore, rightScore) => rightScore.id - leftScore.id)[0] || null
  const retakeState = getRetakeState(
    {
      allow_retake: module.allow_retake,
      retake_count: module.retake_count,
    },
    submittedScores,
    grantedRetakeCount
  )

  return {
    scoreId: targetScore.id,
    moduleRowId: targetScore.module_id,
    moduleCode: module.module_code || 'Unknown Module',
    subjectName: subject?.subject_name || 'Unknown Subject',
    sectionName: section?.section_name || 'Unknown Section',
    educatorName: `${educator?.given_name || ''} ${educator?.surname || ''}`.trim() || 'Unknown Educator',
    termName: buildAcademicTermLabel(term),
    score: targetScore.score || 0,
    totalQuestions: targetScore.total_questions || 0,
    percentage: getScorePercentage(targetScore),
    isPassed: Boolean(targetScore.is_passed),
    status: targetScore.status === 'passed' ? 'passed' : 'failed',
    submittedAt: targetScore.submitted_at,
    takenAt: targetScore.taken_at,
    allowRetake: retakeState.allowRetake,
    retakeCount: retakeState.effectiveRetakeCount,
    grantedRetakeCount: retakeState.grantedRetakeCount,
    effectiveRetakeCount: retakeState.effectiveRetakeCount,
    submittedAttemptCount: retakeState.submittedAttemptCount,
    remainingRetakes: retakeState.remainingRetakes,
    bestScoreId: bestScore?.id ?? null,
    bestScore: bestScore?.score ?? null,
    latestScoreId: latestSubmittedScore?.id ?? null,
    canRetake: retakeState.canRetake,
    attemptHistory,
  }
}

// fetchStudentScoreResult - load one student result row
export async function fetchStudentScoreResult(studentId: number, scoreId?: number) {
  const supabase = await createClient()
  let scoreQuery = supabase
    .from('tbl_scores')
    .select(
      'id,module_id,score,total_questions,student_answer,taken_at,submitted_at,status,is_passed,warning_attempts,module:module_id(module_code,start_date,end_date,start_time,end_time,time_limit,is_shuffle,allow_review,allow_retake,retake_count,subject:subject_id(subject_name),section:section_id(section_name),educator:educator_id(given_name,surname,user_type),academic_term:term(term_name,semester))'
    )
    .eq('student_id', studentId)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: false })

  if (scoreId) {
    scoreQuery = scoreQuery.eq('id', scoreId)
  }

  const { data, error } = await scoreQuery.limit(1)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load score result.'))
  }

  const targetScore = ((data || []) as ScoreReviewRow[])[0]

  if (!targetScore) {
    return null
  }

  const { data: historyData, error: historyError } = await supabase
    .from('tbl_scores')
    .select('id,module_id,score,total_questions,student_answer,taken_at,submitted_at,status,is_passed,warning_attempts')
    .eq('student_id', studentId)
    .eq('module_id', targetScore.module_id)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: true })

  if (historyError) {
    throw new Error(getSupabaseErrorMessage(historyError, 'Failed to load score history.'))
  }

  const module = getSingleRelation(targetScore.module)

  if (!module) {
    return null
  }

  const grantedRetakeCount = await fetchStudentModuleRetakeGrant(studentId, targetScore.module_id)

  return buildStudentQuizResult(
    targetScore,
    module,
    (historyData || []) as ScoreRow[],
    grantedRetakeCount
  )
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
      'id,module_id,score,total_questions,student_answer,taken_at,submitted_at,status,is_passed,warning_attempts,module:module_id(module_code,start_date,end_date,start_time,end_time,time_limit,is_shuffle,allow_review,allow_retake,retake_count,subject:subject_id(subject_name),section:section_id(section_name),educator:educator_id(given_name,surname,user_type),academic_term:term(term_name,semester))'
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
  const [quizzes, scoreHistory, baseResult] = await Promise.all([
    fetchModuleQuizzes(scoreRow.module_id),
    fetchModuleScores(studentId, scoreRow.module_id),
    fetchStudentScoreResult(studentId, scoreId),
  ])

  if (!baseResult) {
    return null
  }

  const questionRecords = quizzes.map(buildQuestionRecord)
  const studentAnswers = normalizeStoredAnswers(scoreRow.student_answer)
  const submittedHistory = scoreHistory.filter((score) => Boolean(score.submitted_at))

  return {
    ...baseResult,
    startDate: module.start_date,
    endDate: module.end_date,
    startTime: module.start_time,
    endTime: module.end_time,
    timeLimitMinutes: Number(module.time_limit) || 0,
    isShuffle: module.is_shuffle,
    allowReview: module.allow_review,
    warningAttempts: scoreRow.warning_attempts ?? 0,
    attemptHistory: buildAttemptHistory(submittedHistory),
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

// fetchStudentQuizReviewList - load all submitted assessment reviews for a student
export async function fetchStudentQuizReviewList(studentId: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tbl_scores')
    .select(
      'id,module_id,score,total_questions,student_answer,taken_at,submitted_at,status,is_passed,warning_attempts,module:module_id(module_code,start_date,end_date,start_time,end_time,time_limit,is_shuffle,allow_review,allow_retake,retake_count,subject:subject_id(subject_name),section:section_id(section_name),educator:educator_id(given_name,surname,user_type),academic_term:term(term_name,semester))'
    )
    .eq('student_id', studentId)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: false })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load student score reviews.'))
  }

  const scoreRows = (data || []) as ScoreReviewRow[]
  const retakeGrantMap = await fetchStudentModuleRetakeGrantMap(
    studentId,
    [...new Set(scoreRows.map((scoreRow) => scoreRow.module_id))]
  )
  const scoreHistoryMap = scoreRows.reduce<Map<number, ScoreRow[]>>((result, scoreRow) => {
    const currentRows = result.get(scoreRow.module_id) || []
    currentRows.push(scoreRow)
    result.set(scoreRow.module_id, currentRows)
    return result
  }, new Map<number, ScoreRow[]>())

  const reviewResults = await Promise.all(
    scoreRows.map(async (scoreRow) => {
      const module = getSingleRelation(scoreRow.module)

      if (!module) {
        throw new Error('Assessment module was not found for this score.')
      }

      const quizzes = await fetchModuleQuizzes(scoreRow.module_id)
      const questionRecords = quizzes.map(buildQuestionRecord)
      const studentAnswers = normalizeStoredAnswers(scoreRow.student_answer)
      const baseResult = buildStudentQuizResult(
        scoreRow,
        module,
        scoreHistoryMap.get(scoreRow.module_id) || [],
        retakeGrantMap.get(scoreRow.module_id) || 0
      )

      return {
        ...baseResult,
        startDate: module.start_date || '',
        endDate: module.end_date || '',
        startTime: module.start_time || '',
        endTime: module.end_time || '',
        timeLimitMinutes: Number(module.time_limit) || 0,
        isShuffle: Boolean(module.is_shuffle),
        allowReview: Boolean(module.allow_review),
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
      } satisfies StudentQuizReviewListItem
    })
  )

  return reviewResults
}
