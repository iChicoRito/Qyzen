'use client'

import { createClient } from './client'
import { STUDENT_PRESENCE_FRESHNESS_MS } from './student-presence'

export type StudentMonitoringStatus = 'OFFLINE' | 'ONLINE' | 'ANSWERING' | 'FINISHED'
export type StudentPresenceStatus = 'OFFLINE' | 'ONLINE'
export type StudentAssessmentStatus = 'NOT_STARTED' | 'ANSWERING' | 'FINISHED'

export interface EducatorRealtimeMonitoringStudent {
  studentId: number
  studentUserId: string
  studentName: string
  status: StudentMonitoringStatus
  presenceStatus: StudentPresenceStatus
  assessmentStatus: StudentAssessmentStatus
  lastSeenAt: string | null
  currentPath: string | null
  latestAttemptStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'PASSED' | 'FAILED'
  latestScoreId: number | null
  latestScore: number | null
  latestTotalQuestions: number | null
  latestTakenAt: string | null
  latestSubmittedAt: string | null
  warningAttempts: number
}

export interface EducatorRealtimeMonitoringRow {
  moduleRowId: number
  moduleId: string
  moduleCode: string
  subjectId: number
  subjectName: string
  sectionId: number
  sectionName: string
  termName: string
  timeLimitMinutes: number
  questionCount: number
  enrolledCount: number
  offlineCount: number
  onlineCount: number
  answeringCount: number
  finishedCount: number
  rowStatus: StudentMonitoringStatus
  rowPresenceStatus: StudentPresenceStatus
  rowAssessmentStatus: StudentAssessmentStatus
  students: EducatorRealtimeMonitoringStudent[]
}

interface UserLookupRow {
  id: number
}

interface StudentRow {
  id: number
  user_id: string
  given_name: string
  surname: string
  is_active: boolean
}

interface EnrollmentRow {
  student_id: number
  subject_id: number
  student: StudentRow | StudentRow[] | null
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
  id: number
  module_code: string
  subject_id: number
  section_id: number
  time_limit: string
  subject: ModuleSubjectRow | ModuleSubjectRow[] | null
  section: ModuleSectionRow | ModuleSectionRow[] | null
  academic_term: ModuleTermRow | ModuleTermRow[] | null
}

interface PresenceRow {
  student_id: number
  last_seen_at: string | null
  current_path: string | null
  updated_at: string | null
}

interface ScoreRow {
  id: number
  student_id: number
  module_id: number
  score: number | null
  total_questions: number | null
  warning_attempts: number | null
  status: 'in_progress' | 'submitted' | 'passed' | 'failed' | null
  taken_at: string | null
  submitted_at: string | null
}

interface QuizRow {
  id: number
  module_id: number
}

interface SupabaseErrorResponse {
  message?: string
}

const STUDENT_STATUS_PRIORITY: Record<StudentMonitoringStatus, number> = {
  ANSWERING: 0,
  ONLINE: 1,
  FINISHED: 2,
  OFFLINE: 3,
}

const STUDENT_ASSESSMENT_STATUS_PRIORITY: Record<StudentAssessmentStatus, number> = {
  ANSWERING: 0,
  FINISHED: 1,
  NOT_STARTED: 2,
}

// getSupabaseErrorMessage - normalize Supabase error messages
function getSupabaseErrorMessage(error: SupabaseErrorResponse | null, fallbackMessage: string) {
  return error?.message || fallbackMessage
}

// getSingleRelation - normalize relation arrays into a single object
function getSingleRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] || null : value
}

// buildAcademicTermLabel - format the academic term text
function buildAcademicTermLabel(term: ModuleTermRow | null) {
  if (!term) {
    return 'No term'
  }

  return `${term.term_name} - ${term.semester}`
}

// getCurrentEducatorId - resolve the signed-in educator profile id
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

// isPresenceFresh - check whether a heartbeat is still fresh
function isPresenceFresh(lastSeenAt: string | null) {
  if (!lastSeenAt) {
    return false
  }

  const lastSeenTime = new Date(lastSeenAt).getTime()

  if (Number.isNaN(lastSeenTime)) {
    return false
  }

  return Date.now() - lastSeenTime <= STUDENT_PRESENCE_FRESHNESS_MS
}

