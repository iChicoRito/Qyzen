import { createClient } from '@/lib/supabase/server'
import {
  getFullName,
  getLatestScoreContext,
  getLatestScoresByStudentAssessment,
  getPercentage,
} from '@/lib/supabase/admin-dashboard-helpers'

import type {
  EducatorAssessmentOverview,
  EducatorDashboardAnalytics,
  EducatorAssessmentInsight,
  EducatorSectionInsight,
  EducatorSummaryCard,
  EducatorTopStudentRow,
} from '@/lib/supabase/educator-dashboard-types'

interface UserRow {
  id: number
  user_type: string
  user_id: string
  given_name: string
  surname: string
  email: string
  is_active: boolean
  deleted_at: string | null
}

interface SectionRow {
  id: number
  educator_id: number
  section_name: string
  is_active: boolean
}

interface SubjectRow {
  id: number
  educator_id: number
  sections_id: number
  subject_name: string
  subject_code: string
  is_active: boolean
}

interface AssessmentRelationRow {
  subject_name: string
}

interface SectionRelationRow {
  section_name: string
}

interface TermRelationRow {
  term_name: string
  semester: string
}

interface AssessmentRow {
  id: number
  educator_id: number
  assessment_code: string
  subject_id: number
  section_id: number
  term: number
  time_limit: string
  is_active: boolean
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  created_at: string
  subject: AssessmentRelationRow | AssessmentRelationRow[] | null
  section: SectionRelationRow | SectionRelationRow[] | null
  academic_term: TermRelationRow | TermRelationRow[] | null
}

interface EnrollmentRow {
  id: number
  student_id: number
  educator_id: number
  subject_id: number
  is_active: boolean
  created_at: string
}

interface ScoreRow {
  id: number
  student_id: number
  educator_id: number
  assessment_id: number
  subject_id: number
  section_id: number
  score: number | null
  total_questions: number
  status: 'in_progress' | 'submitted' | 'passed' | 'failed' | null
  is_passed: boolean
  submitted_at: string | null
  created_at: string
}

interface QuizRow {
  id: number
  assessment_id: number
  quiz_type: 'multiple_choice' | 'identification'
}

interface SupabaseErrorResponse {
  message?: string
}

interface AssessmentScoreSummary {
  finishedCount: number
  passedCount: number
  failedCount: number
  passRate: number
}

// getSupabaseErrorMessage - normalize Supabase error messages
function getSupabaseErrorMessage(error: SupabaseErrorResponse | null, fallbackMessage: string) {
  return error?.message || fallbackMessage
}

// getSingleRelation - normalize a Supabase relation into one object
function getSingleRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] || null : value
}

// buildAcademicTermLabel - format the academic term text for the dashboard
function buildAcademicTermLabel(term: TermRelationRow | null) {
  if (!term) {
    return 'No term'
  }

  return `${term.term_name} - ${term.semester}`
}

// formatAssessmentSchedule - format the assessment schedule into a compact label
function formatAssessmentSchedule(assessment: Pick<AssessmentRow, 'start_date' | 'end_date' | 'start_time' | 'end_time'>) {
  const startDateTime = new Date(`${assessment.start_date}T${assessment.start_time}`)
  const endDateTime = new Date(`${assessment.end_date}T${assessment.end_time}`)
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  const startDateLabel = Number.isNaN(startDateTime.getTime())
    ? assessment.start_date
    : dateFormatter.format(startDateTime)
  const endDateLabel = Number.isNaN(endDateTime.getTime())
    ? assessment.end_date
    : dateFormatter.format(endDateTime)
  const startTimeLabel = Number.isNaN(startDateTime.getTime())
    ? assessment.start_time
    : timeFormatter.format(startDateTime)
  const endTimeLabel = Number.isNaN(endDateTime.getTime())
    ? assessment.end_time
    : timeFormatter.format(endDateTime)

  if (startDateLabel === endDateLabel) {
    return `${startDateLabel} | ${startTimeLabel} - ${endTimeLabel}`
  }

  return `${startDateLabel} ${startTimeLabel} - ${endDateLabel} ${endTimeLabel}`
}

// buildAssessmentScoreSummary - compute finished, passed, and failed counts for an assessment
function buildAssessmentScoreSummary(scoreRows: ScoreRow[]): AssessmentScoreSummary {
  const latestContexts = scoreRows.map((scoreRow) => getLatestScoreContext(scoreRow))
  const finishedCount = latestContexts.filter((context) => context.isFinished).length
  const passedCount = latestContexts.filter((context) => context.isPassed).length
  const failedCount = latestContexts.filter((context) => context.isFailed).length

  return {
    finishedCount,
    passedCount,
    failedCount,
    passRate: finishedCount > 0 ? (passedCount / finishedCount) * 100 : 0,
  }
}

