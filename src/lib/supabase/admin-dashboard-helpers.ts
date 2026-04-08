import type {
  AdminAssessmentInsightRow,
  AdminAssessmentStatusDatum,
  AdminDashboardAnalytics,
  AdminEducatorInsightRow,
  AdminStudentInsightDatum,
  AdminStudentInsightMetrics,
  AdminSummaryCard,
  AdminTopStudentRow,
} from '@/lib/supabase/admin-dashboard-types'

export interface AdminUserRow {
  id: number
  user_type: string
  user_id: string
  given_name: string
  surname: string
  email: string
  is_active: boolean
  deleted_at: string | null
}

export interface AdminSectionRow {
  id: number
  educator_id: number
  section_name: string
  is_active: boolean
}

export interface AdminSubjectRow {
  id: number
  educator_id: number
  sections_id: number
  subject_name: string
  subject_code: string
  is_active: boolean
}

export interface AdminModuleRow {
  id: number
  educator_id: number
  subject_id: number
  section_id: number
  module_code: string
  is_active: boolean
}

export interface AdminEnrollmentRow {
  id: number
  student_id: number
  educator_id: number
  subject_id: number
  is_active: boolean
  created_at: string
}

export interface AdminScoreRow {
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

export interface AdminDashboardSource {
  users: AdminUserRow[]
  sections: AdminSectionRow[]
  subjects: AdminSubjectRow[]
  modules: AdminModuleRow[]
  enrollments: AdminEnrollmentRow[]
  scores: AdminScoreRow[]
}

interface LatestScoreContext {
  score: AdminScoreRow | null
  latestState: AdminAssessmentStatusDatum['key']
  isFinished: boolean
  isPassed: boolean
  isFailed: boolean
}

interface StudentRankingRow {
  studentId: number
  studentName: string
  studentCode: string
  subjectName: string
  sectionName: string
  weightedAverage: number
  bestPercent: number
  passedCount: number
  finishedCount: number
  latestSubmittedAt: string | null
}

const ASSESSMENT_STATUS_META: Record<AdminAssessmentStatusDatum['key'], { label: string; fill: string }> = {
  notStarted: {
    label: 'Not Started',
    fill: 'var(--chart-4)',
  },
  inProgress: {
    label: 'In Progress',
    fill: 'var(--chart-3)',
  },
  passed: {
    label: 'Passed',
    fill: 'var(--chart-2)',
  },
  failed: {
    label: 'Failed',
    fill: 'var(--chart-1)',
  },
}

// getMonthKey - normalize a date string to month precision
export function getMonthKey(dateValue: string) {
  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

// buildRecentMonthBuckets - build the last N month labels
export function buildRecentMonthBuckets(monthCount: number, now = new Date()) {
  return Array.from({ length: monthCount }, (_, index) => {
    const bucketDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (monthCount - index - 1), 1))
    const monthKey = `${bucketDate.getUTCFullYear()}-${String(bucketDate.getUTCMonth() + 1).padStart(2, '0')}`
    const monthLabel = bucketDate.toLocaleString('en-US', {
      month: 'short',
      timeZone: 'UTC',
    })

    return {
      monthKey,
      monthLabel,
    }
  })
}

// getLatestScoresByStudentModule - keep the newest score row per student and module
export function getLatestScoresByStudentModule(scores: AdminScoreRow[]) {
  return scores.reduce<Map<string, AdminScoreRow>>((result, score) => {
    const scoreKey = `${score.student_id}:${score.module_id}`
    const currentScore = result.get(scoreKey)

    if (!currentScore || score.id > currentScore.id) {
      result.set(scoreKey, score)
    }

    return result
  }, new Map<string, AdminScoreRow>())
}