// getLatestScoreRow - pick the newest score row for one student module
function getLatestScoreRow(scores: ScoreRow[]) {
  return [...scores].sort((leftScore, rightScore) => rightScore.id - leftScore.id)[0] || null
}

// hasSubmittedAttempt - check whether the student already finished a module attempt
function hasSubmittedAttempt(scores: ScoreRow[]) {
  return scores.some((score) => Boolean(score.submitted_at))
}

// getStudentMonitoringStatus - derive the live monitoring status for one student module
function getStudentMonitoringStatus(
  assessmentStatus: StudentAssessmentStatus,
  presenceStatus: StudentPresenceStatus
): StudentMonitoringStatus {
  if (assessmentStatus === 'ANSWERING') {
    return 'ANSWERING'
  }

  if (presenceStatus === 'ONLINE') {
    return 'ONLINE'
  }

  if (assessmentStatus === 'FINISHED') {
    return 'FINISHED'
  }

  return 'OFFLINE'
}

// getStudentPresenceStatus - derive the live presence status
function getStudentPresenceStatus(lastSeenAt: string | null): StudentPresenceStatus {
  return isPresenceFresh(lastSeenAt) ? 'ONLINE' : 'OFFLINE'
}

// getStudentAssessmentStatus - derive the assessment progress for one student module
function getStudentAssessmentStatus(scores: ScoreRow[]): StudentAssessmentStatus {
  const latestScore = getLatestScoreRow(scores)

  if (latestScore?.status === 'in_progress' && !latestScore.submitted_at) {
    return 'ANSWERING'
  }

  if (hasSubmittedAttempt(scores)) {
    return 'FINISHED'
  }

  return 'NOT_STARTED'
}

// getLatestAttemptStatus - build the latest attempt status label
function getLatestAttemptStatus(scores: ScoreRow[]) {
  const latestScore = getLatestScoreRow(scores)

  if (!latestScore) {
    return 'NOT_STARTED' as const
  }

  if (latestScore.status === 'in_progress' && !latestScore.submitted_at) {
    return 'IN_PROGRESS' as const
  }

  if (latestScore.status === 'passed') {
    return 'PASSED' as const
  }

  if (latestScore.status === 'failed' || latestScore.status === 'submitted') {
    return 'FAILED' as const
  }

  return 'NOT_STARTED' as const
}

// getRowStatus - resolve the summary status for one module row
function getRowStatus(
  rowAssessmentStatus: StudentAssessmentStatus,
  rowPresenceStatus: StudentPresenceStatus
) {
  return getStudentMonitoringStatus(rowAssessmentStatus, rowPresenceStatus)
}

// getRowPresenceStatus - resolve the summary presence state for one module row
function getRowPresenceStatus(onlineCount: number): StudentPresenceStatus {
  return onlineCount > 0 ? 'ONLINE' : 'OFFLINE'
}

// getRowAssessmentStatus - resolve the summary assessment state for one module row
function getRowAssessmentStatus(answeringCount: number, finishedCount: number): StudentAssessmentStatus {
  if (answeringCount > 0) {
    return 'ANSWERING'
  }

  if (finishedCount > 0) {
    return 'FINISHED'
  }

  return 'NOT_STARTED'
}

// sortStudents - keep modal students in a stable monitoring order
function sortStudents(students: EducatorRealtimeMonitoringStudent[]) {
  return [...students].sort((leftStudent, rightStudent) => {
    const assessmentPriorityDifference =
      STUDENT_ASSESSMENT_STATUS_PRIORITY[leftStudent.assessmentStatus] -
      STUDENT_ASSESSMENT_STATUS_PRIORITY[rightStudent.assessmentStatus]

    if (assessmentPriorityDifference !== 0) {
      return assessmentPriorityDifference
    }

    const presencePriorityDifference =
      STUDENT_STATUS_PRIORITY[leftStudent.status] - STUDENT_STATUS_PRIORITY[rightStudent.status]

    if (presencePriorityDifference !== 0) {
      return presencePriorityDifference
    }

    return leftStudent.studentName.localeCompare(rightStudent.studentName)
  })
}

