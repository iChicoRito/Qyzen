'use client'

import { createClient } from './client'

export interface EducatorScoreChoice {
  key: 'A' | 'B' | 'C' | 'D'
  value: string
}

export interface EducatorScoreAttemptHistoryItem {
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

export interface EducatorScoreReviewQuestion {
  id: number
  question: string
  quizType: 'multiple_choice' | 'identification'
  choices: EducatorScoreChoice[]
  correctAnswers: string[]
  studentAnswer: string
  isCorrect: boolean
}

export interface EducatorScoreReviewItem {
  scoreId: number
  studentId: number
  studentUserId: string
  studentName: string
  moduleRowId: number
  moduleCode: string
  subjectId: number
  subjectName: string
  sectionId: number
  sectionName: string
  termName: string
  score: number
  totalQuestions: number
  percentage: number
  isPassed: boolean
  status: 'passed' | 'failed'
  submittedAt: string | null
  takenAt: string | null
  latestScore: number
  latestTotalQuestions: number
  latestPercentage: number
  latestStatus: 'passed' | 'failed'
  latestSubmittedAt: string | null
  latestTakenAt: string | null
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
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  timeLimitMinutes: number
  isShuffle: boolean
  allowReview: boolean
  warningAttempts: number
  questions: EducatorScoreReviewQuestion[]
  attemptHistory: EducatorScoreAttemptHistoryItem[]
}

export interface EducatorScoreExportOption {
  moduleRowId: number
  moduleId: string
  moduleCode: string
  termId: number
  termName: string
  subjectId: number
  subjectName: string
  sectionId: number
  sectionName: string
}

export interface EducatorScoreExportRow {
  studentId: number
  studentUserId: string
  studentName: string
  subjectName: string
  sectionName: string
  moduleCode: string
  termName: string
  highestScore: number
  totalQuestions: number
  percentage: number
  statusLabel: string
  remark: string
  highestSubmittedAt: string | null
}

export interface EducatorScoreExportSummary {
  subjectName: string
  sectionName: string
  moduleCode: string
  termName: string
  totalEnrolled: number
  studentsWithSubmission: number
  studentsWithoutSubmission: number
}

export interface EducatorScoreExportResult {
  summary: EducatorScoreExportSummary
  rows: EducatorScoreExportRow[]
}

export interface FetchEducatorScoreExportInput {
  subjectId: number
  sectionId: number
  moduleRowId: number
  termId: number
}

export interface UpdateEducatorRetakeGrantInput {
  studentId: number
  moduleRowId: number
  subjectId: number
  retakeCount: number
}

interface UserLookupRow {
  id: number
}

interface EnrollmentRow {
  student_id: number
  subject_id: number
  is_active: boolean
}

interface EnrollmentWithStudentRow extends EnrollmentRow {
  student: StudentRow | StudentRow[] | null
}

interface StudentRow {
  id: number
  user_id: string
  given_name: string
  surname: string
  is_active: boolean
}

interface ModuleSubjectRow {
  subject_name: string
}

interface ModuleSectionRow {
  section_name: string
}

interface ModuleTermRow {
  term_name: string
  semester: string
}

interface ModuleRow {
  id?: number
  module_id?: string
  module_code: string
  term?: number
  subject_id: number
  section_id: number
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
  academic_term: ModuleTermRow | ModuleTermRow[] | null
}

interface ScoreSnapshot {
  id: number
  student_id: number
  module_id: number
  subject_id: number
  section_id: number
  score: number | null
  total_questions: number | null
  student_answer: unknown
  warning_attempts: number | null
  taken_at: string | null
  submitted_at: string | null
  status: 'in_progress' | 'submitted' | 'passed' | 'failed' | null
  is_passed: boolean | null
}

interface ScoreRow extends ScoreSnapshot {
  module: ModuleRow | ModuleRow[] | null
  student: StudentRow | StudentRow[] | null
}

interface QuizRow {
  id: number
  module_id: number
  question: string
  quiz_type: 'multiple_choice' | 'identification'
  choices: unknown
  correct_answer: string
}

interface StudentModuleRetakeRow {
  student_id: number
  module_id: number
  extra_retake_count: number
  is_active: boolean
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

// getCurrentEducatorId - resolve current educator profile id
async function getCurrentEducatorId() {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.email) {
    throw new Error('Authenticated educator was not found.')
  }