// getLatestScoreContext - derive the display state for one latest score row
export function getLatestScoreContext(score: AdminScoreRow | null): LatestScoreContext {
  if (!score) {
    return {
      score,
      latestState: 'notStarted',
      isFinished: false,
      isPassed: false,
      isFailed: false,
    }
  }

  const isFinished = Boolean(score.submitted_at)
  const isPassed = score.status === 'passed' || score.is_passed
  const isFailed = score.status === 'failed'

  if (isPassed) {
    return {
      score,
      latestState: 'passed',
      isFinished,
      isPassed: true,
      isFailed: false,
    }
  }

  if (isFailed) {
    return {
      score,
      latestState: 'failed',
      isFinished,
      isPassed: false,
      isFailed: true,
    }
  }

  if (score.status === 'in_progress' && !score.submitted_at) {
    return {
      score,
      latestState: 'inProgress',
      isFinished: false,
      isPassed: false,
      isFailed: false,
    }
  }

  return {
    score,
    latestState: 'inProgress',
    isFinished,
    isPassed: false,
    isFailed: false,
  }
}

// getFullName - build a user display name
export function getFullName(user: Pick<AdminUserRow, 'given_name' | 'surname'>) {
  return `${user.given_name} ${user.surname}`.trim()
}

// getPercentage - safely convert a score to a percent
export function getPercentage(score: number | null, totalQuestions: number) {
  if (score === null || totalQuestions <= 0) {
    return 0
  }

  return (score / totalQuestions) * 100
}