// fetchEducatorRealtimeMonitoringList - load educator monitoring rows with live statuses
export async function fetchEducatorRealtimeMonitoringList() {
  const supabase = createClient()
  const educatorId = await getCurrentEducatorId()
  const [{ data: enrollmentData, error: enrollmentError }, { data: moduleData, error: moduleError }] =
    await Promise.all([
      supabase
        .from('tbl_enrolled')
        .select('student_id,subject_id,student:student_id(id,user_id,given_name,surname,is_active)')
        .eq('educator_id', educatorId)
        .eq('is_active', true),
      supabase
        .from('tbl_modules')
        .select(
          'id,module_code,subject_id,section_id,time_limit,subject:subject_id(subject_name),section:section_id(section_name),academic_term:term(term_name,semester)'
        )
        .eq('educator_id', educatorId)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
    ])

  if (enrollmentError) {
    throw new Error(getSupabaseErrorMessage(enrollmentError, 'Failed to load educator enrollments.'))
  }

  if (moduleError) {
    throw new Error(getSupabaseErrorMessage(moduleError, 'Failed to load monitoring modules.'))
  }

  const enrollments = ((enrollmentData || []) as EnrollmentRow[]).filter((enrollment) =>
    Boolean(getSingleRelation(enrollment.student)?.is_active)
  )
  const modules = (moduleData || []) as ModuleRow[]

  if (enrollments.length === 0 || modules.length === 0) {
    return [] as EducatorRealtimeMonitoringRow[]
  }

  const moduleIds = modules.map((module) => module.id)
  const studentIds = [...new Set(enrollments.map((enrollment) => enrollment.student_id))]
  const [{ data: presenceData, error: presenceError }, { data: scoreData, error: scoreError }, { data: quizData, error: quizError }] =
    await Promise.all([
      supabase
        .from('tbl_student_presence')
        .select('student_id,last_seen_at,current_path,updated_at')
        .in('student_id', studentIds),
      supabase
        .from('tbl_scores')
        .select('id,student_id,module_id,score,total_questions,warning_attempts,status,taken_at,submitted_at')
        .eq('educator_id', educatorId)
        .in('student_id', studentIds)
        .in('module_id', moduleIds)
        .order('id', { ascending: false }),
      supabase
        .from('tbl_quizzes')
        .select('id,module_id')
        .in('module_id', moduleIds),
    ])

  if (presenceError) {
    throw new Error(getSupabaseErrorMessage(presenceError, 'Failed to load student presence.'))
  }

  if (scoreError) {
    throw new Error(getSupabaseErrorMessage(scoreError, 'Failed to load student score status.'))
  }

  if (quizError) {
    throw new Error(getSupabaseErrorMessage(quizError, 'Failed to load module quiz counts.'))
  }

  const presenceMap = ((presenceData || []) as PresenceRow[]).reduce<Map<number, PresenceRow>>(
    (result, row) => {
      const currentValue = result.get(row.student_id)

      if (!currentValue) {
        result.set(row.student_id, row)
        return result
      }

      const currentTime = new Date(currentValue.updated_at || currentValue.last_seen_at || '').getTime()
      const nextTime = new Date(row.updated_at || row.last_seen_at || '').getTime()

      if (nextTime >= currentTime) {
        result.set(row.student_id, row)
      }

      return result
    },
    new Map<number, PresenceRow>()
  )
  const scoreMap = ((scoreData || []) as ScoreRow[]).reduce<Map<string, ScoreRow[]>>((result, row) => {
    const scoreKey = `${row.student_id}:${row.module_id}`
    const currentRows = result.get(scoreKey) || []
    currentRows.push(row)
    result.set(scoreKey, currentRows)
    return result
  }, new Map<string, ScoreRow[]>())
  const questionCountMap = ((quizData || []) as QuizRow[]).reduce<Map<number, number>>((result, row) => {
    result.set(row.module_id, (result.get(row.module_id) || 0) + 1)
    return result
  }, new Map<number, number>())
  const studentsBySubjectMap = enrollments.reduce<Map<number, EducatorRealtimeMonitoringStudent[]>>(
    (result, enrollment) => {
      const student = getSingleRelation(enrollment.student)

      if (!student) {
        return result
      }

      const currentRows = result.get(enrollment.subject_id) || []
      currentRows.push({
        studentId: student.id,
        studentUserId: student.user_id,
        studentName: `${student.given_name} ${student.surname}`.trim(),
        status: 'OFFLINE',
        presenceStatus: 'OFFLINE',
        assessmentStatus: 'NOT_STARTED',
        lastSeenAt: null,
        currentPath: null,
        latestAttemptStatus: 'NOT_STARTED',
        latestScoreId: null,
        latestScore: null,
        latestTotalQuestions: null,
        latestTakenAt: null,
        latestSubmittedAt: null,
        warningAttempts: 0,
      })
      result.set(enrollment.subject_id, currentRows)
      return result
    },
    new Map<number, EducatorRealtimeMonitoringStudent[]>()
  )

  return modules
    .map((module) => {
      const subject = getSingleRelation(module.subject)
      const section = getSingleRelation(module.section)
      const term = getSingleRelation(module.academic_term)
      const subjectStudents = studentsBySubjectMap.get(module.subject_id) || []
      const students = sortStudents(
        subjectStudents.map((student) => {
          const scoreKey = `${student.studentId}:${module.id}`
          const moduleScores = scoreMap.get(scoreKey) || []
          const latestScore = getLatestScoreRow(moduleScores)
          const presence = presenceMap.get(student.studentId) || null
          const presenceStatus = getStudentPresenceStatus(presence?.last_seen_at || null)
          const assessmentStatus = getStudentAssessmentStatus(moduleScores)
          const status = getStudentMonitoringStatus(assessmentStatus, presenceStatus)

          return {
            ...student,
            status,
            presenceStatus,
            assessmentStatus,
            lastSeenAt: presence?.last_seen_at || null,
            currentPath: presence?.current_path || null,
            latestAttemptStatus: getLatestAttemptStatus(moduleScores),
            latestScoreId: latestScore?.id ?? null,
            latestScore: latestScore?.score ?? null,
            latestTotalQuestions: latestScore?.total_questions ?? null,
            latestTakenAt: latestScore?.taken_at ?? null,
            latestSubmittedAt: latestScore?.submitted_at ?? null,
            warningAttempts: latestScore?.warning_attempts ?? 0,
          } satisfies EducatorRealtimeMonitoringStudent
        })
      )
      const answeringCount = students.filter((student) => student.status === 'ANSWERING').length
      const onlineCount = students.filter((student) => student.status === 'ONLINE').length
      const finishedCount = students.filter((student) => student.status === 'FINISHED').length
      const offlineCount = students.filter((student) => student.status === 'OFFLINE').length
      const connectedCount = students.filter((student) => student.presenceStatus === 'ONLINE').length
      const disconnectedCount = students.filter((student) => student.presenceStatus === 'OFFLINE').length
      const rowPresenceStatus = getRowPresenceStatus(connectedCount)
      const rowAssessmentStatus = getRowAssessmentStatus(answeringCount, finishedCount)

      return {
        moduleRowId: module.id,
        moduleId: module.module_code,
        moduleCode: module.module_code,
        subjectId: module.subject_id,
        subjectName: subject?.subject_name || 'Unknown Subject',
        sectionId: module.section_id,
        sectionName: section?.section_name || 'Unknown Section',
        termName: buildAcademicTermLabel(term),
        timeLimitMinutes: Number(module.time_limit) || 0,
        questionCount: questionCountMap.get(module.id) || 0,
        enrolledCount: students.length,
        offlineCount: disconnectedCount,
        onlineCount: connectedCount,
        answeringCount,
        finishedCount,
        rowStatus: getRowStatus(rowAssessmentStatus, rowPresenceStatus),
        rowPresenceStatus,
        rowAssessmentStatus,
        students,
      } satisfies EducatorRealtimeMonitoringRow
    })
    .filter((row) => row.enrolledCount > 0)
    .sort((leftRow, rightRow) => {
      const priorityDifference =
        STUDENT_STATUS_PRIORITY[leftRow.rowStatus] - STUDENT_STATUS_PRIORITY[rightRow.rowStatus]

      if (priorityDifference !== 0) {
        return priorityDifference
      }

      return rightRow.moduleRowId - leftRow.moduleRowId
    })
}