  const { data, error } = await supabase
    .from('tbl_users')
    .select('id')
    .eq('email', user.email)
    .is('deleted_at', null)
    .limit(1)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load educator profile.'))
  }

  const educatorRow = ((data || []) as UserLookupRow[])[0]

  if (!educatorRow) {
    throw new Error('Educator profile was not found.')
  }

  return educatorRow.id
}

// buildAcademicTermLabel - format academic term text
function buildAcademicTermLabel(term: ModuleTermRow | null) {
  if (!term) {
    return 'No term'
  }

  return `${term.term_name} - ${term.semester}`
}

// normalizeChoices - convert stored choices into ui records
function normalizeChoices(choices: unknown): EducatorScoreChoice[] {
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
        } satisfies EducatorScoreChoice
      }

      return null
    })
    .filter((choice): choice is EducatorScoreChoice => Boolean(choice))
}

// normalizeCorrectAnswers - convert stored correct answer values
function normalizeCorrectAnswers(quizType: QuizRow['quiz_type'], correctAnswer: string) {
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

// isStudentAnswerCorrect - compare student answer with accepted answers
function isStudentAnswerCorrect(correctAnswers: string[], studentAnswer: string) {
  const normalizedStudentAnswer = normalizeAnswerValue(studentAnswer)

  if (!normalizedStudentAnswer) {
    return false
  }

  return correctAnswers.some(
    (correctAnswer) => normalizeAnswerValue(correctAnswer) === normalizedStudentAnswer
  )
}

// getScorePercentage - compute score percentage
function getScorePercentage(score: Pick<ScoreSnapshot, 'score' | 'total_questions'>) {
  const totalQuestions = score.total_questions || 0

  if (totalQuestions <= 0) {
    return 0
  }

  return Math.round(((score.score || 0) / totalQuestions) * 100)
}

// getBestSubmittedScore - resolve best submitted attempt
function getBestSubmittedScore<T extends Pick<ScoreSnapshot, 'id' | 'score' | 'total_questions'>>(submittedScores: T[]) {
  return [...submittedScores].sort((leftScore, rightScore) => {
    const leftValue = leftScore.score || 0
    const rightValue = rightScore.score || 0

    if (leftValue !== rightValue) {
      return rightValue - leftValue
    }

    const leftPercentage = getScorePercentage(leftScore)
    const rightPercentage = getScorePercentage(rightScore)

    if (leftPercentage !== rightPercentage) {
      return rightPercentage - leftPercentage
    }

    return rightScore.id - leftScore.id
  })[0] || null
}

// getLatestSubmittedScore - resolve latest submitted attempt
function getLatestSubmittedScore<T extends Pick<ScoreSnapshot, 'id' | 'submitted_at'>>(submittedScores: T[]) {
  return [...submittedScores].sort((leftScore, rightScore) => {
    const leftTime = new Date(leftScore.submitted_at || '').getTime()
    const rightTime = new Date(rightScore.submitted_at || '').getTime()

    if (leftTime !== rightTime) {
      return rightTime - leftTime
    }

    return rightScore.id - leftScore.id
  })[0] || null
}

// buildAttemptHistory - map submitted rows into attempt history
function buildAttemptHistory(submittedScores: ScoreSnapshot[]) {
  const orderedScores = [...submittedScores].sort((leftScore, rightScore) => {
    const leftTime = new Date(leftScore.submitted_at || '').getTime()
    const rightTime = new Date(rightScore.submitted_at || '').getTime()

    if (leftTime !== rightTime) {
      return leftTime - rightTime
    }

    return leftScore.id - rightScore.id
  })
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
  })) satisfies EducatorScoreAttemptHistoryItem[]
}