// buildAdminDashboardAnalytics - shape the full dashboard payload from source rows
export function buildAdminDashboardAnalytics(
  source: AdminDashboardSource,
  now = new Date()
): AdminDashboardAnalytics {
  // ==================== SOURCE MAPS ====================
  const activeUsers = source.users.filter((user) => user.is_active && !user.deleted_at)
  const activeStudents = activeUsers.filter((user) => user.user_type === 'student')
  const activeEducators = activeUsers.filter((user) => user.user_type === 'educator')
  const activeSections = source.sections.filter((section) => section.is_active)
  const activeSubjects = source.subjects.filter((subject) => subject.is_active)
  const activeModules = source.modules.filter((module) => module.is_active)
  const activeEnrollments = source.enrollments.filter((enrollment) => enrollment.is_active)

  const studentMap = new Map(activeStudents.map((student) => [student.id, student]))
  const educatorMap = new Map(activeEducators.map((educator) => [educator.id, educator]))
  const sectionMap = new Map(activeSections.map((section) => [section.id, section]))
  const subjectMap = new Map(activeSubjects.map((subject) => [subject.id, subject]))
  const moduleMap = new Map(activeModules.map((module) => [module.id, module]))

  const latestScoreMap = getLatestScoresByStudentModule(source.scores)
  const latestScores = [...latestScoreMap.values()]
  const latestContexts = latestScores.map((score) => getLatestScoreContext(score))

  // ==================== SUMMARY CARDS ====================
  const summaryCards: AdminSummaryCard[] = [
    {
      key: 'students',
      label: 'Total Students',
      value: activeStudents.length,
      helper: 'Active student accounts',
    },
    {
      key: 'educators',
      label: 'Total Educators',
      value: activeEducators.length,
      helper: 'Active educator accounts',
    },
    {
      key: 'sections',
      label: 'Total Sections',
      value: activeSections.length,
      helper: 'Published classroom sections',
    },
    {
      key: 'subjects',
      label: 'Total Subjects',
      value: activeSubjects.length,
      helper: 'Active subject offerings',
    },
  ]

  // ==================== ASSESSMENT OVERVIEW ====================
  const uniqueEnrolledStudentIds = new Set(
    activeEnrollments
      .filter((enrollment) => studentMap.has(enrollment.student_id))
      .map((enrollment) => enrollment.student_id)
  )

  const assessmentOverview = {
    enrolledStudents: uniqueEnrolledStudentIds.size,
    finishedAssessments: latestContexts.filter((context) => context.isFinished).length,
    passedAssessments: latestContexts.filter((context) => context.isPassed).length,
    failedAssessments: latestContexts.filter((context) => context.isFailed).length,
  }

  const assessmentStatusCounts: Record<AdminAssessmentStatusDatum['key'], number> = {
    notStarted: 0,
    inProgress: 0,
    passed: 0,
    failed: 0,
  }

  latestContexts.forEach((context) => {
    assessmentStatusCounts[context.latestState] += 1
  })

  const assessmentStatusTotal = Object.values(assessmentStatusCounts).reduce(
    (total, value) => total + value,
    0
  )

  if (assessmentStatusTotal === 0 && assessmentOverview.enrolledStudents > 0) {
    assessmentStatusCounts.notStarted = assessmentOverview.enrolledStudents
  }

  const assessmentStatusChart: AdminAssessmentStatusDatum[] = (
    Object.keys(assessmentStatusCounts) as AdminAssessmentStatusDatum['key'][]
  ).map((statusKey) => ({
    key: statusKey,
    label: ASSESSMENT_STATUS_META[statusKey].label,
    value: assessmentStatusCounts[statusKey],
    fill: ASSESSMENT_STATUS_META[statusKey].fill,
  }))

  // ==================== TOP STUDENTS ====================
  const studentRankingMap = latestScores.reduce<Map<number, StudentRankingRow & { weightedScore: number; weightedTotal: number }>>(
    (result, score) => {
      const student = studentMap.get(score.student_id)
      const subject = subjectMap.get(score.subject_id)
      const section = sectionMap.get(score.section_id)
      const context = getLatestScoreContext(score)

      if (!student || !subject || !section || !context.isFinished) {
        return result
      }

      const currentRow = result.get(score.student_id) || {
        studentId: student.id,
        studentName: getFullName(student),
        studentCode: student.user_id,
        subjectName: subject.subject_name,
        sectionName: section.section_name,
        weightedAverage: 0,
        bestPercent: 0,
        passedCount: 0,
        finishedCount: 0,
        latestSubmittedAt: null,
        weightedScore: 0,
        weightedTotal: 0,
      }

      currentRow.weightedScore += score.score ?? 0
      currentRow.weightedTotal += score.total_questions
      currentRow.finishedCount += 1

      if (context.isPassed) {
        currentRow.passedCount += 1
      }

      const currentPercent = getPercentage(score.score, score.total_questions)
      const savedPercent = currentRow.bestPercent

      if (currentPercent >= savedPercent) {
        currentRow.subjectName = subject.subject_name
        currentRow.sectionName = section.section_name
        currentRow.bestPercent = currentPercent
      }

      if (!currentRow.latestSubmittedAt || (score.submitted_at && score.submitted_at > currentRow.latestSubmittedAt)) {
        currentRow.latestSubmittedAt = score.submitted_at
      }

      currentRow.weightedAverage =
        currentRow.weightedTotal > 0 ? (currentRow.weightedScore / currentRow.weightedTotal) * 100 : 0

      result.set(score.student_id, currentRow)
      return result
    },
    new Map<number, StudentRankingRow & { weightedScore: number; weightedTotal: number }>()
  )

  const topStudents: AdminTopStudentRow[] = [...studentRankingMap.values()]
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
    .map(({ weightedScore: _weightedScore, weightedTotal: _weightedTotal, bestPercent: _bestPercent, ...row }) => row)

  // ==================== STUDENT INSIGHTS ====================
  const monthBuckets = buildRecentMonthBuckets(6, now)
  const monthBucketMap = monthBuckets.reduce<Map<string, AdminStudentInsightDatum>>((result, bucket) => {
    result.set(bucket.monthKey, {
      monthKey: bucket.monthKey,
      monthLabel: bucket.monthLabel,
      enrolledCount: 0,
      finishedCount: 0,
      passedCount: 0,
    })
    return result
  }, new Map<string, AdminStudentInsightDatum>())

  activeEnrollments.forEach((enrollment) => {
    const monthKey = getMonthKey(enrollment.created_at)

    if (!monthKey) {
      return
    }

    const bucket = monthBucketMap.get(monthKey)

    if (bucket) {
      bucket.enrolledCount += 1
    }
  })

  latestScores.forEach((score) => {
    const context = getLatestScoreContext(score)
    const monthKey = score.submitted_at ? getMonthKey(score.submitted_at) : null

    if (!monthKey) {
      return
    }

    const bucket = monthBucketMap.get(monthKey)

    if (!bucket || !context.isFinished) {
      return
    }

    bucket.finishedCount += 1

    if (context.isPassed) {
      bucket.passedCount += 1
    }
  })

  const studentInsightMetrics: AdminStudentInsightMetrics = {
    totalEnrolledStudents: uniqueEnrolledStudentIds.size,
    finishedAssessments: assessmentOverview.finishedAssessments,
    passRate:
      assessmentOverview.finishedAssessments > 0
        ? (assessmentOverview.passedAssessments / assessmentOverview.finishedAssessments) * 100
        : 0,
  }

  // ==================== EDUCATOR INSIGHTS ====================
  const educatorInsights: AdminEducatorInsightRow[] = activeEducators
    .map((educator) => {
      const educatorSections = activeSections.filter((section) => section.educator_id === educator.id)
      const educatorSubjects = activeSubjects.filter((subject) => subject.educator_id === educator.id)
      const educatorEnrollments = activeEnrollments.filter((enrollment) => enrollment.educator_id === educator.id)
      const educatorLatestScores = latestScores.filter((score) => score.educator_id === educator.id)
      const educatorFinishedCount = educatorLatestScores.filter((score) => getLatestScoreContext(score).isFinished).length
      const educatorPassedCount = educatorLatestScores.filter((score) => getLatestScoreContext(score).isPassed).length

      return {
        educatorId: educator.id,
        educatorName: getFullName(educator),
        educatorEmail: educator.email,
        sectionCount: educatorSections.length,
        subjectCount: educatorSubjects.length,
        enrolledStudentCount: new Set(educatorEnrollments.map((enrollment) => enrollment.student_id)).size,
        finishedAssessmentCount: educatorFinishedCount,
        passRate: educatorFinishedCount > 0 ? (educatorPassedCount / educatorFinishedCount) * 100 : 0,
      }
    })
    .sort((leftRow, rightRow) => rightRow.enrolledStudentCount - leftRow.enrolledStudentCount)

  // ==================== ASSESSMENT INSIGHTS ====================
  const enrolledCountBySubject = activeEnrollments.reduce<Map<number, number>>((result, enrollment) => {
    result.set(enrollment.subject_id, (result.get(enrollment.subject_id) || 0) + 1)
    return result
  }, new Map<number, number>())

  const assessmentInsights: AdminAssessmentInsightRow[] = activeModules
    .map((module) => {
      const educator = educatorMap.get(module.educator_id)
      const subject = subjectMap.get(module.subject_id)
      const section = sectionMap.get(module.section_id)
      const moduleLatestScores = latestScores.filter((score) => score.module_id === module.id)
      const finishedAssessmentCount = moduleLatestScores.filter((score) => getLatestScoreContext(score).isFinished).length
      const passedAssessmentCount = moduleLatestScores.filter((score) => getLatestScoreContext(score).isPassed).length
      const failedAssessmentCount = moduleLatestScores.filter((score) => getLatestScoreContext(score).isFailed).length

      return {
        moduleId: module.id,
        moduleCode: module.module_code,
        subjectName: subject?.subject_name || 'Unknown Subject',
        sectionName: section?.section_name || 'Unknown Section',
        educatorName: educator ? getFullName(educator) : 'Unknown Educator',
        enrolledStudentCount: enrolledCountBySubject.get(module.subject_id) || 0,
        finishedAssessmentCount,
        passedAssessmentCount,
        failedAssessmentCount,
      }
    })
    .sort((leftRow, rightRow) => rightRow.finishedAssessmentCount - leftRow.finishedAssessmentCount)

  return {
    summaryCards,
    assessmentOverview,
    assessmentStatusChart,
    topStudents,
    studentInsights: {
      chartData: monthBuckets.map((bucket) => monthBucketMap.get(bucket.monthKey) || {
        monthKey: bucket.monthKey,
        monthLabel: bucket.monthLabel,
        enrolledCount: 0,
        finishedCount: 0,
        passedCount: 0,
      }),
      metrics: studentInsightMetrics,
    },
    educatorInsights,
    assessmentInsights,
  }
}