// fetchEducatorDashboardAnalytics - load live educator dashboard metrics
export async function fetchEducatorDashboardAnalytics(educatorId: number) {
  const supabase = await createClient()

  const [
    { data: usersData, error: usersError },
    { data: sectionsData, error: sectionsError },
    { data: subjectsData, error: subjectsError },
    { data: assessmentsData, error: assessmentsError },
    { data: enrollmentsData, error: enrollmentsError },
    { data: scoresData, error: scoresError },
  ] = await Promise.all([
    supabase
      .from('tbl_users')
      .select('id,user_type,user_id,given_name,surname,email,is_active,deleted_at'),
    supabase.from('tbl_sections').select('id,educator_id,section_name,is_active'),
    supabase.from('tbl_subjects').select('id,educator_id,sections_id,subject_name,subject_code,is_active'),
    supabase
      .from('tbl_assessments')
      .select(
        'id,educator_id,assessment_code,subject_id,section_id,term,time_limit,is_active,start_date,end_date,start_time,end_time,created_at,subject:subject_id(subject_name),section:section_id(section_name),academic_term:term(term_name,semester)'
      )
      .eq('educator_id', educatorId)
      .order('created_at', { ascending: false }),
    supabase
      .from('tbl_enrolled')
      .select('id,student_id,educator_id,subject_id,is_active,created_at')
      .eq('educator_id', educatorId),
    supabase
      .from('tbl_scores')
      .select(
        'id,student_id,educator_id,assessment_id,subject_id,section_id,score,total_questions,status,is_passed,submitted_at,created_at'
      )
      .eq('educator_id', educatorId),
  ])

  const assessmentIds = ((assessmentsData || []) as AssessmentRow[]).map((assessmentRow) => assessmentRow.id)
  const { data: quizzesData, error: quizzesError } =
    assessmentIds.length > 0
      ? await supabase.from('tbl_quizzes').select('id,assessment_id,quiz_type').in('assessment_id', assessmentIds)
      : { data: [], error: null as SupabaseErrorResponse | null }

  if (usersError) {
    throw new Error(getSupabaseErrorMessage(usersError, 'Failed to load educator users.'))
  }

  if (sectionsError) {
    throw new Error(getSupabaseErrorMessage(sectionsError, 'Failed to load educator sections.'))
  }

  if (subjectsError) {
    throw new Error(getSupabaseErrorMessage(subjectsError, 'Failed to load educator subjects.'))
  }

  if (assessmentsError) {
    throw new Error(getSupabaseErrorMessage(assessmentsError, 'Failed to load educator assessments.'))
  }

  if (enrollmentsError) {
    throw new Error(getSupabaseErrorMessage(enrollmentsError, 'Failed to load educator enrollments.'))
  }

  if (scoresError) {
    throw new Error(getSupabaseErrorMessage(scoresError, 'Failed to load educator scores.'))
  }

  if (quizzesError) {
    throw new Error(getSupabaseErrorMessage(quizzesError, 'Failed to load educator quizzes.'))
  }

  const users = ((usersData || []) as UserRow[]).filter((userRow) => userRow.is_active && !userRow.deleted_at)
  const studentUsers = users.filter((userRow) => userRow.user_type === 'student')
  const activeSections = ((sectionsData || []) as SectionRow[]).filter(
    (sectionRow) => sectionRow.educator_id === educatorId && sectionRow.is_active
  )
  const allSections = (sectionsData || []) as SectionRow[]
  const activeSubjects = ((subjectsData || []) as SubjectRow[]).filter(
    (subjectRow) => subjectRow.educator_id === educatorId && subjectRow.is_active
  )
  const allSubjects = (subjectsData || []) as SubjectRow[]
  const activeAssessments = ((assessmentsData || []) as AssessmentRow[]).filter((assessmentRow) => assessmentRow.is_active)
  const allAssessments = (assessmentsData || []) as AssessmentRow[]
  const activeEnrollments = ((enrollmentsData || []) as EnrollmentRow[]).filter((enrollmentRow) =>
    enrollmentRow.is_active && enrollmentRow.educator_id === educatorId
  )
  const educatorScores = (scoresData || []) as ScoreRow[]
  const quizRows = (quizzesData || []) as QuizRow[]

  const studentMap = new Map(studentUsers.map((studentRow) => [studentRow.id, studentRow]))
  const sectionMap = new Map(allSections.map((sectionRow) => [sectionRow.id, sectionRow]))
  const subjectMap = new Map(allSubjects.map((subjectRow) => [subjectRow.id, subjectRow]))
  const quizzesByAssessmentMap = quizRows.reduce<Map<number, QuizRow[]>>((result, quizRow) => {
    const currentRows = result.get(quizRow.assessment_id) || []
    currentRows.push(quizRow)
    result.set(quizRow.assessment_id, currentRows)
    return result
  }, new Map<number, QuizRow[]>())

  const latestScoreMap = getLatestScoresByStudentAssessment(educatorScores)
  const latestScores = [...latestScoreMap.values()]
  const latestContexts = latestScores.map((scoreRow) => getLatestScoreContext(scoreRow))

  const enrolledStudentIds = new Set(
    activeEnrollments
      .filter((enrollmentRow) => studentMap.has(enrollmentRow.student_id))
      .map((enrollmentRow) => enrollmentRow.student_id)
  )

  const sectionEnrollmentMap = activeEnrollments.reduce<Map<number, Set<number>>>((result, enrollmentRow) => {
    const subjectRow = subjectMap.get(enrollmentRow.subject_id)
    const sectionId = subjectRow?.sections_id

    if (!sectionId || !studentMap.has(enrollmentRow.student_id)) {
      return result
    }

    const currentStudents = result.get(sectionId) || new Set<number>()
    currentStudents.add(enrollmentRow.student_id)
    result.set(sectionId, currentStudents)
    return result
  }, new Map<number, Set<number>>())

  const sectionAssessmentMap = activeAssessments.reduce<Map<number, AssessmentRow[]>>((result, assessmentRow) => {
    const currentRows = result.get(assessmentRow.section_id) || []
    currentRows.push(assessmentRow)
    result.set(assessmentRow.section_id, currentRows)
    return result
  }, new Map<number, AssessmentRow[]>())

  const assessmentScoreMap = latestScores.reduce<Map<number, ScoreRow[]>>((result, scoreRow) => {
    const currentRows = result.get(scoreRow.assessment_id) || []
    currentRows.push(scoreRow)
    result.set(scoreRow.assessment_id, currentRows)
    return result
  }, new Map<number, ScoreRow[]>())

  const summaryCards: EducatorSummaryCard[] = [
    {
      key: 'sections',
      label: 'Total Sections',
      value: activeSections.length,
      helper: 'Active classroom sections',
    },
    {
      key: 'subjects',
      label: 'Total Subjects',
      value: activeSubjects.length,
      helper: 'Active subject assignments',
    },
    {
      key: 'assessments',
      label: 'Total Assessments',
      value: activeAssessments.length,
      helper: 'Published assessments',
    },
    {
      key: 'students',
      label: 'Total Students',
      value: enrolledStudentIds.size,
      helper: 'Active enrolled learners',
    },
  ]

  const assessmentOverview: EducatorAssessmentOverview = {
    enrolledStudents: enrolledStudentIds.size,
    activeAssessments: activeAssessments.length,
    quizQuestions: quizRows.length,
    finishedAssessments: latestContexts.filter((context) => context.isFinished).length,
    inProgressAssessments: latestContexts.filter((context) => context.latestState === 'inProgress').length,
    passedAssessments: latestContexts.filter((context) => context.isPassed).length,
    failedAssessments: latestContexts.filter((context) => context.isFailed).length,
    passRate: 0,
    averageScore:
      latestScores.length > 0
        ? latestScores.reduce((total, scoreRow) => total + getPercentage(scoreRow.score, scoreRow.total_questions), 0) /
          latestScores.length
        : 0,
  }

  assessmentOverview.passRate =
    assessmentOverview.finishedAssessments > 0
      ? (assessmentOverview.passedAssessments / assessmentOverview.finishedAssessments) * 100
      : 0

  const sectionInsights: EducatorSectionInsight[] = activeSections
    .map((sectionRow) => {
      const sectionAssessments = sectionAssessmentMap.get(sectionRow.id) || []
      const sectionStudents = sectionEnrollmentMap.get(sectionRow.id) || new Set<number>()
      const sectionScores = latestScores.filter((scoreRow) => scoreRow.section_id === sectionRow.id)
      const sectionScoreSummary = buildAssessmentScoreSummary(sectionScores)
      const sectionSubjects = allSubjects.filter((subjectRow) => subjectRow.sections_id === sectionRow.id)

      return {
        sectionId: sectionRow.id,
        sectionName: sectionRow.section_name,
        status: sectionRow.is_active ? 'active' : 'inactive',
        subjectCount: sectionSubjects.length,
        assessmentCount: sectionAssessments.length,
        studentCount: sectionStudents.size,
        finishedAssessmentCount: sectionScoreSummary.finishedCount,
        passRate: sectionScoreSummary.passRate,
      } satisfies EducatorSectionInsight
    })
    .sort((leftRow, rightRow) => rightRow.studentCount - leftRow.studentCount)

  const assessmentInsights: EducatorAssessmentInsight[] = activeAssessments
    .map((assessmentRow) => {
      const subjectRow = subjectMap.get(assessmentRow.subject_id)
      const sectionRow = sectionMap.get(assessmentRow.section_id)
      const assessmentQuizzes = quizzesByAssessmentMap.get(assessmentRow.id) || []
      const assessmentScores = assessmentScoreMap.get(assessmentRow.id) || []
      const assessmentScoreSummary = buildAssessmentScoreSummary(assessmentScores)
      const enrolledStudentCount = activeEnrollments
        .filter((enrollmentRow) => enrollmentRow.subject_id === assessmentRow.subject_id)
        .reduce((result, enrollmentRow) => result.add(enrollmentRow.student_id), new Set<number>()).size
      const subjectRelation = getSingleRelation(assessmentRow.subject)
      const sectionRelation = getSingleRelation(assessmentRow.section)
      const termRelation = getSingleRelation(assessmentRow.academic_term)

      return {
        assessmentId: assessmentRow.id,
        assessmentCode: assessmentRow.assessment_code,
        subjectName: subjectRelation?.subject_name || subjectRow?.subject_name || 'Unknown Subject',
        sectionName: sectionRelation?.section_name || sectionRow?.section_name || 'Unknown Section',
        termName: buildAcademicTermLabel(termRelation),
        schedule: formatAssessmentSchedule(assessmentRow),
        status: assessmentRow.is_active ? 'active' : 'inactive',
        questionCount: assessmentQuizzes.length,
        enrolledStudentCount,
        finishedAssessmentCount: assessmentScoreSummary.finishedCount,
        passedAssessmentCount: assessmentScoreSummary.passedCount,
        failedAssessmentCount: assessmentScoreSummary.failedCount,
        passRate: assessmentScoreSummary.passRate,
      } satisfies EducatorAssessmentInsight
    })
    .sort((leftRow, rightRow) => rightRow.assessmentId - leftRow.assessmentId)

  const topStudentsMap = latestScores.reduce<Map<number, EducatorTopStudentRow & { weightedScore: number; weightedTotal: number }>>(
    (result, scoreRow) => {
      const context = getLatestScoreContext(scoreRow)
      const studentRow = studentMap.get(scoreRow.student_id)
      const subjectRow = subjectMap.get(scoreRow.subject_id)
      const sectionRow = sectionMap.get(scoreRow.section_id)

      if (!studentRow || !subjectRow || !sectionRow || !context.isFinished) {
        return result
      }

      const currentRow = result.get(scoreRow.student_id) || {
        studentId: studentRow.id,
        studentName: getFullName(studentRow),
        studentCode: studentRow.user_id,
        subjectName: subjectRow.subject_name,
        sectionName: sectionRow.section_name,
        weightedAverage: 0,
        passedCount: 0,
        finishedCount: 0,
        latestSubmittedAt: null,
        weightedScore: 0,
        weightedTotal: 0,
      }

      currentRow.weightedScore += scoreRow.score ?? 0
      currentRow.weightedTotal += scoreRow.total_questions
      currentRow.finishedCount += 1

      if (context.isPassed) {
        currentRow.passedCount += 1
      }

      const currentPercent = getPercentage(scoreRow.score, scoreRow.total_questions)

      if (currentPercent >= currentRow.weightedAverage) {
        currentRow.subjectName = subjectRow.subject_name
        currentRow.sectionName = sectionRow.section_name
      }

      if (
        !currentRow.latestSubmittedAt ||
        (scoreRow.submitted_at && scoreRow.submitted_at > currentRow.latestSubmittedAt)
      ) {
        currentRow.latestSubmittedAt = scoreRow.submitted_at
      }

      currentRow.weightedAverage =
        currentRow.weightedTotal > 0 ? (currentRow.weightedScore / currentRow.weightedTotal) * 100 : 0

      result.set(scoreRow.student_id, currentRow)
      return result
    },
    new Map<number, EducatorTopStudentRow & { weightedScore: number; weightedTotal: number }>()
  )

  const topStudents: EducatorTopStudentRow[] = [...topStudentsMap.values()]
    .sort((leftRow, rightRow) => {
      if (rightRow.weightedAverage !== leftRow.weightedAverage) {
        return rightRow.weightedAverage - leftRow.weightedAverage
      }

      if (rightRow.passedCount !== leftRow.passedCount) {
        return rightRow.passedCount - leftRow.passedCount
      }

      if (rightRow.finishedCount !== leftRow.finishedCount) {
        return rightRow.finishedCount - leftRow.finishedCount
      }

      return (rightRow.latestSubmittedAt || '').localeCompare(leftRow.latestSubmittedAt || '')
    })
    .slice(0, 5)
    .map(({ weightedScore: _weightedScore, weightedTotal: _weightedTotal, ...row }) => row)

  return {
    summaryCards,
    assessmentOverview,
    sectionInsights,
    assessmentInsights,
    topStudents,
  } satisfies EducatorDashboardAnalytics
}