// getRetakeState - compute effective retake values
function getRetakeState(module: ModuleRow, submittedScores: ScoreRow[], grantedRetakeCount: number) {
  const moduleRetakeCount = module.allow_retake ? module.retake_count : 0
  const effectiveRetakeCount = Math.max(moduleRetakeCount + grantedRetakeCount, 0)
  const allowRetake = effectiveRetakeCount > 0
  const submittedAttemptCount = submittedScores.length
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

// getModuleExportOptions - normalize module rows for export options
function getModuleExportOptions(moduleRows: ModuleRow[]) {
  return moduleRows.map((row) => {
    const subject = getSingleRelation(row.subject)
    const section = getSingleRelation(row.section)
    const term = getSingleRelation(row.academic_term)

    return {
      moduleRowId: row.id || 0,
      moduleId: row.module_id || 'Unknown Module',
      moduleCode: row.module_code,
      termId: row.term || 0,
      termName: buildAcademicTermLabel(term),
      subjectId: row.subject_id,
      subjectName: subject?.subject_name || 'Unknown Subject',
      sectionId: row.section_id,
      sectionName: section?.section_name || 'Unknown Section',
    } satisfies EducatorScoreExportOption
  })
}

// fetchEducatorScoreExportOptions - load module options for download selections
export async function fetchEducatorScoreExportOptions() {
  const supabase = createClient()
  const educatorId = await getCurrentEducatorId()
  const { data, error } = await supabase
    .from('tbl_modules')
    .select(
      'id,module_id,module_code,term,subject_id,section_id,start_date,end_date,start_time,end_time,time_limit,is_shuffle,allow_review,allow_retake,retake_count,subject:subject_id(subject_name),section:section_id(section_name),academic_term:term(term_name,semester)'
    )
    .eq('educator_id', educatorId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load score export options.'))
  }

  return getModuleExportOptions((data || []) as ModuleRow[])
}

// fetchEducatorScoreExportData - load selected export summary and rows
export async function fetchEducatorScoreExportData(input: FetchEducatorScoreExportInput) {
  const supabase = createClient()
  const educatorId = await getCurrentEducatorId()
  const [{ data: moduleData, error: moduleError }, { data: enrollmentData, error: enrollmentError }, { data: scoreData, error: scoreError }, { data: quizData, error: quizError }] =
    await Promise.all([
      supabase
        .from('tbl_modules')
        .select(
          'id,module_id,module_code,term,subject_id,section_id,start_date,end_date,start_time,end_time,time_limit,is_shuffle,allow_review,allow_retake,retake_count,subject:subject_id(subject_name),section:section_id(section_name),academic_term:term(term_name,semester)'
        )
        .eq('educator_id', educatorId)
        .eq('id', input.moduleRowId)
        .eq('subject_id', input.subjectId)
        .eq('section_id', input.sectionId)
        .eq('term', input.termId)
        .limit(1),
      supabase
        .from('tbl_enrolled')
        .select('student_id,subject_id,is_active,student:student_id(id,user_id,given_name,surname,is_active)')
        .eq('educator_id', educatorId)
        .eq('subject_id', input.subjectId)
        .eq('is_active', true),
      supabase
        .from('tbl_scores')
        .select('id,student_id,module_id,subject_id,section_id,score,total_questions,student_answer,warning_attempts,taken_at,submitted_at,status,is_passed')
        .eq('educator_id', educatorId)
        .eq('subject_id', input.subjectId)
        .eq('module_id', input.moduleRowId)
        .not('submitted_at', 'is', null),
      supabase
        .from('tbl_quizzes')
        .select('id,module_id')
        .eq('module_id', input.moduleRowId),
    ])

  if (moduleError) {
    throw new Error(getSupabaseErrorMessage(moduleError, 'Failed to load export module details.'))
  }

  if (enrollmentError) {
    throw new Error(getSupabaseErrorMessage(enrollmentError, 'Failed to load enrolled students.'))
  }

  if (scoreError) {
    throw new Error(getSupabaseErrorMessage(scoreError, 'Failed to load score export rows.'))
  }

  if (quizError) {
    throw new Error(getSupabaseErrorMessage(quizError, 'Failed to load module quiz details.'))
  }

  const moduleOption = getModuleExportOptions((moduleData || []) as ModuleRow[])[0]

  if (!moduleOption) {
    throw new Error('The selected score export option is no longer available.')
  }

  const enrolledStudents = ((enrollmentData || []) as EnrollmentWithStudentRow[])
    .map((row) => getSingleRelation(row.student))
    .filter((student): student is StudentRow => Boolean(student))
    .sort((leftStudent, rightStudent) => {
      const leftName = `${leftStudent.given_name} ${leftStudent.surname}`.trim()
      const rightName = `${rightStudent.given_name} ${rightStudent.surname}`.trim()

      return leftName.localeCompare(rightName)
    })
  const submittedScores = (scoreData || []) as ScoreSnapshot[]
  const scoreMap = submittedScores.reduce<Map<number, ScoreSnapshot[]>>((result, score) => {
    const currentRows = result.get(score.student_id) || []
    currentRows.push(score)
    result.set(score.student_id, currentRows)
    return result
  }, new Map<number, ScoreSnapshot[]>())
  const totalQuestions = Array.isArray(quizData) ? quizData.length : 0
  const rows = enrolledStudents.map((student) => {
    const bestScore = getBestSubmittedScore(scoreMap.get(student.id) || [])

    if (!bestScore) {
      return {
        studentId: student.id,
        studentUserId: student.user_id,
        studentName: `${student.given_name} ${student.surname}`.trim(),
        subjectName: moduleOption.subjectName,
        sectionName: moduleOption.sectionName,
        moduleCode: moduleOption.moduleCode,
        termName: moduleOption.termName,
        highestScore: 0,
        totalQuestions,
        percentage: 0,
        statusLabel: 'No Submission',
        remark: 'No Submission',
        highestSubmittedAt: null,
      } satisfies EducatorScoreExportRow
    }

    return {
      studentId: student.id,
      studentUserId: student.user_id,
      studentName: `${student.given_name} ${student.surname}`.trim(),
      subjectName: moduleOption.subjectName,
      sectionName: moduleOption.sectionName,
      moduleCode: moduleOption.moduleCode,
      termName: moduleOption.termName,
      highestScore: bestScore.score || 0,
      totalQuestions: bestScore.total_questions || totalQuestions,
      percentage: getScorePercentage(bestScore),
      statusLabel: bestScore.status === 'passed' ? 'Passed' : 'Failed',
      remark: bestScore.status === 'passed' ? 'Highest Submitted Score' : 'Highest Submitted Score',
      highestSubmittedAt: bestScore.submitted_at,
    } satisfies EducatorScoreExportRow
  })

  return {
    summary: {
      subjectName: moduleOption.subjectName,
      sectionName: moduleOption.sectionName,
      moduleCode: moduleOption.moduleCode,
      termName: moduleOption.termName,
      totalEnrolled: rows.length,
      studentsWithSubmission: rows.filter((row) => row.statusLabel !== 'No Submission').length,
      studentsWithoutSubmission: rows.filter((row) => row.statusLabel === 'No Submission').length,
    },
    rows,
  } satisfies EducatorScoreExportResult
}

// fetchEducatorScoreReviewList - load all visible score review rows for an educator
export async function fetchEducatorScoreReviewList() {
  const supabase = createClient()
  const educatorId = await getCurrentEducatorId()
  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from('tbl_enrolled')
    .select('student_id,subject_id,is_active')
    .eq('educator_id', educatorId)
    .eq('is_active', true)

  if (enrollmentError) {
    throw new Error(getSupabaseErrorMessage(enrollmentError, 'Failed to load educator enrollments.'))
  }

  const enrollmentKeys = new Set(
    ((enrollmentData || []) as EnrollmentRow[]).map((row) => `${row.student_id}:${row.subject_id}`)
  )

  if (enrollmentKeys.size === 0) {
    return [] as EducatorScoreReviewItem[]
  }

  const { data: scoreData, error: scoreError } = await supabase
    .from('tbl_scores')
    .select(
      'id,student_id,module_id,subject_id,section_id,score,total_questions,student_answer,warning_attempts,taken_at,submitted_at,status,is_passed,module:module_id(module_code,subject_id,section_id,start_date,end_date,start_time,end_time,time_limit,is_shuffle,allow_review,allow_retake,retake_count,subject:subject_id(subject_name),section:section_id(section_name),academic_term:term(term_name,semester)),student:student_id(id,user_id,given_name,surname,is_active)'
    )
    .eq('educator_id', educatorId)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: false })

  if (scoreError) {
    throw new Error(getSupabaseErrorMessage(scoreError, 'Failed to load educator score reviews.'))
  }

  const visibleScores = ((scoreData || []) as ScoreRow[]).filter((score) =>
    enrollmentKeys.has(`${score.student_id}:${score.subject_id}`)
  )

  if (visibleScores.length === 0) {
    return [] as EducatorScoreReviewItem[]
  }

  const moduleIds = [...new Set(visibleScores.map((score) => score.module_id))]
  const studentIds = [...new Set(visibleScores.map((score) => score.student_id))]
  const [{ data: quizData, error: quizError }, { data: retakeGrantData, error: retakeGrantError }] =
    await Promise.all([
      supabase
        .from('tbl_quizzes')
        .select('id,module_id,question,quiz_type,choices,correct_answer')
        .in('module_id', moduleIds)
        .order('id', { ascending: true }),
      supabase
        .from('tbl_student_module_retakes')
        .select('student_id,module_id,extra_retake_count,is_active')
        .eq('educator_id', educatorId)
        .eq('is_active', true)
        .in('module_id', moduleIds)
        .in('student_id', studentIds),
    ])

  if (quizError) {
    throw new Error(getSupabaseErrorMessage(quizError, 'Failed to load quiz questions.'))
  }

  if (retakeGrantError) {
    throw new Error(getSupabaseErrorMessage(retakeGrantError, 'Failed to load retake grant data.'))
  }

  const quizMap = ((quizData || []) as QuizRow[]).reduce<Map<number, QuizRow[]>>((result, quiz) => {
    const currentRows = result.get(quiz.module_id) || []
    currentRows.push(quiz)
    result.set(quiz.module_id, currentRows)
    return result
  }, new Map<number, QuizRow[]>())
  const scoreHistoryMap = visibleScores.reduce<Map<string, ScoreRow[]>>((result, score) => {
    const historyKey = `${score.student_id}:${score.module_id}`
    const currentRows = result.get(historyKey) || []
    currentRows.push(score)
    result.set(historyKey, currentRows)
    return result
  }, new Map<string, ScoreRow[]>())
  const retakeGrantMap = ((retakeGrantData || []) as StudentModuleRetakeRow[]).reduce<Map<string, number>>(
    (result, row) => {
      result.set(
        `${row.student_id}:${row.module_id}`,
        row.is_active ? Math.max(row.extra_retake_count, 0) : 0
      )
      return result
    },
    new Map<string, number>()
  )

  const groupedScoreMap = visibleScores.reduce<Map<string, ScoreRow[]>>((result, score) => {
    const groupKey = `${score.student_id}:${score.module_id}`
    const currentRows = result.get(groupKey) || []
    currentRows.push(score)
    result.set(groupKey, currentRows)
    return result
  }, new Map<string, ScoreRow[]>())

  return Array.from(groupedScoreMap.values()).map((groupedScores) => {
    const representativeScore = groupedScores[0]
    const module = getSingleRelation(representativeScore.module)
    const student = getSingleRelation(representativeScore.student)

    if (!module || !student) {
      throw new Error('Score details are incomplete.')
    }

    const subject = getSingleRelation(module.subject)
    const section = getSingleRelation(module.section)
    const term = getSingleRelation(module.academic_term)
    const historyKey = `${representativeScore.student_id}:${representativeScore.module_id}`
    const submittedScores = scoreHistoryMap.get(historyKey) || []
    const grantedRetakeCount = retakeGrantMap.get(historyKey) || 0
    const retakeState = getRetakeState(module, submittedScores, grantedRetakeCount)
    const bestScore = getBestSubmittedScore(submittedScores)
    const latestScore = getLatestSubmittedScore(submittedScores)
    const reviewSourceScore = latestScore || bestScore || representativeScore
    const studentAnswers = normalizeStoredAnswers(reviewSourceScore.student_answer)

    return {
      scoreId: reviewSourceScore.id,
      studentId: student.id,
      studentUserId: student.user_id,
      studentName: `${student.given_name} ${student.surname}`.trim(),
      moduleRowId: representativeScore.module_id,
      moduleCode: module.module_code,
      subjectId: representativeScore.subject_id,
      subjectName: subject?.subject_name || 'Unknown Subject',
      sectionId: representativeScore.section_id,
      sectionName: section?.section_name || 'Unknown Section',
      termName: buildAcademicTermLabel(term),
      score: bestScore?.score || 0,
      totalQuestions: bestScore?.total_questions || 0,
      percentage: bestScore ? getScorePercentage(bestScore) : 0,
      isPassed: Boolean(bestScore?.is_passed),
      status: bestScore?.status === 'passed' ? 'passed' : 'failed',
      submittedAt: bestScore?.submitted_at || null,
      takenAt: bestScore?.taken_at || null,
      latestScore: latestScore?.score || 0,
      latestTotalQuestions: latestScore?.total_questions || 0,
      latestPercentage: latestScore ? getScorePercentage(latestScore) : 0,
      latestStatus: latestScore?.status === 'passed' ? 'passed' : 'failed',
      latestSubmittedAt: latestScore?.submitted_at || null,
      latestTakenAt: latestScore?.taken_at || null,
      allowRetake: retakeState.allowRetake,
      retakeCount: retakeState.effectiveRetakeCount,
      grantedRetakeCount: retakeState.grantedRetakeCount,
      effectiveRetakeCount: retakeState.effectiveRetakeCount,
      submittedAttemptCount: retakeState.submittedAttemptCount,
      remainingRetakes: retakeState.remainingRetakes,
      bestScoreId: bestScore?.id ?? null,
      bestScore: bestScore?.score ?? null,
      latestScoreId: latestScore?.id ?? null,
      canRetake: retakeState.canRetake,
      startDate: module.start_date,
      endDate: module.end_date,
      startTime: module.start_time,
      endTime: module.end_time,
      timeLimitMinutes: Number(module.time_limit) || 0,
      isShuffle: module.is_shuffle,
      allowReview: module.allow_review,
      warningAttempts: reviewSourceScore.warning_attempts ?? 0,
      questions: (quizMap.get(representativeScore.module_id) || []).map((quiz) => {
        const correctAnswers = normalizeCorrectAnswers(quiz.quiz_type, quiz.correct_answer)
        const studentAnswer = studentAnswers[String(quiz.id)] || ''

        return {
          id: quiz.id,
          question: quiz.question,
          quizType: quiz.quiz_type,
          choices: normalizeChoices(quiz.choices),
          correctAnswers,
          studentAnswer,
          isCorrect: isStudentAnswerCorrect(correctAnswers, studentAnswer),
        } satisfies EducatorScoreReviewQuestion
      }),
      attemptHistory: buildAttemptHistory(submittedScores),
    } satisfies EducatorScoreReviewItem
  })
}

