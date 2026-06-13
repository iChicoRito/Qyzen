'use client'

import type { NotificationInsertInput } from '@/types/notification'

import { insertNotifications } from './notifications'
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
  assessmentRowId: number
  assessmentCode: string
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
  assessmentRowId: number
  assessmentId: string
  assessmentCode: string
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
  assessmentCode: string
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
  assessmentCode: string
  termName: string
  totalEnrolled: number
  studentsWithSubmission: number
  studentsWithoutSubmission: number
}

export interface EducatorScoreExportResult {
  summary: EducatorScoreExportSummary
  rows: EducatorScoreExportRow[]
}

interface RetakeNotificationContext {
  studentId: number
  studentName: string
  assessmentRowId: number
  assessmentCode: string
  subjectId: number
  subjectName: string
  sectionId: number
  sectionName: string
  retakeCount: number
}

export interface FetchEducatorScoreExportInput {
  subjectId: number
  sectionId: number
  assessmentRowId: number
  termId: number
}

export interface UpdateEducatorRetakeGrantInput {
  studentId: number
  assessmentRowId: number
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

interface AssessmentSubjectRow {
  subject_name: string
}

interface AssessmentSectionRow {
  section_name: string
}

interface AssessmentTermRow {
  term_name: string
  semester: string
}

interface AssessmentRow {
  id?: number
  assessment_code: string
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
  subject: AssessmentSubjectRow | AssessmentSubjectRow[] | null
  section: AssessmentSectionRow | AssessmentSectionRow[] | null
  academic_term: AssessmentTermRow | AssessmentTermRow[] | null
}

interface ScoreSnapshot {
  id: number
  student_id: number
  assessment_id: number
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
  assessment: AssessmentRow | AssessmentRow[] | null
  student: StudentRow | StudentRow[] | null
}

interface QuizRow {
  id: number
  assessment_id: number
  question: string
  quiz_type: 'multiple_choice' | 'identification'
  choices: unknown
  correct_answer: string
}

interface StudentAssessmentRetakeRow {
  student_id: number
  assessment_id: number
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
function buildAcademicTermLabel(term: AssessmentTermRow | null) {
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
function getRetakeState(assessment: AssessmentRow, submittedScores: ScoreRow[], grantedRetakeCount: number) {
  const assessmentRetakeCount = assessment.allow_retake ? assessment.retake_count : 0
  const effectiveRetakeCount = Math.max(assessmentRetakeCount + grantedRetakeCount, 0)
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

// getAssessmentExportOptions - normalize assessment rows for export options
function getAssessmentExportOptions(assessmentRows: AssessmentRow[]) {
  return assessmentRows.map((row) => {
    const subject = getSingleRelation(row.subject)
    const section = getSingleRelation(row.section)
    const term = getSingleRelation(row.academic_term)

    return {
      assessmentRowId: row.id || 0,
      assessmentId: row.assessment_code || 'Unknown Assessment',
      assessmentCode: row.assessment_code,
      termId: row.term || 0,
      termName: buildAcademicTermLabel(term),
      subjectId: row.subject_id,
      subjectName: subject?.subject_name || 'Unknown Subject',
      sectionId: row.section_id,
      sectionName: section?.section_name || 'Unknown Section',
    } satisfies EducatorScoreExportOption
  })
}

// fetchEducatorScoreExportOptions - load assessment options for download selections
export async function fetchEducatorScoreExportOptions() {
  const supabase = createClient()
  const educatorId = await getCurrentEducatorId()
  const { data, error } = await supabase
    .from('tbl_assessments')
    .select(
      'id,assessment_code,term,subject_id,section_id,start_date,end_date,start_time,end_time,time_limit,is_shuffle,allow_review,allow_retake,retake_count,subject:subject_id(subject_name),section:section_id(section_name),academic_term:term(term_name,semester)'
    )
    .eq('educator_id', educatorId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load score export options.'))
  }

  return getAssessmentExportOptions((data || []) as AssessmentRow[])
}

// fetchEducatorScoreExportData - load selected export summary and rows
export async function fetchEducatorScoreExportData(input: FetchEducatorScoreExportInput) {
  const supabase = createClient()
  const educatorId = await getCurrentEducatorId()
  const [{ data: assessmentData, error: assessmentError }, { data: enrollmentData, error: enrollmentError }, { data: scoreData, error: scoreError }, { data: quizData, error: quizError }] =
    await Promise.all([
      supabase
        .from('tbl_assessments')
        .select(
          'id,assessment_code,term,subject_id,section_id,start_date,end_date,start_time,end_time,time_limit,is_shuffle,allow_review,allow_retake,retake_count,subject:subject_id(subject_name),section:section_id(section_name),academic_term:term(term_name,semester)'
        )
        .eq('educator_id', educatorId)
        .eq('id', input.assessmentRowId)
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
        .select('id,student_id,assessment_id,subject_id,section_id,score,total_questions,student_answer,warning_attempts,taken_at,submitted_at,status,is_passed')
        .eq('educator_id', educatorId)
        .eq('subject_id', input.subjectId)
        .eq('assessment_id', input.assessmentRowId)
        .not('submitted_at', 'is', null),
      supabase
        .from('tbl_quizzes')
        .select('id,assessment_id')
        .eq('assessment_id', input.assessmentRowId),
    ])

  if (assessmentError) {
    throw new Error(getSupabaseErrorMessage(assessmentError, 'Failed to load export assessment details.'))
  }

  if (enrollmentError) {
    throw new Error(getSupabaseErrorMessage(enrollmentError, 'Failed to load enrolled students.'))
  }

  if (scoreError) {
    throw new Error(getSupabaseErrorMessage(scoreError, 'Failed to load score export rows.'))
  }

  if (quizError) {
    throw new Error(getSupabaseErrorMessage(quizError, 'Failed to load assessment quiz details.'))
  }

  const assessmentOption = getAssessmentExportOptions((assessmentData || []) as AssessmentRow[])[0]

  if (!assessmentOption) {
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
        subjectName: assessmentOption.subjectName,
        sectionName: assessmentOption.sectionName,
        assessmentCode: assessmentOption.assessmentCode,
        termName: assessmentOption.termName,
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
      subjectName: assessmentOption.subjectName,
      sectionName: assessmentOption.sectionName,
      assessmentCode: assessmentOption.assessmentCode,
      termName: assessmentOption.termName,
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
      subjectName: assessmentOption.subjectName,
      sectionName: assessmentOption.sectionName,
      assessmentCode: assessmentOption.assessmentCode,
      termName: assessmentOption.termName,
      totalEnrolled: rows.length,
      studentsWithSubmission: rows.filter((row) => row.statusLabel !== 'No Submission').length,
      studentsWithoutSubmission: rows.filter((row) => row.statusLabel === 'No Submission').length,
    },
    rows,
  } satisfies EducatorScoreExportResult
}

// fetchAllEducatorScoreExportData - bulk-fetch export data for every educator assessment
export async function fetchAllEducatorScoreExportData(): Promise<EducatorScoreExportResult[]> {
  const supabase = createClient()
  const educatorId = await getCurrentEducatorId()

  // Round-trip 1: all assessments for this educator
  const { data: assessmentsData, error: assessmentsError } = await supabase
    .from('tbl_assessments')
    .select(
      'id,assessment_code,term,subject_id,section_id,start_date,end_date,start_time,end_time,time_limit,is_shuffle,allow_review,allow_retake,retake_count,subject:subject_id(subject_name),section:section_id(section_name),academic_term:term(term_name,semester)'
    )
    .eq('educator_id', educatorId)
    .order('created_at', { ascending: false })

  if (assessmentsError) {
    throw new Error(getSupabaseErrorMessage(assessmentsError, 'Failed to load assessments for bulk export.'))
  }

  const assessmentRows = (assessmentsData || []) as AssessmentRow[]

  if (assessmentRows.length === 0) {
    return []
  }

  const assessmentOptions = getAssessmentExportOptions(assessmentRows)
  const assessmentIds = assessmentRows.map((row) => row.id).filter((id): id is number => id !== undefined)
  const subjectIds = [...new Set(assessmentRows.map((row) => row.subject_id))]

  // Round-trip 2: enrollments, scores, and quizzes in parallel
  const [
    { data: enrollmentData, error: enrollmentError },
    { data: scoreData, error: scoreError },
    { data: quizData, error: quizError },
  ] = await Promise.all([
    supabase
      .from('tbl_enrolled')
      .select('student_id,subject_id,is_active,student:student_id(id,user_id,given_name,surname,is_active)')
      .eq('educator_id', educatorId)
      .in('subject_id', subjectIds)
      .eq('is_active', true),
    supabase
      .from('tbl_scores')
      .select(
        'id,student_id,assessment_id,subject_id,section_id,score,total_questions,student_answer,warning_attempts,taken_at,submitted_at,status,is_passed'
      )
      .eq('educator_id', educatorId)
      .in('assessment_id', assessmentIds)
      .not('submitted_at', 'is', null),
    supabase
      .from('tbl_quizzes')
      .select('id,assessment_id')
      .in('assessment_id', assessmentIds),
  ])

  if (enrollmentError) {
    throw new Error(getSupabaseErrorMessage(enrollmentError, 'Failed to load enrollments for bulk export.'))
  }

  if (scoreError) {
    throw new Error(getSupabaseErrorMessage(scoreError, 'Failed to load scores for bulk export.'))
  }

  if (quizError) {
    throw new Error(getSupabaseErrorMessage(quizError, 'Failed to load quizzes for bulk export.'))
  }

  // Build quiz count map: assessmentId → question count
  const quizCountMap = new Map<number, number>()
  ;(quizData || []).forEach((quiz: Pick<QuizRow, 'id' | 'assessment_id'>) => {
    quizCountMap.set(quiz.assessment_id, (quizCountMap.get(quiz.assessment_id) || 0) + 1)
  })

  // Build enrollment map: subjectId → sorted StudentRow[]
  const enrollmentMap = new Map<number, StudentRow[]>()
  ;((enrollmentData || []) as EnrollmentWithStudentRow[]).forEach((row) => {
    const student = getSingleRelation(row.student)
    if (!student) return
    const existing = enrollmentMap.get(row.subject_id) || []
    existing.push(student)
    enrollmentMap.set(row.subject_id, existing)
  })
  enrollmentMap.forEach((students, subjectId) => {
    enrollmentMap.set(
      subjectId,
      students.sort((leftStudent, rightStudent) => {
        const leftName = `${leftStudent.given_name} ${leftStudent.surname}`.trim()
        const rightName = `${rightStudent.given_name} ${rightStudent.surname}`.trim()
        return leftName.localeCompare(rightName)
      })
    )
  })

  // Build score map: assessmentId → studentId → ScoreSnapshot[]
  const scoreMap = new Map<number, Map<number, ScoreSnapshot[]>>()
  ;((scoreData || []) as ScoreSnapshot[]).forEach((score) => {
    if (!scoreMap.has(score.assessment_id)) {
      scoreMap.set(score.assessment_id, new Map())
    }
    const assessmentScores = scoreMap.get(score.assessment_id)!
    const studentScores = assessmentScores.get(score.student_id) || []
    studentScores.push(score)
    assessmentScores.set(score.student_id, studentScores)
  })

  // Build one EducatorScoreExportResult per assessment
  return assessmentOptions.map((assessmentOption) => {
    const totalQuestions = quizCountMap.get(assessmentOption.assessmentRowId) || 0
    const enrolledStudents = enrollmentMap.get(assessmentOption.subjectId) || []
    const assessmentScoreMap = scoreMap.get(assessmentOption.assessmentRowId) || new Map<number, ScoreSnapshot[]>()

    const rows: EducatorScoreExportRow[] = enrolledStudents.map((student) => {
      const bestScore = getBestSubmittedScore(assessmentScoreMap.get(student.id) || [])

      if (!bestScore) {
        return {
          studentId: student.id,
          studentUserId: student.user_id,
          studentName: `${student.given_name} ${student.surname}`.trim(),
          subjectName: assessmentOption.subjectName,
          sectionName: assessmentOption.sectionName,
          assessmentCode: assessmentOption.assessmentCode,
          termName: assessmentOption.termName,
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
        subjectName: assessmentOption.subjectName,
        sectionName: assessmentOption.sectionName,
        assessmentCode: assessmentOption.assessmentCode,
        termName: assessmentOption.termName,
        highestScore: bestScore.score || 0,
        totalQuestions: bestScore.total_questions || totalQuestions,
        percentage: getScorePercentage(bestScore),
        statusLabel: bestScore.status === 'passed' ? 'Passed' : 'Failed',
        remark: 'Highest Submitted Score',
        highestSubmittedAt: bestScore.submitted_at,
      } satisfies EducatorScoreExportRow
    })

    return {
      summary: {
        subjectName: assessmentOption.subjectName,
        sectionName: assessmentOption.sectionName,
        assessmentCode: assessmentOption.assessmentCode,
        termName: assessmentOption.termName,
        totalEnrolled: rows.length,
        studentsWithSubmission: rows.filter((row) => row.statusLabel !== 'No Submission').length,
        studentsWithoutSubmission: rows.filter((row) => row.statusLabel === 'No Submission').length,
      },
      rows,
    } satisfies EducatorScoreExportResult
  })
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
      'id,student_id,assessment_id,subject_id,section_id,score,total_questions,student_answer,warning_attempts,taken_at,submitted_at,status,is_passed,assessment:assessment_id(assessment_code,subject_id,section_id,start_date,end_date,start_time,end_time,time_limit,is_shuffle,allow_review,allow_retake,retake_count,subject:subject_id(subject_name),section:section_id(section_name),academic_term:term(term_name,semester)),student:student_id(id,user_id,given_name,surname,is_active)'
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

  const assessmentIds = [...new Set(visibleScores.map((score) => score.assessment_id))]
  const studentIds = [...new Set(visibleScores.map((score) => score.student_id))]
  const [{ data: quizData, error: quizError }, { data: retakeGrantData, error: retakeGrantError }] =
    await Promise.all([
      supabase
        .from('tbl_quizzes')
        .select('id,assessment_id,question,quiz_type,choices,correct_answer')
        .in('assessment_id', assessmentIds)
        .order('id', { ascending: true }),
      supabase
        .from('tbl_student_assessment_retakes')
        .select('student_id,assessment_id,extra_retake_count,is_active')
        .eq('educator_id', educatorId)
        .eq('is_active', true)
        .in('assessment_id', assessmentIds)
        .in('student_id', studentIds),
    ])

  if (quizError) {
    throw new Error(getSupabaseErrorMessage(quizError, 'Failed to load quiz questions.'))
  }

  if (retakeGrantError) {
    throw new Error(getSupabaseErrorMessage(retakeGrantError, 'Failed to load retake grant data.'))
  }

  const quizMap = ((quizData || []) as QuizRow[]).reduce<Map<number, QuizRow[]>>((result, quiz) => {
    const currentRows = result.get(quiz.assessment_id) || []
    currentRows.push(quiz)
    result.set(quiz.assessment_id, currentRows)
    return result
  }, new Map<number, QuizRow[]>())
  const scoreHistoryMap = visibleScores.reduce<Map<string, ScoreRow[]>>((result, score) => {
    const historyKey = `${score.student_id}:${score.assessment_id}`
    const currentRows = result.get(historyKey) || []
    currentRows.push(score)
    result.set(historyKey, currentRows)
    return result
  }, new Map<string, ScoreRow[]>())
  const retakeGrantMap = ((retakeGrantData || []) as StudentAssessmentRetakeRow[]).reduce<Map<string, number>>(
    (result, row) => {
      result.set(
        `${row.student_id}:${row.assessment_id}`,
        row.is_active ? Math.max(row.extra_retake_count, 0) : 0
      )
      return result
    },
    new Map<string, number>()
  )

  const groupedScoreMap = visibleScores.reduce<Map<string, ScoreRow[]>>((result, score) => {
    const groupKey = `${score.student_id}:${score.assessment_id}`
    const currentRows = result.get(groupKey) || []
    currentRows.push(score)
    result.set(groupKey, currentRows)
    return result
  }, new Map<string, ScoreRow[]>())

  return Array.from(groupedScoreMap.values()).map((groupedScores) => {
    const representativeScore = groupedScores[0]
    const assessment = getSingleRelation(representativeScore.assessment)
    const student = getSingleRelation(representativeScore.student)

    if (!assessment || !student) {
      throw new Error('Score details are incomplete.')
    }

    const subject = getSingleRelation(assessment.subject)
    const section = getSingleRelation(assessment.section)
    const term = getSingleRelation(assessment.academic_term)
    const historyKey = `${representativeScore.student_id}:${representativeScore.assessment_id}`
    const submittedScores = scoreHistoryMap.get(historyKey) || []
    const grantedRetakeCount = retakeGrantMap.get(historyKey) || 0
    const retakeState = getRetakeState(assessment, submittedScores, grantedRetakeCount)
    const bestScore = getBestSubmittedScore(submittedScores)
    const latestScore = getLatestSubmittedScore(submittedScores)
    const reviewSourceScore = latestScore || bestScore || representativeScore
    const studentAnswers = normalizeStoredAnswers(reviewSourceScore.student_answer)

    return {
      scoreId: reviewSourceScore.id,
      studentId: student.id,
      studentUserId: student.user_id,
      studentName: `${student.given_name} ${student.surname}`.trim(),
      assessmentRowId: representativeScore.assessment_id,
      assessmentCode: assessment.assessment_code,
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
      startDate: assessment.start_date,
      endDate: assessment.end_date,
      startTime: assessment.start_time,
      endTime: assessment.end_time,
      timeLimitMinutes: Number(assessment.time_limit) || 0,
      isShuffle: assessment.is_shuffle,
      allowReview: assessment.allow_review,
      warningAttempts: reviewSourceScore.warning_attempts ?? 0,
      questions: (quizMap.get(representativeScore.assessment_id) || []).map((quiz) => {
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

// updateEducatorRetakeGrant - save educator extra retake count for one student assessment
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
    .from('tbl_student_assessment_retakes')
    .upsert(
      {
        educator_id: educatorId,
        student_id: input.studentId,
        assessment_id: input.assessmentRowId,
        extra_retake_count: nextRetakeCount,
        is_active: nextRetakeCount > 0,
        updated_at: now,
      },
      {
        onConflict: 'educator_id,student_id,assessment_id',
      }
    )

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to save retake grant.'))
  }

  try {
    const [{ data: studentData, error: studentError }, { data: assessmentData, error: assessmentError }] =
      await Promise.all([
        supabase
          .from('tbl_users')
          .select('given_name,surname')
          .eq('id', input.studentId)
          .single(),
        supabase
          .from('tbl_assessments')
          .select('id,assessment_code,subject_id,section_id,subject:subject_id(subject_name),section:section_id(section_name)')
          .eq('educator_id', educatorId)
          .eq('id', input.assessmentRowId)
          .single(),
      ])

    if (studentError) {
      throw new Error(getSupabaseErrorMessage(studentError, 'Failed to load retake student details.'))
    }

    if (assessmentError) {
      throw new Error(getSupabaseErrorMessage(assessmentError, 'Failed to load retake assessment details.'))
    }

    const assessmentRow = assessmentData as {
      id: number
      assessment_code: string
      subject_id: number
      section_id: number
      subject: { subject_name: string } | { subject_name: string }[] | null
      section: { section_name: string } | { section_name: string }[] | null
    }
    const assessmentSubject = Array.isArray(assessmentRow.subject) ? assessmentRow.subject[0] : assessmentRow.subject
    const assessmentSection = Array.isArray(assessmentRow.section) ? assessmentRow.section[0] : assessmentRow.section
    const notificationContext = {
      studentId: input.studentId,
      studentName: `${(studentData as { given_name: string; surname: string }).given_name} ${(studentData as { given_name: string; surname: string }).surname}`.trim(),
      assessmentRowId: assessmentRow.id,
      assessmentCode: assessmentRow.assessment_code,
      subjectId: assessmentRow.subject_id,
      subjectName: assessmentSubject?.subject_name || 'Unknown Subject',
      sectionId: assessmentRow.section_id,
      sectionName: assessmentSection?.section_name || 'Unknown Section',
      retakeCount: nextRetakeCount,
    } satisfies RetakeNotificationContext
    const notificationRows: NotificationInsertInput[] = [
      {
        recipientUserId: notificationContext.studentId,
        actorUserId: educatorId,
        eventType: 'retake_updated',
        title: 'Retake updated',
        message:
          notificationContext.retakeCount > 0
            ? `Your retake count for ${notificationContext.assessmentCode} in ${notificationContext.subjectName} is now ${notificationContext.retakeCount}.`
            : `Your extra retake access for ${notificationContext.assessmentCode} in ${notificationContext.subjectName} has been removed.`,
        linkPath: '/student/assessment/quiz',
        assessmentId: notificationContext.assessmentRowId,
        subjectId: notificationContext.subjectId,
        sectionId: notificationContext.sectionId,
        metadata: {
          studentName: notificationContext.studentName,
          assessmentCode: notificationContext.assessmentCode,
          subjectName: notificationContext.subjectName,
          sectionName: notificationContext.sectionName,
          retakeCount: notificationContext.retakeCount,
        },
      },
    ]

    await insertNotifications(notificationRows)
  } catch (notificationError) {
    console.error('Failed to save retake notifications.', notificationError)
  }

  return {
    retakeCount: nextRetakeCount,
  }
}

