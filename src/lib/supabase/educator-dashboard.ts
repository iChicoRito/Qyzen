import { createClient } from '@/lib/supabase/server'
import {
  getFullName,
  getLatestScoreContext,
  getLatestScoresByStudentModule,
  getPercentage,
} from '@/lib/supabase/admin-dashboard-helpers'

import type {
  EducatorAssessmentOverview,
  EducatorDashboardAnalytics,
  EducatorModuleInsight,
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

interface ModuleRelationRow {
  subject_name: string
}

interface SectionRelationRow {
  section_name: string
}

interface TermRelationRow {
  term_name: string
  semester: string
}

interface ModuleRow {
  id: number
  educator_id: number
  module_code: string
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
  subject: ModuleRelationRow | ModuleRelationRow[] | null
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
  module_id: number
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
  module_id: number
  quiz_type: 'multiple_choice' | 'identification'
}

interface SupabaseErrorResponse {
  message?: string
}

interface ModuleScoreSummary {
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

// formatModuleSchedule - format the module schedule into a compact label
function formatModuleSchedule(module: Pick<ModuleRow, 'start_date' | 'end_date' | 'start_time' | 'end_time'>) {
  const startDateTime = new Date(`${module.start_date}T${module.start_time}`)
  const endDateTime = new Date(`${module.end_date}T${module.end_time}`)
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
    ? module.start_date
    : dateFormatter.format(startDateTime)
  const endDateLabel = Number.isNaN(endDateTime.getTime())
    ? module.end_date
    : dateFormatter.format(endDateTime)
  const startTimeLabel = Number.isNaN(startDateTime.getTime())
    ? module.start_time
    : timeFormatter.format(startDateTime)
  const endTimeLabel = Number.isNaN(endDateTime.getTime())
    ? module.end_time
    : timeFormatter.format(endDateTime)

  if (startDateLabel === endDateLabel) {
    return `${startDateLabel} | ${startTimeLabel} - ${endTimeLabel}`
  }

  return `${startDateLabel} ${startTimeLabel} - ${endDateLabel} ${endTimeLabel}`
}

// buildModuleScoreSummary - compute finished, passed, and failed counts for a module
function buildModuleScoreSummary(scoreRows: ScoreRow[]): ModuleScoreSummary {
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
    { data: modulesData, error: modulesError },
    { data: enrollmentsData, error: enrollmentsError },
    { data: scoresData, error: scoresError },
  ] = await Promise.all([
    supabase
      .from('tbl_users')
      .select('id,user_type,user_id,given_name,surname,email,is_active,deleted_at'),
    supabase.from('tbl_sections').select('id,educator_id,section_name,is_active'),
    supabase.from('tbl_subjects').select('id,educator_id,sections_id,subject_name,subject_code,is_active'),
    supabase
      .from('tbl_modules')
      .select(
        'id,educator_id,module_code,subject_id,section_id,term,time_limit,is_active,start_date,end_date,start_time,end_time,created_at,subject:subject_id(subject_name),section:section_id(section_name),academic_term:term(term_name,semester)'
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
        'id,student_id,educator_id,module_id,subject_id,section_id,score,total_questions,status,is_passed,submitted_at,created_at'
      )
      .eq('educator_id', educatorId),
  ])

  const moduleIds = ((modulesData || []) as ModuleRow[]).map((moduleRow) => moduleRow.id)
  const { data: quizzesData, error: quizzesError } =
    moduleIds.length > 0
      ? await supabase.from('tbl_quizzes').select('id,module_id,quiz_type').in('module_id', moduleIds)
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

  if (modulesError) {
    throw new Error(getSupabaseErrorMessage(modulesError, 'Failed to load educator modules.'))
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
  const activeModules = ((modulesData || []) as ModuleRow[]).filter((moduleRow) => moduleRow.is_active)
  const allModules = (modulesData || []) as ModuleRow[]
  const activeEnrollments = ((enrollmentsData || []) as EnrollmentRow[]).filter((enrollmentRow) =>
    enrollmentRow.is_active && enrollmentRow.educator_id === educatorId
  )
  const educatorScores = (scoresData || []) as ScoreRow[]
  const quizRows = (quizzesData || []) as QuizRow[]

  const studentMap = new Map(studentUsers.map((studentRow) => [studentRow.id, studentRow]))
  const sectionMap = new Map(allSections.map((sectionRow) => [sectionRow.id, sectionRow]))
  const subjectMap = new Map(allSubjects.map((subjectRow) => [subjectRow.id, subjectRow]))
  const quizzesByModuleMap = quizRows.reduce<Map<number, QuizRow[]>>((result, quizRow) => {
    const currentRows = result.get(quizRow.module_id) || []
    currentRows.push(quizRow)
    result.set(quizRow.module_id, currentRows)
    return result
  }, new Map<number, QuizRow[]>())

  const latestScoreMap = getLatestScoresByStudentModule(educatorScores)
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

  const sectionModuleMap = activeModules.reduce<Map<number, ModuleRow[]>>((result, moduleRow) => {
    const currentRows = result.get(moduleRow.section_id) || []
    currentRows.push(moduleRow)
    result.set(moduleRow.section_id, currentRows)
    return result
  }, new Map<number, ModuleRow[]>())

  const moduleScoreMap = latestScores.reduce<Map<number, ScoreRow[]>>((result, scoreRow) => {
    const currentRows = result.get(scoreRow.module_id) || []
    currentRows.push(scoreRow)
    result.set(scoreRow.module_id, currentRows)
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
      key: 'modules',
      label: 'Total Modules',
      value: activeModules.length,
      helper: 'Published assessment modules',
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
    activeModules: activeModules.length,
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
      const sectionModules = sectionModuleMap.get(sectionRow.id) || []
      const sectionStudents = sectionEnrollmentMap.get(sectionRow.id) || new Set<number>()
      const sectionScores = latestScores.filter((scoreRow) => scoreRow.section_id === sectionRow.id)
      const sectionScoreSummary = buildModuleScoreSummary(sectionScores)
      const sectionSubjects = allSubjects.filter((subjectRow) => subjectRow.sections_id === sectionRow.id)

      return {
        sectionId: sectionRow.id,
        sectionName: sectionRow.section_name,
        status: sectionRow.is_active ? 'active' : 'inactive',
        subjectCount: sectionSubjects.length,
        moduleCount: sectionModules.length,
        studentCount: sectionStudents.size,
        finishedAssessmentCount: sectionScoreSummary.finishedCount,
        passRate: sectionScoreSummary.passRate,
      } satisfies EducatorSectionInsight
    })
    .sort((leftRow, rightRow) => rightRow.studentCount - leftRow.studentCount)

  const moduleInsights: EducatorModuleInsight[] = activeModules
    .map((moduleRow) => {
      const subjectRow = subjectMap.get(moduleRow.subject_id)
      const sectionRow = sectionMap.get(moduleRow.section_id)
      const moduleQuizzes = quizzesByModuleMap.get(moduleRow.id) || []
      const moduleScores = moduleScoreMap.get(moduleRow.id) || []
      const moduleScoreSummary = buildModuleScoreSummary(moduleScores)
      const enrolledStudentCount = activeEnrollments
        .filter((enrollmentRow) => enrollmentRow.subject_id === moduleRow.subject_id)
        .reduce((result, enrollmentRow) => result.add(enrollmentRow.student_id), new Set<number>()).size
      const subjectRelation = getSingleRelation(moduleRow.subject)
      const sectionRelation = getSingleRelation(moduleRow.section)
      const termRelation = getSingleRelation(moduleRow.academic_term)

      return {
        moduleId: moduleRow.id,
        moduleCode: moduleRow.module_code,
        subjectName: subjectRelation?.subject_name || subjectRow?.subject_name || 'Unknown Subject',
        sectionName: sectionRelation?.section_name || sectionRow?.section_name || 'Unknown Section',
        termName: buildAcademicTermLabel(termRelation),
        schedule: formatModuleSchedule(moduleRow),
        status: moduleRow.is_active ? 'active' : 'inactive',
        questionCount: moduleQuizzes.length,
        enrolledStudentCount,
        finishedAssessmentCount: moduleScoreSummary.finishedCount,
        passedAssessmentCount: moduleScoreSummary.passedCount,
        failedAssessmentCount: moduleScoreSummary.failedCount,
        passRate: moduleScoreSummary.passRate,
      } satisfies EducatorModuleInsight
    })
    .sort((leftRow, rightRow) => rightRow.moduleId - leftRow.moduleId)

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
    moduleInsights,
    topStudents,
  } satisfies EducatorDashboardAnalytics
}