// updateEducatorRetakeGrant - save educator extra retake count for one student module
export async function updateEducatorRetakeGrant(input: UpdateEducatorRetakeGrantInput) {
  const supabase = createClient()
  const educatorId = await getCurrentEducatorId()
  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from('tbl_enrolled')
    .select('id')
    .eq('educator_id', educatorId)
    .eq('student_id', input.studentId)
    .eq('subject_id', input.subjectId)
    .eq('is_active', true)
    .limit(1)

  if (enrollmentError) {
    throw new Error(getSupabaseErrorMessage(enrollmentError, 'Failed to validate enrollment access.'))
  }

  if (!Array.isArray(enrollmentData) || enrollmentData.length === 0) {
    throw new Error('This student is not actively enrolled under your subject.')
  }

  const nextRetakeCount = Math.max(input.retakeCount, 0)
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('tbl_student_module_retakes')
    .upsert(
      {
        educator_id: educatorId,
        student_id: input.studentId,
        module_id: input.moduleRowId,
        extra_retake_count: nextRetakeCount,
        is_active: nextRetakeCount > 0,
        updated_at: now,
      },
      {
        onConflict: 'educator_id,student_id,module_id',
      }
    )

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to save retake grant.'))
  }

  return {
    retakeCount: nextRetakeCount,
  }
}
